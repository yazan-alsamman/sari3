import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeliveryMode, WeightClass } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ZonesService } from '../zones/zones.service';
import { calculatePrice } from './pricing.calculator';
import {
  PRICING_CURRENCY_CODE,
  PRICING_CURRENCY_FULL,
  PRICING_CURRENCY_LABEL,
  PricingConfig,
} from './pricing.defaults';
import { PreviewPriceDto, PublishPricingRuleDto } from './dto/pricing.dto';

@Injectable()
export class PricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly zones: ZonesService,
    private readonly audit: AuditService,
  ) {}

  private asConfig(raw: unknown): PricingConfig {
    const c = raw as PricingConfig;
    if (!c?.zoneBases || typeof c.zoneBases !== 'object') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Invalid pricing config',
      });
    }
    return {
      zoneBases: c.zoneBases,
      crossZoneMultiplier: Number(c.crossZoneMultiplier ?? 1),
      vipSurchargeRate: Number(c.vipSurchargeRate ?? 0),
      perStop: Number(c.perStop ?? 0),
      heavySurcharge: Number(c.heavySurcharge ?? 0),
      routeOverrides: c.routeOverrides ?? {},
    };
  }

  async getActiveRule() {
    const rule = await this.prisma.pricingRuleVersion.findFirst({
      where: { active: true },
      orderBy: { version: 'desc' },
    });
    if (!rule) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'No active pricing rule',
      });
    }
    return rule;
  }

  async listRulesAdmin() {
    return this.prisma.pricingRuleVersion.findMany({
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        active: true,
        currencyCode: true,
        currencyLabel: true,
        configJson: true,
        notes: true,
        createdAt: true,
        createdByUserId: true,
      },
    });
  }

  async publishRule(actorUserId: string, dto: PublishPricingRuleDto) {
    const cfg = dto.config;
    const activeZones = await this.prisma.serviceZone.findMany({
      where: { active: true },
    });
    for (const z of activeZones) {
      if (cfg.zoneBases[z.nameAr] === undefined) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: `Missing zoneBases entry for active zone: ${z.nameAr}`,
        });
      }
    }

    const latest = await this.prisma.pricingRuleVersion.findFirst({
      orderBy: { version: 'desc' },
    });
    const nextVersion = (latest?.version ?? 0) + 1;

    const created = await this.prisma.$transaction(async (tx) => {
      await tx.pricingRuleVersion.updateMany({
        where: { active: true },
        data: { active: false },
      });
      return tx.pricingRuleVersion.create({
        data: {
          version: nextVersion,
          active: true,
          currencyCode: PRICING_CURRENCY_CODE,
          currencyLabel: PRICING_CURRENCY_LABEL,
          configJson: {
            zoneBases: cfg.zoneBases,
            crossZoneMultiplier: cfg.crossZoneMultiplier,
            vipSurchargeRate: cfg.vipSurchargeRate,
            perStop: cfg.perStop,
            heavySurcharge: cfg.heavySurcharge,
            routeOverrides: cfg.routeOverrides ?? {},
          },
          createdByUserId: actorUserId,
          notes: dto.notes,
        },
      });
    });

    await this.audit.record({
      actorUserId,
      action: 'pricing.publish',
      targetType: 'pricing_rule_version',
      targetId: created.id,
      after: { version: created.version },
      reason: dto.notes,
    });
    return created;
  }

  private async resolvePreview(dto: PreviewPriceDto) {
    const pickup = await this.zones.requireActiveById(dto.pickupZoneId);
    const delivery = await this.zones.requireActiveById(dto.deliveryZoneId);
    const rule = await this.getActiveRule();
    const cfg = this.asConfig(rule.configJson);
    const mode = dto.mode ?? DeliveryMode.standard;
    const weightClass = dto.weightClass ?? WeightClass.light;
    const intermediateStopCount = dto.intermediateStopCount ?? 0;

    let calc;
    try {
      calc = calculatePrice(cfg, {
        pickupZoneName: pickup.nameAr,
        deliveryZoneName: delivery.nameAr,
        mode,
        weightClass,
        intermediateStopCount,
      });
    } catch {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Pricing config missing base for selected zone',
      });
    }

    return {
      rule,
      pickup,
      delivery,
      mode,
      weightClass,
      intermediateStopCount,
      calc,
      currencyCode: rule.currencyCode,
      currencyLabel: rule.currencyLabel,
      currencyFull: PRICING_CURRENCY_FULL,
    };
  }

  async preview(dto: PreviewPriceDto) {
    const r = await this.resolvePreview(dto);
    return {
      pricingRuleVersionId: r.rule.id,
      pricingRuleVersion: r.rule.version,
      pickupZoneId: r.pickup.id,
      deliveryZoneId: r.delivery.id,
      pickupZoneName: r.pickup.nameAr,
      deliveryZoneName: r.delivery.nameAr,
      mode: r.mode,
      weightClass: r.weightClass,
      intermediateStopCount: r.intermediateStopCount,
      currencyCode: r.currencyCode,
      currencyLabel: r.currencyLabel,
      currencyFull: r.currencyFull,
      baseAmount: r.calc.baseAmount,
      modeSurcharge: r.calc.modeSurcharge,
      stopsSurcharge: r.calc.stopsSurcharge,
      heavySurcharge: r.calc.heavySurcharge,
      totalAmount: r.calc.totalAmount,
      usedRouteOverride: r.calc.usedRouteOverride,
    };
  }

  async createSnapshot(dto: PreviewPriceDto) {
    const r = await this.resolvePreview(dto);
    const components = {
      baseAmount: r.calc.baseAmount,
      modeSurcharge: r.calc.modeSurcharge,
      stopsSurcharge: r.calc.stopsSurcharge,
      heavySurcharge: r.calc.heavySurcharge,
      totalAmount: r.calc.totalAmount,
      usedRouteOverride: r.calc.usedRouteOverride,
      pricingRuleVersion: r.rule.version,
    };

    const snap = await this.prisma.priceSnapshot.create({
      data: {
        pricingRuleVersionId: r.rule.id,
        pickupZoneId: r.pickup.id,
        deliveryZoneId: r.delivery.id,
        pickupZoneName: r.pickup.nameAr,
        deliveryZoneName: r.delivery.nameAr,
        mode: r.mode,
        weightClass: r.weightClass,
        intermediateStopCount: r.intermediateStopCount,
        currencyCode: r.currencyCode,
        currencyLabel: r.currencyLabel,
        baseAmount: r.calc.baseAmount,
        modeSurcharge: r.calc.modeSurcharge,
        stopsSurcharge: r.calc.stopsSurcharge,
        heavySurcharge: r.calc.heavySurcharge,
        totalAmount: r.calc.totalAmount,
        componentsJson: components,
      },
    });

    return {
      snapshotId: snap.id,
      ...components,
      currencyCode: snap.currencyCode,
      currencyLabel: snap.currencyLabel,
      currencyFull: PRICING_CURRENCY_FULL,
      pickupZoneId: snap.pickupZoneId,
      deliveryZoneId: snap.deliveryZoneId,
      pickupZoneName: snap.pickupZoneName,
      deliveryZoneName: snap.deliveryZoneName,
      mode: snap.mode,
      weightClass: snap.weightClass,
      intermediateStopCount: snap.intermediateStopCount,
      createdAt: snap.createdAt,
    };
  }

  async getSnapshot(id: string) {
    const snap = await this.prisma.priceSnapshot.findUnique({ where: { id } });
    if (!snap) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Price snapshot not found',
      });
    }
    return snap;
  }
}
