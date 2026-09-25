import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  V1_SERVICE_ZONES,
  PRICING_CURRENCY_CODE,
  PRICING_CURRENCY_LABEL,
  buildSeedPricingConfig,
} from '../pricing/pricing.defaults';

@Injectable()
export class ZonesSeedService implements OnModuleInit {
  private readonly logger = new Logger(ZonesSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureZones();
    await this.ensureActivePricingRule();
  }

  private async ensureZones() {
    for (const z of V1_SERVICE_ZONES) {
      await this.prisma.serviceZone.upsert({
        where: { code: z.code },
        create: {
          code: z.code,
          nameAr: z.nameAr,
          active: true,
          sortOrder: z.sortOrder,
        },
        update: {
          nameAr: z.nameAr,
          sortOrder: z.sortOrder,
        },
      });
    }
    this.logger.log(`Ensured ${V1_SERVICE_ZONES.length} service zones (ADR-005)`);
  }

  private async ensureActivePricingRule() {
    const active = await this.prisma.pricingRuleVersion.findFirst({
      where: { active: true },
    });
    if (active) return;

    const zones = await this.prisma.serviceZone.findMany({
      where: { active: true },
    });
    const zoneBases: Record<string, number> = {};
    for (const z of zones) {
      const seed = V1_SERVICE_ZONES.find((s) => s.code === z.code);
      if (seed) zoneBases[z.nameAr] = seed.seedBaseAmount;
    }

    await this.prisma.pricingRuleVersion.create({
      data: {
        version: 1,
        active: true,
        currencyCode: PRICING_CURRENCY_CODE,
        currencyLabel: PRICING_CURRENCY_LABEL,
        configJson: buildSeedPricingConfig(zoneBases),
        notes: 'Seed from demo defaults (LAUNCH_PATH / ADR-006)',
      },
    });
    this.logger.log('Seeded pricing rule version 1 (demo defaults)');
  }
}
