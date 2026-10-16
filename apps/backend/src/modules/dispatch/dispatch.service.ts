import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  BasketSize,
  DeliveryMode,
  DispatchOfferStatus,
  DriverApprovalStatus,
  OrderStatus,
  Prisma,
  TransitionSource,
  WeightClass,
} from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { splitDeliveryCharge } from '../finance/ledger-split';
import {
  assertIdempotencyKey,
  hashRequestBody,
  IDEMPOTENCY_TTL_MS,
} from '../idempotency/idempotency';
import { RealtimePublisher } from '../realtime/realtime.publisher';
import { AvailabilityDto, LocationSampleDto } from './dto/dispatch.dto';
import {
  canTakeOffer,
  classifyLocation,
  DISPATCH_SWEEP_MS,
  haversineMeters,
  MAX_PARALLEL_OFFERS,
  OFFER_TTL_MS,
  SAMPLE_RETENTION_MS,
  shouldStoreSample,
} from './freshness';

const TRACKING_STATUSES: OrderStatus[] = [
  OrderStatus.DRIVER_ACCEPTED,
  OrderStatus.DRIVER_TO_PICKUP,
  OrderStatus.PICKED_UP,
  OrderStatus.IN_TRANSIT,
];

const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.DRIVER_ACCEPTED,
  OrderStatus.DRIVER_TO_PICKUP,
  OrderStatus.PICKED_UP,
  OrderStatus.IN_TRANSIT,
  OrderStatus.DELIVERED,
];

type Actor = { userId: string; role: string };

function asAcceptResult(value: unknown): {
  body: { orderId: string; status: string; offerId: string };
  competitors: { id: string; driverUserId: string; orderId: string }[];
  customerUserId: string;
} | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as {
    body?: { orderId?: unknown; status?: unknown; offerId?: unknown };
    competitors?: unknown;
    customerUserId?: unknown;
  };
  if (!row.body || typeof row.customerUserId !== 'string' || !Array.isArray(row.competitors)) return null;
  if (typeof row.body.orderId !== 'string' || typeof row.body.status !== 'string' || typeof row.body.offerId !== 'string') {
    return null;
  }
  return {
    body: { orderId: row.body.orderId, status: row.body.status, offerId: row.body.offerId },
    competitors: row.competitors as { id: string; driverUserId: string; orderId: string }[],
    customerUserId: row.customerUserId,
  };
}

function asRejectResult(value: unknown): {
  body: { offerId: string; status: 'rejected' };
  orderId: string;
  driverUserId: string;
  customerUserId: string;
  orderStatus: string;
} | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as {
    body?: { offerId?: unknown; status?: unknown };
    orderId?: unknown;
    driverUserId?: unknown;
    customerUserId?: unknown;
    orderStatus?: unknown;
  };
  if (!row.body || typeof row.body.offerId !== 'string' || row.body.status !== 'rejected') return null;
  if (typeof row.orderId !== 'string' || typeof row.driverUserId !== 'string') return null;
  if (typeof row.customerUserId !== 'string' || typeof row.orderStatus !== 'string') return null;
  return {
    body: { offerId: row.body.offerId, status: 'rejected' },
    orderId: row.orderId,
    driverUserId: row.driverUserId,
    customerUserId: row.customerUserId,
    orderStatus: row.orderStatus,
  };
}

@Injectable()
export class DispatchService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DispatchService.name);
  private sweepTimer: NodeJS.Timeout | null = null;
  private retainTimer: NodeJS.Timeout | null = null;
  private sweeping = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimePublisher,
  ) {}

  onModuleInit(): void {
    this.sweepTimer = setInterval(() => {
      void this.sweep();
    }, DISPATCH_SWEEP_MS);
    this.retainTimer = setInterval(() => {
      void this.retainSamples();
    }, 60 * 60 * 1000);
    void this.sweep();
  }

  onModuleDestroy(): void {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
    if (this.retainTimer) clearInterval(this.retainTimer);
  }

  async setAvailability(actor: Actor, dto: AvailabilityDto) {
    await this.approvedDriver(actor.userId);
    const row = await this.prisma.driverAvailability.upsert({
      where: { userId: actor.userId },
      create: { userId: actor.userId, online: dto.online },
      update: { online: dto.online },
    });
    return { online: row.online, updatedAt: row.updatedAt.toISOString() };
  }

  async ingestLocation(actor: Actor, dto: LocationSampleDto) {
    await this.approvedDriver(actor.userId);
    const availability = await this.prisma.driverAvailability.findUnique({
      where: { userId: actor.userId },
    });
    if (!availability?.online) {
      throw new ConflictException({
        code: 'DRIVER_OFFLINE',
        message: 'Location is accepted only while the driver is online',
      });
    }
    const capturedAt = new Date(dto.capturedAt);
    const receivedAt = new Date();
    const previous = await this.prisma.driverLocationSample.findFirst({
      where: { driverUserId: actor.userId },
      orderBy: { receivedAt: 'desc' },
    });
    const store = shouldStoreSample(
      previous
        ? {
            capturedAt: previous.capturedAt,
            lat: previous.latitude,
            lng: previous.longitude,
          }
        : null,
      { capturedAt, lat: dto.latitude, lng: dto.longitude },
    );
    const sample = store
      ? await this.prisma.driverLocationSample.create({
          data: {
            driverUserId: actor.userId,
            latitude: dto.latitude,
            longitude: dto.longitude,
            accuracyMeters: dto.accuracyMeters,
            capturedAt,
            receivedAt,
          },
        })
      : previous!;
    const freshness = classifyLocation({
      capturedAt: sample.capturedAt,
      receivedAt: new Date(),
      accuracyMeters: sample.accuracyMeters,
    });
    const assigned = await this.prisma.order.findMany({
      where: { assignedDriverUserId: actor.userId, status: { in: TRACKING_STATUSES } },
      select: { id: true },
    });
    if (assigned.length > 0) {
      this.realtime.driverLocationUpdated({
        driverUserId: actor.userId,
        orderIds: assigned.map((row) => row.id),
        latitude: sample.latitude,
        longitude: sample.longitude,
        accuracyMeters: sample.accuracyMeters,
        capturedAt: sample.capturedAt.toISOString(),
        freshness,
      });
    }
    return {
      stored: store,
      freshness,
      capturedAt: sample.capturedAt.toISOString(),
      accuracyMeters: sample.accuracyMeters,
    };
  }

  async listOffers(actor: Actor) {
    await this.approvedDriver(actor.userId);
    const now = new Date();
    const rows = await this.prisma.dispatchOffer.findMany({
      where: {
        driverUserId: actor.userId,
        status: DispatchOfferStatus.offered,
        expiresAt: { gt: now },
      },
      include: {
        order: { include: { priceSnapshot: true, pickupZone: true, deliveryZone: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    const bonus = await this.tripBonus(actor.userId);
    return rows.map((row) => this.presentOffer(row, now, bonus));
  }

  async accept(actor: Actor, offerId: string, keyHeader: string | undefined, path: string) {
    const key = this.key(keyHeader);
    const hash = hashRequestBody({ offerId, action: 'accept' });
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const replay = await this.readReplay(tx, actor.userId, path, key, hash);
        if (replay) return replay;
        const offer = await tx.dispatchOffer.findUnique({ where: { id: offerId } });
        if (!offer || offer.driverUserId !== actor.userId) {
          throw new NotFoundException({ code: 'OFFER_NOT_FOUND', message: 'Offer not found' });
        }
        if (offer.status !== DispatchOfferStatus.offered || offer.expiresAt <= new Date()) {
          throw new ConflictException({
            code: 'OFFER_CLOSED',
            message: 'Offer is no longer open',
          });
        }
        const competitors = await tx.dispatchOffer.findMany({
          where: {
            orderId: offer.orderId,
            id: { not: offer.id },
            status: DispatchOfferStatus.offered,
          },
          select: { id: true, driverUserId: true, orderId: true },
        });
        const taken = await tx.order.updateMany({
          where: {
            id: offer.orderId,
            assignedDriverUserId: null,
            status: { in: [OrderStatus.SEARCHING_DRIVER, OrderStatus.DRIVER_OFFERED] },
          },
          data: {
            assignedDriverUserId: actor.userId,
            status: OrderStatus.DRIVER_ACCEPTED,
          },
        });
        if (taken.count !== 1) {
          throw new ConflictException({
            code: 'OFFER_TAKEN',
            message: 'Another driver already accepted this order',
          });
        }
        await tx.dispatchOffer.update({
          where: { id: offer.id },
          data: { status: DispatchOfferStatus.accepted, resolvedAt: new Date() },
        });
        await tx.dispatchOffer.updateMany({
          where: {
            orderId: offer.orderId,
            id: { not: offer.id },
            status: DispatchOfferStatus.offered,
          },
          data: { status: DispatchOfferStatus.cancelled, resolvedAt: new Date() },
        });
        const order = await tx.order.findUniqueOrThrow({ where: { id: offer.orderId } });
        await tx.orderTransition.create({
          data: {
            orderId: order.id,
            fromStatus: OrderStatus.DRIVER_OFFERED,
            toStatus: OrderStatus.DRIVER_ACCEPTED,
            action: 'accept_offer',
            actorUserId: actor.userId,
            source: TransitionSource.driver,
          },
        });
        const body = { orderId: order.id, status: order.status, offerId: offer.id };
        await this.storeReplay(tx, actor.userId, path, key, hash, 200, body);
        return { body, competitors, customerUserId: order.customerUserId };
      });
      const fresh = asAcceptResult(result);
      if (!fresh) return result;
      this.realtime.orderStatusChanged({
        orderId: fresh.body.orderId,
        status: fresh.body.status,
        customerUserId: fresh.customerUserId,
        assignedDriverUserId: actor.userId,
      });
      for (const row of fresh.competitors) {
        this.realtime.offerEnded(row.driverUserId, {
          offerId: row.id,
          orderId: row.orderId,
          status: 'cancelled',
        });
      }
      return fresh.body;
    } catch (error) {
      if (this.isUnique(error)) {
        const replay = await this.prisma.idempotencyRecord.findUnique({
          where: {
            actorUserId_method_path_key: {
              actorUserId: actor.userId,
              method: 'POST',
              path,
              key,
            },
          },
        });
        if (replay && replay.requestHash === hash) return replay.responseBody;
      }
      throw error;
    }
  }

  async reject(actor: Actor, offerId: string, keyHeader: string | undefined, path: string) {
    const key = this.key(keyHeader);
    const hash = hashRequestBody({ offerId, action: 'reject' });
    const result = await this.prisma.$transaction(async (tx) => {
      const replay = await this.readReplay(tx, actor.userId, path, key, hash);
      if (replay) return replay;
      const offer = await tx.dispatchOffer.findUnique({ where: { id: offerId } });
      if (!offer || offer.driverUserId !== actor.userId) {
        throw new NotFoundException({ code: 'OFFER_NOT_FOUND', message: 'Offer not found' });
      }
      if (offer.status !== DispatchOfferStatus.offered) {
        throw new ConflictException({ code: 'OFFER_CLOSED', message: 'Offer is no longer open' });
      }
      await tx.dispatchOffer.update({
        where: { id: offer.id },
        data: { status: DispatchOfferStatus.rejected, resolvedAt: new Date() },
      });
      const stillOpen = await tx.dispatchOffer.count({
        where: { orderId: offer.orderId, status: DispatchOfferStatus.offered },
      });
      if (stillOpen === 0) {
        await tx.order.updateMany({
          where: { id: offer.orderId, status: OrderStatus.DRIVER_OFFERED, assignedDriverUserId: null },
          data: { status: OrderStatus.SEARCHING_DRIVER },
        });
        await tx.orderTransition.create({
          data: {
            orderId: offer.orderId,
            fromStatus: OrderStatus.DRIVER_OFFERED,
            toStatus: OrderStatus.SEARCHING_DRIVER,
            action: 'reject_offer',
            actorUserId: actor.userId,
            source: TransitionSource.driver,
          },
        });
      }
      const body = { offerId: offer.id, status: 'rejected' as const };
      await this.storeReplay(tx, actor.userId, path, key, hash, 200, body);
      const current = await tx.order.findUnique({
        where: { id: offer.orderId },
        select: { customerUserId: true, status: true },
      });
      return {
        body,
        orderId: offer.orderId,
        driverUserId: offer.driverUserId,
        customerUserId: current?.customerUserId ?? null,
        orderStatus: current?.status ?? null,
      };
    });
    const fresh = asRejectResult(result);
    if (!fresh) return result;
    this.realtime.offerEnded(fresh.driverUserId, {
      offerId: fresh.body.offerId,
      orderId: fresh.orderId,
      status: 'rejected',
    });
    this.realtime.orderStatusChanged({
      orderId: fresh.orderId,
      status: fresh.orderStatus,
      customerUserId: fresh.customerUserId,
      assignedDriverUserId: null,
    });
    return fresh.body;
  }

  async tracking(actor: Actor, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'Order not found' });
    }
    const allowed =
      actor.role === 'admin' ||
      order.customerUserId === actor.userId ||
      order.assignedDriverUserId === actor.userId;
    if (!allowed) {
      throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'Order not found' });
    }
    if (!order.assignedDriverUserId) {
      return { orderId, freshness: 'unknown' as const, point: null };
    }
    const sample = await this.prisma.driverLocationSample.findFirst({
      where: { driverUserId: order.assignedDriverUserId },
      orderBy: { receivedAt: 'desc' },
    });
    if (!sample) return { orderId, freshness: 'unknown' as const, point: null };
    const freshness = classifyLocation({
      capturedAt: sample.capturedAt,
      receivedAt: new Date(),
      accuracyMeters: sample.accuracyMeters,
    });
    return {
      orderId,
      freshness,
      point: {
        latitude: sample.latitude,
        longitude: sample.longitude,
        accuracyMeters: sample.accuracyMeters,
        capturedAt: sample.capturedAt.toISOString(),
      },
    };
  }

  async sweep(): Promise<void> {
    if (this.sweeping) return;
    this.sweeping = true;
    try {
      await this.expireOffers();
      await this.fillOffers();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Dispatch sweep failed: ${message}`);
    } finally {
      this.sweeping = false;
    }
  }

  async retainSamples(): Promise<void> {
    const cutoff = new Date(Date.now() - SAMPLE_RETENTION_MS);
    await this.prisma.driverLocationSample.deleteMany({
      where: { receivedAt: { lt: cutoff } },
    });
  }

  private async expireOffers(): Promise<void> {
    const now = new Date();
    const due = await this.prisma.dispatchOffer.findMany({
      where: { status: DispatchOfferStatus.offered, expiresAt: { lte: now } },
      select: { id: true, orderId: true, driverUserId: true },
    });
    if (due.length === 0) return;
    await this.prisma.dispatchOffer.updateMany({
      where: { id: { in: due.map((row) => row.id) } },
      data: { status: DispatchOfferStatus.expired, resolvedAt: now },
    });
    for (const row of due) {
      this.realtime.offerEnded(row.driverUserId, {
        offerId: row.id,
        orderId: row.orderId,
        status: 'expired',
      });
    }
    const orderIds = [...new Set(due.map((row) => row.orderId))];
    for (const orderId of orderIds) {
      const stillOpen = await this.prisma.dispatchOffer.count({
        where: { orderId, status: DispatchOfferStatus.offered },
      });
      if (stillOpen > 0) continue;
      const changed = await this.prisma.order.updateMany({
        where: {
          id: orderId,
          status: OrderStatus.DRIVER_OFFERED,
          assignedDriverUserId: null,
        },
        data: { status: OrderStatus.SEARCHING_DRIVER },
      });
      if (changed.count === 1) {
        await this.prisma.orderTransition.create({
          data: {
            orderId,
            fromStatus: OrderStatus.DRIVER_OFFERED,
            toStatus: OrderStatus.SEARCHING_DRIVER,
            action: 'offer_expired',
            source: TransitionSource.system,
          },
        });
        const current = await this.prisma.order.findUnique({
          where: { id: orderId },
          select: { customerUserId: true, status: true, assignedDriverUserId: true },
        });
        if (current) {
          this.realtime.orderStatusChanged({
            orderId,
            status: current.status,
            customerUserId: current.customerUserId,
            assignedDriverUserId: current.assignedDriverUserId,
          });
        }
      }
    }
  }

  private async fillOffers(): Promise<void> {
    const orders = await this.prisma.order.findMany({
      where: { status: { in: [OrderStatus.SEARCHING_DRIVER, OrderStatus.DRIVER_OFFERED] } },
      include: { pickupZone: true, priceSnapshot: true },
      orderBy: { createdAt: 'asc' },
    });
    orders.sort((a, b) => Number(b.mode === DeliveryMode.vip) - Number(a.mode === DeliveryMode.vip));
    for (const order of orders) {
      const open = await this.prisma.dispatchOffer.count({
        where: { orderId: order.id, status: DispatchOfferStatus.offered },
      });
      const room = MAX_PARALLEL_OFFERS - open;
      if (room <= 0) continue;
      const drivers = await this.eligibleDrivers(order);
      const picked = drivers.slice(0, room);
      if (picked.length === 0) continue;
      const expiresAt = new Date(Date.now() + OFFER_TTL_MS);
      await this.prisma.$transaction(async (tx) => {
        await tx.dispatchOffer.createMany({
          data: picked.map((driver) => ({
            orderId: order.id,
            driverUserId: driver.userId,
            status: DispatchOfferStatus.offered,
            expiresAt,
          })),
        });
        if (order.status === OrderStatus.SEARCHING_DRIVER) {
          const moved = await tx.order.updateMany({
            where: { id: order.id, status: OrderStatus.SEARCHING_DRIVER },
            data: { status: OrderStatus.DRIVER_OFFERED },
          });
          if (moved.count === 1) {
            await tx.orderTransition.create({
              data: {
                orderId: order.id,
                fromStatus: OrderStatus.SEARCHING_DRIVER,
                toStatus: OrderStatus.DRIVER_OFFERED,
                action: 'create_offer',
                source: TransitionSource.system,
              },
            });
          }
        }
      });
      const created = await this.prisma.dispatchOffer.findMany({
        where: {
          orderId: order.id,
          status: DispatchOfferStatus.offered,
          driverUserId: { in: picked.map((driver) => driver.userId) },
          expiresAt,
        },
        include: {
          order: { include: { priceSnapshot: true, pickupZone: true, deliveryZone: true } },
        },
      });
      const now = new Date();
      const bonusByUser = await this.tripBonuses(created.map((row) => row.driverUserId));
      for (const row of created) {
        this.realtime.offerCreated(row.driverUserId, this.presentOffer(row, now, bonusByUser.get(row.driverUserId) ?? 0));
      }
      const fresh = await this.prisma.order.findUnique({
        where: { id: order.id },
        select: { status: true, customerUserId: true, assignedDriverUserId: true },
      });
      if (fresh) {
        this.realtime.orderStatusChanged({
          orderId: order.id,
          status: fresh.status,
          customerUserId: fresh.customerUserId,
          assignedDriverUserId: fresh.assignedDriverUserId,
        });
      }
    }
  }

  private async eligibleDrivers(order: {
    id: string;
    weightClass: WeightClass;
    pickupLat: number | null;
    pickupLng: number | null;
    pickupZone: { centroidLat: number | null; centroidLng: number | null };
  }) {
    const pickup = this.pickupPoint(order);
    const online = await this.prisma.driverAvailability.findMany({
      where: { online: true },
      select: { userId: true },
    });
    const ranked: Array<{ userId: string; ageMs: number; distanceM: number | null; activeCount: number }> = [];
    const now = Date.now();
    for (const row of online) {
      const profile = await this.prisma.driverProfile.findUnique({
        where: { userId: row.userId },
      });
      if (!profile || profile.approvalStatus !== DriverApprovalStatus.approved) continue;
      if (order.weightClass === WeightClass.heavy && profile.basketSize !== BasketSize.large) continue;
      const busyOffer = await this.prisma.dispatchOffer.findFirst({
        where: { driverUserId: row.userId, status: DispatchOfferStatus.offered },
      });
      if (busyOffer) continue;
      const already = await this.prisma.dispatchOffer.findFirst({
        where: {
          orderId: order.id,
          driverUserId: row.userId,
          status: { in: [DispatchOfferStatus.rejected, DispatchOfferStatus.offered, DispatchOfferStatus.accepted] },
        },
      });
      if (already) continue;
      const sample = await this.prisma.driverLocationSample.findFirst({
        where: { driverUserId: row.userId },
        orderBy: { receivedAt: 'desc' },
      });
      if (!sample) continue;
      const freshness = classifyLocation({
        capturedAt: sample.capturedAt,
        receivedAt: new Date(),
        accuracyMeters: sample.accuracyMeters,
      });
      if (freshness !== 'fresh') continue;
      const active = await this.prisma.order.findMany({
        where: { assignedDriverUserId: row.userId, status: { in: ACTIVE_ORDER_STATUSES } },
        select: { status: true },
      });
      if (!canTakeOffer(active.map((item) => item.status))) continue;
      const distanceM = pickup
        ? haversineMeters(
            { lat: sample.latitude, lng: sample.longitude },
            pickup,
          )
        : null;
      ranked.push({
        userId: row.userId,
        ageMs: now - sample.capturedAt.getTime(),
        distanceM,
        activeCount: active.length,
      });
    }
    ranked.sort((a, b) => {
      if (a.ageMs !== b.ageMs) return a.ageMs - b.ageMs;
      const da = a.distanceM ?? Number.POSITIVE_INFINITY;
      const db = b.distanceM ?? Number.POSITIVE_INFINITY;
      if (da !== db) return da - db;
      return a.activeCount - b.activeCount;
    });
    return ranked;
  }

  private pickupPoint(order: {
    pickupLat: number | null;
    pickupLng: number | null;
    pickupZone: { centroidLat: number | null; centroidLng: number | null };
  }): { lat: number; lng: number } | null {
    if (order.pickupLat != null && order.pickupLng != null) {
      return { lat: order.pickupLat, lng: order.pickupLng };
    }
    if (order.pickupZone.centroidLat != null && order.pickupZone.centroidLng != null) {
      return { lat: order.pickupZone.centroidLat, lng: order.pickupZone.centroidLng };
    }
    return null;
  }

  private async approvedDriver(userId: string) {
    const profile = await this.prisma.driverProfile.findUnique({ where: { userId } });
    if (!profile || profile.approvalStatus !== DriverApprovalStatus.approved) {
      throw new ConflictException({
        code: 'DRIVER_NOT_APPROVED',
        message: 'Driver is not approved',
      });
    }
    return profile;
  }

  private key(header: string | undefined): string {
    try {
      return assertIdempotencyKey(header);
    } catch (error) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Invalid Idempotency-Key',
      });
    }
  }

  private async readReplay(
    tx: Prisma.TransactionClient,
    actorUserId: string,
    path: string,
    key: string,
    hash: string,
  ) {
    const existing = await tx.idempotencyRecord.findUnique({
      where: { actorUserId_method_path_key: { actorUserId, method: 'POST', path, key } },
    });
    if (!existing || existing.expiresAt < new Date()) return null;
    if (existing.requestHash !== hash) {
      throw new ConflictException({
        code: 'IDEMPOTENCY_CONFLICT',
        message: 'Idempotency-Key was already used with a different body',
      });
    }
    return existing.responseBody;
  }

  private async storeReplay(
    tx: Prisma.TransactionClient,
    actorUserId: string,
    path: string,
    key: string,
    hash: string,
    responseStatus: number,
    responseBody: unknown,
  ) {
    await tx.idempotencyRecord.create({
      data: {
        actorUserId,
        method: 'POST',
        path,
        key,
        requestHash: hash,
        responseStatus,
        responseBody: responseBody as Prisma.InputJsonValue,
        expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
      },
    });
  }

  private isUnique(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    );
  }

  private async tripBonus(userId: string): Promise<number> {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
      select: { tripBonusAmount: true },
    });
    return Math.max(0, profile?.tripBonusAmount ?? 0);
  }

  private async tripBonuses(userIds: string[]): Promise<Map<string, number>> {
    const rows = await this.prisma.driverProfile.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, tripBonusAmount: true },
    });
    return new Map(rows.map((row) => [row.userId, Math.max(0, row.tripBonusAmount)]));
  }

  private presentOffer(
    row: {
      id: string;
      expiresAt: Date;
      createdAt: Date;
      order: {
        id: string;
        orderNumber: string;
        mode: DeliveryMode;
        weightClass: WeightClass;
        pickupShopName: string;
        deliveryShopName: string;
        priceSnapshot: { pickupZoneName: string; deliveryZoneName: string; totalAmount: number; currencyLabel: string };
      };
    },
    now: Date,
    bonus = 0,
  ) {
    const split = splitDeliveryCharge(row.order.priceSnapshot.totalAmount, bonus);
    return {
      id: row.id,
      expiresAt: row.expiresAt.toISOString(),
      expiresInSec: Math.max(0, Math.ceil((row.expiresAt.getTime() - now.getTime()) / 1000)),
      createdAt: row.createdAt.toISOString(),
      earnings: {
        driverEarning: split.driverEarning,
        platformShare: split.platformShare,
        bonus: split.bonus,
        currencyLabel: row.order.priceSnapshot.currencyLabel,
      },
      order: {
        id: row.order.id,
        orderNumber: row.order.orderNumber,
        mode: row.order.mode,
        weightClass: row.order.weightClass,
        pickup: {
          shopName: row.order.pickupShopName,
          area: row.order.priceSnapshot.pickupZoneName,
        },
        delivery: {
          shopName: row.order.deliveryShopName,
          area: row.order.priceSnapshot.deliveryZoneName,
        },
        price: {
          totalAmount: row.order.priceSnapshot.totalAmount,
          currencyLabel: row.order.priceSnapshot.currencyLabel,
        },
      },
    };
  }
}
