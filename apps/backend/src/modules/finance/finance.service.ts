import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LedgerEntryKind, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  IDEMPOTENCY_TTL_MS,
  assertIdempotencyKey,
  hashRequestBody,
} from '../idempotency/idempotency';
import { PostAdjustmentDto, TripBonusDto } from './dto/finance.dto';
import { splitDeliveryCharge } from './ledger-split';
import { ReportPeriod, reportWindow } from './report-window';

type Actor = { userId: string; role: Role };
type Tx = Prisma.TransactionClient;

const DRIVER_KINDS: LedgerEntryKind[] = [
  LedgerEntryKind.delivery_driver_earning,
  LedgerEntryKind.driver_bonus,
  LedgerEntryKind.penalty,
  LedgerEntryKind.adjustment,
  LedgerEntryKind.settlement_payout,
];

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async postCompletedOrder(tx: Tx, orderId: string): Promise<void> {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { priceSnapshot: true },
    });
    if (!order?.assignedDriverUserId) return;
    const existing = await tx.ledgerEntry.findFirst({
      where: { orderId: order.id, kind: LedgerEntryKind.delivery_driver_earning },
    });
    if (existing) return;

    const profile = await tx.driverProfile.findUnique({
      where: { userId: order.assignedDriverUserId },
      select: { tripBonusAmount: true },
    });
    const bonus = Math.max(0, profile?.tripBonusAmount ?? 0);
    const split = splitDeliveryCharge(order.priceSnapshot.totalAmount, bonus);
    const currencyCode = order.priceSnapshot.currencyCode;
    await tx.ledgerEntry.createMany({
      data: [
        {
          driverUserId: order.assignedDriverUserId,
          orderId: order.id,
          kind: LedgerEntryKind.delivery_driver_earning,
          amount: split.driverBase,
          currencyCode,
        },
        {
          driverUserId: order.assignedDriverUserId,
          orderId: order.id,
          kind: LedgerEntryKind.delivery_platform_share,
          amount: split.platformShare,
          currencyCode,
        },
        ...(bonus > 0
          ? [
              {
                driverUserId: order.assignedDriverUserId,
                orderId: order.id,
                kind: LedgerEntryKind.driver_bonus,
                amount: bonus,
                currencyCode,
              },
            ]
          : []),
      ],
    });
  }

  async listMine(actor: Actor) {
    const rows = await this.prisma.ledgerEntry.findMany({
      where: { driverUserId: actor.userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((row) => this.present(row));
  }

  async earnings(actor: Actor) {
    const window = reportWindow('day');
    const rows = await this.prisma.ledgerEntry.findMany({
      where: { driverUserId: actor.userId, kind: { in: DRIVER_KINDS } },
    });
    const today = rows.filter((row) => row.createdAt >= window.from && row.createdAt < window.to);
    return {
      currencyCode: rows[0]?.currencyCode ?? 'SYP',
      balance: rows.reduce((sum, row) => sum + row.amount, 0),
      todayEarning: today
        .filter(
          (row) =>
            row.kind === LedgerEntryKind.delivery_driver_earning ||
            row.kind === LedgerEntryKind.driver_bonus,
        )
        .reduce((sum, row) => sum + row.amount, 0),
    };
  }

  async listForDriver(driverProfileId: string) {
    const driver = await this.profile(driverProfileId);
    const rows = await this.prisma.ledgerEntry.findMany({
      where: { driverUserId: driver.userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((row) => this.present(row));
  }

  async setTripBonus(actor: Actor, driverProfileId: string, dto: TripBonusDto) {
    const driver = await this.profile(driverProfileId);
    const updated = await this.prisma.driverProfile.update({
      where: { id: driver.id },
      data: { tripBonusAmount: dto.amount },
    });
    await this.audit.record({
      actorUserId: actor.userId,
      action: 'driver.trip_bonus',
      targetType: 'driver_profile',
      targetId: driver.id,
      before: { tripBonusAmount: driver.tripBonusAmount },
      after: { tripBonusAmount: updated.tripBonusAmount },
    });
    return { driverProfileId: driver.id, tripBonusAmount: updated.tripBonusAmount };
  }

  async adjust(
    actor: Actor,
    driverProfileId: string,
    idempotencyKey: string | undefined,
    path: string,
    dto: PostAdjustmentDto,
  ) {
    let key: string;
    try {
      key = assertIdempotencyKey(idempotencyKey);
    } catch (error) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Invalid Idempotency-Key',
      });
    }
    if (dto.kind === 'penalty' && dto.amount < 0) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Penalty amount must be positive',
      });
    }
    const requestHash = hashRequestBody(dto);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const replay = await tx.idempotencyRecord.findUnique({
          where: { actorUserId_method_path_key: { actorUserId: actor.userId, method: 'POST', path, key } },
        });
        if (replay) {
          if (replay.expiresAt < new Date()) {
            await tx.idempotencyRecord.delete({ where: { id: replay.id } });
          } else if (replay.requestHash !== requestHash) {
            throw new ConflictException({
              code: 'IDEMPOTENCY_CONFLICT',
              message: 'Idempotency-Key was already used with a different body',
            });
          } else {
            return replay.responseBody;
          }
        }
        const driver = await tx.driverProfile.findUnique({ where: { id: driverProfileId } });
        if (!driver) {
          throw new NotFoundException({ code: 'NOT_FOUND', message: 'Driver not found' });
        }
        if (dto.orderId) {
          const order = await tx.order.findUnique({ where: { id: dto.orderId } });
          if (!order) throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'Order not found' });
        }
        const amount = dto.kind === 'penalty' ? -dto.amount : dto.amount;
        const row = await tx.ledgerEntry.create({
          data: {
            driverUserId: driver.userId,
            orderId: dto.orderId,
            kind: dto.kind === 'penalty' ? LedgerEntryKind.penalty : LedgerEntryKind.adjustment,
            amount,
            currencyCode: 'SYP',
            reason: dto.reason.trim(),
            actorUserId: actor.userId,
          },
        });
        await tx.auditLog.create({
          data: {
            actorUserId: actor.userId,
            action: dto.kind === 'penalty' ? 'ledger.penalty' : 'ledger.adjustment',
            targetType: 'ledger_entry',
            targetId: row.id,
            afterJson: { amount, kind: row.kind, driverUserId: driver.userId, orderId: dto.orderId ?? null },
            reason: dto.reason.trim(),
          },
        });
        const body = this.present(row);
        await tx.idempotencyRecord.create({
          data: {
            actorUserId: actor.userId,
            method: 'POST',
            path,
            key,
            requestHash,
            responseStatus: 200,
            responseBody: body,
            expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
          },
        });
        return body;
      });
    } catch (error) {
      if (!this.isUnique(error)) throw error;
      const existing = await this.prisma.idempotencyRecord.findUnique({
        where: { actorUserId_method_path_key: { actorUserId: actor.userId, method: 'POST', path, key } },
      });
      if (!existing || existing.expiresAt < new Date() || existing.requestHash !== requestHash) throw error;
      return existing.responseBody;
    }
  }

  async report(period: ReportPeriod) {
    const window = reportWindow(period);
    const rows = await this.prisma.ledgerEntry.findMany({
      where: { createdAt: { gte: window.from, lt: window.to } },
    });
    const sum = (kind: LedgerEntryKind) =>
      rows.filter((row) => row.kind === kind).reduce((total, row) => total + row.amount, 0);
    const driverBase = sum(LedgerEntryKind.delivery_driver_earning);
    const platformShare = sum(LedgerEntryKind.delivery_platform_share);
    const bonus = sum(LedgerEntryKind.driver_bonus);
    const orderIds = new Set(
      rows.filter((row) => row.kind === LedgerEntryKind.delivery_driver_earning && row.orderId).map((row) => row.orderId),
    );
    return {
      period,
      from: window.from.toISOString(),
      to: window.to.toISOString(),
      currencyCode: 'SYP',
      orderCount: orderIds.size,
      totalCharge: driverBase + platformShare,
      driverEarning: driverBase + bonus,
      platformShare,
      bonus,
      penalty: sum(LedgerEntryKind.penalty),
      adjustment: sum(LedgerEntryKind.adjustment),
    };
  }

  private async profile(driverProfileId: string) {
    const driver = await this.prisma.driverProfile.findUnique({ where: { id: driverProfileId } });
    if (!driver) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Driver not found' });
    return driver;
  }

  private present(row: {
    id: string;
    orderId: string | null;
    driverUserId: string | null;
    kind: LedgerEntryKind;
    amount: number;
    currencyCode: string;
    reason: string | null;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      orderId: row.orderId,
      driverUserId: row.driverUserId,
      kind: row.kind,
      amount: row.amount,
      currencyCode: row.currencyCode,
      reason: row.reason,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private isUnique(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    );
  }
}
