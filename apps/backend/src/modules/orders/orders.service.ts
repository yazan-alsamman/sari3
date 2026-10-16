import { randomBytes } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MediaPurpose,
  OrderStatus,
  Prisma,
  Role,
  TransitionSource,
} from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { FinanceService } from '../finance/finance.service';
import { RealtimePublisher } from '../realtime/realtime.publisher';
import {
  IDEMPOTENCY_TTL_MS,
  assertIdempotencyKey,
  hashRequestBody,
} from '../idempotency/idempotency';
import { CancelOrderDto, CreateOrderDto, DeliverOrderDto } from './dto/order.dto';
import { IllegalTransitionError, OrderAction, nextStatus } from './order-transitions';

const orderInclude = {
  priceSnapshot: true,
} satisfies Prisma.OrderInclude;

type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export type Actor = { userId: string; role: Role };

function orderNumber(): string {
  return `SR-${Date.now().toString(36).toUpperCase()}${randomBytes(3).toString('hex').toUpperCase()}`;
}

function present(order: OrderRow) {
  const snap = order.priceSnapshot;
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerUserId: order.customerUserId,
    status: order.status,
    mode: order.mode,
    weightClass: order.weightClass,
    specialHandlingNotes: order.specialHandlingNotes,
    intermediateStopCount: order.intermediateStopCount,
    pickup: {
      zoneId: order.pickupZoneId,
      zoneName: snap.pickupZoneName,
      shopName: order.pickupShopName,
      landmark: order.pickupLandmark,
      lat: order.pickupLat,
      lng: order.pickupLng,
      photoMediaId: order.pickupPhotoMediaId,
    },
    delivery: {
      zoneId: order.deliveryZoneId,
      zoneName: snap.deliveryZoneName,
      shopName: order.deliveryShopName,
      landmark: order.deliveryLandmark,
      lat: order.deliveryLat,
      lng: order.deliveryLng,
      photoMediaId: order.deliveryPhotoMediaId,
    },
    price: {
      snapshotId: snap.id,
      currencyCode: snap.currencyCode,
      currencyLabel: snap.currencyLabel,
      baseAmount: snap.baseAmount,
      modeSurcharge: snap.modeSurcharge,
      stopsSurcharge: snap.stopsSurcharge,
      heavySurcharge: snap.heavySurcharge,
      totalAmount: snap.totalAmount,
    },
    assignedDriverUserId: order.assignedDriverUserId,
    deliveryProofMediaId: order.deliveryProofMediaId,
    cancelReason: order.cancelReason,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

function invalidState(error: IllegalTransitionError): ConflictException {
  return new ConflictException({ code: error.code, message: error.message });
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
    private readonly realtime: RealtimePublisher,
    private readonly ledger: FinanceService,
  ) {}

  async submit(actor: Actor, idempotencyKey: string | undefined, path: string, dto: CreateOrderDto) {
    let key: string;
    try {
      key = assertIdempotencyKey(idempotencyKey);
    } catch (error) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Invalid Idempotency-Key',
      });
    }
    this.assertCoordPair(dto.pickupLat, dto.pickupLng, 'Pickup');
    this.assertCoordPair(dto.deliveryLat, dto.deliveryLng, 'Delivery');

    const requestHash = hashRequestBody(dto);
    const quote = await this.pricing.preview({
      pickupZoneId: dto.pickupZoneId,
      deliveryZoneId: dto.deliveryZoneId,
      mode: dto.mode,
      weightClass: dto.weightClass,
      intermediateStopCount: dto.intermediateStopCount ?? 0,
    });

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const replay = await this.readReplay(tx, actor.userId, 'POST', path, key, requestHash);
        if (replay) return replay;

        await this.assertShopPhoto(tx, dto.pickupPhotoMediaId, actor.userId);
        await this.assertShopPhoto(tx, dto.deliveryPhotoMediaId, actor.userId);

        const snap = await tx.priceSnapshot.create({
          data: {
            pricingRuleVersionId: quote.pricingRuleVersionId,
            pickupZoneId: quote.pickupZoneId,
            deliveryZoneId: quote.deliveryZoneId,
            pickupZoneName: quote.pickupZoneName,
            deliveryZoneName: quote.deliveryZoneName,
            mode: quote.mode,
            weightClass: quote.weightClass,
            intermediateStopCount: quote.intermediateStopCount,
            currencyCode: quote.currencyCode,
            currencyLabel: quote.currencyLabel,
            baseAmount: quote.baseAmount,
            modeSurcharge: quote.modeSurcharge,
            stopsSurcharge: quote.stopsSurcharge,
            heavySurcharge: quote.heavySurcharge,
            totalAmount: quote.totalAmount,
            componentsJson: {
              baseAmount: quote.baseAmount,
              modeSurcharge: quote.modeSurcharge,
              stopsSurcharge: quote.stopsSurcharge,
              heavySurcharge: quote.heavySurcharge,
              totalAmount: quote.totalAmount,
              usedRouteOverride: quote.usedRouteOverride,
              pricingRuleVersion: quote.pricingRuleVersion,
            },
          },
        });

        const order = await this.insertOrder(tx, actor.userId, dto, snap.id, quote.intermediateStopCount);
        await tx.orderTransition.createMany({
          data: [
            {
              orderId: order.id,
              fromStatus: null,
              toStatus: OrderStatus.DRAFT,
              action: 'create',
              actorUserId: actor.userId,
              source: TransitionSource.customer,
            },
            {
              orderId: order.id,
              fromStatus: OrderStatus.DRAFT,
              toStatus: OrderStatus.PRICE_CONFIRMED,
              action: 'confirm_price',
              actorUserId: actor.userId,
              source: TransitionSource.customer,
            },
            {
              orderId: order.id,
              fromStatus: OrderStatus.PRICE_CONFIRMED,
              toStatus: OrderStatus.SEARCHING_DRIVER,
              action: 'submit_order',
              actorUserId: actor.userId,
              source: TransitionSource.customer,
            },
          ],
        });

        const body = present(await this.load(tx, order.id));
        await tx.idempotencyRecord.create({
          data: {
            actorUserId: actor.userId,
            method: 'POST',
            path,
            key,
            requestHash,
            responseStatus: 201,
            responseBody: body,
            expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
          },
        });
        return body;
      });
      this.notifyOrder(created);
      return created;
    } catch (error) {
      if (!this.isUnique(error)) throw error;
      const existing = await this.prisma.idempotencyRecord.findUnique({
        where: {
          actorUserId_method_path_key: {
            actorUserId: actor.userId,
            method: 'POST',
            path,
            key,
          },
        },
      });
      if (!existing || existing.expiresAt < new Date()) throw error;
      if (existing.requestHash !== requestHash) {
        throw new ConflictException({
          code: 'IDEMPOTENCY_CONFLICT',
          message: 'Idempotency-Key was already used with a different body',
        });
      }
      return existing.responseBody;
    }
  }

  async listMine(actor: Actor) {
    const rows = await this.prisma.order.findMany({
      where: { customerUserId: actor.userId },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(present);
  }

  async listAdmin(status?: string, orderNumber?: string) {
    if (status && !Object.values(OrderStatus).includes(status as OrderStatus)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Unknown order status',
      });
    }
    const number = orderNumber?.trim();
    const rows = await this.prisma.order.findMany({
      where: {
        ...(status ? { status: status as OrderStatus } : {}),
        ...(number ? { orderNumber: number } : {}),
      },
      include: orderInclude,
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    return rows.map(present);
  }

  async getForActor(actor: Actor, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });
    if (!order || !this.canSee(actor, order)) {
      throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'Order not found' });
    }
    return present(order);
  }

  async history(actor: Actor, orderId: string) {
    await this.getForActor(actor, orderId);
    return this.prisma.orderTransition.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        fromStatus: true,
        toStatus: true,
        action: true,
        source: true,
        reason: true,
        actorUserId: true,
        createdAt: true,
      },
    });
  }

  async cancel(actor: Actor, orderId: string, dto: CancelOrderDto) {
    const body = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order || order.customerUserId !== actor.userId) {
        throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'Order not found' });
      }
      let next: OrderStatus;
      try {
        next = nextStatus(order.status, 'cancel');
      } catch (error) {
        if (error instanceof IllegalTransitionError) throw invalidState(error);
        throw error;
      }
      const updated = await tx.order.updateMany({
        where: { id: order.id, status: order.status, customerUserId: actor.userId },
        data: { status: next, cancelReason: dto.reason ?? null },
      });
      if (updated.count !== 1) {
        throw new ConflictException({
          code: 'ORDER_INVALID_STATE',
          message: 'Order changed before cancel',
        });
      }
      await tx.orderTransition.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: next,
          action: 'cancel',
          actorUserId: actor.userId,
          source: TransitionSource.customer,
          reason: dto.reason,
        },
      });
      return present(await this.load(tx, order.id));
    });
    this.notifyOrder(body);
    return body;
  }

  async driverAction(
    actor: Actor,
    orderId: string,
    action: Exclude<OrderAction, 'confirm_price' | 'submit_order' | 'cancel'>,
    dto?: DeliverOrderDto,
  ) {
    const body = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order || order.assignedDriverUserId !== actor.userId) {
        throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'Order not found' });
      }
      let next: OrderStatus;
      try {
        next = nextStatus(order.status, action);
      } catch (error) {
        if (error instanceof IllegalTransitionError) throw invalidState(error);
        throw error;
      }
      if (action === 'confirm_delivery' && dto?.proofMediaId) {
        await this.assertProof(tx, dto.proofMediaId, actor.userId);
      }
      const updated = await tx.order.updateMany({
        where: { id: order.id, status: order.status, assignedDriverUserId: actor.userId },
        data: {
          status: next,
          ...(action === 'confirm_delivery' && dto?.proofMediaId
            ? { deliveryProofMediaId: dto.proofMediaId }
            : {}),
        },
      });
      if (updated.count !== 1) {
        throw new ConflictException({
          code: 'ORDER_INVALID_STATE',
          message: 'Order changed before the transition',
        });
      }
      await tx.orderTransition.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: next,
          action,
          actorUserId: actor.userId,
          source: TransitionSource.driver,
        },
      });
      if (next === OrderStatus.COMPLETED) {
        await this.ledger.postCompletedOrder(tx, order.id);
      }
      return present(await this.load(tx, order.id));
    });
    this.notifyOrder(body);
    return body;
  }

  private notifyOrder(body: unknown): void {
    if (!body || typeof body !== 'object') return;
    const row = body as {
      id?: unknown;
      status?: unknown;
      customerUserId?: unknown;
      assignedDriverUserId?: unknown;
    };
    if (typeof row.id !== 'string' || typeof row.status !== 'string' || typeof row.customerUserId !== 'string') {
      return;
    }
    this.realtime.orderStatusChanged({
      orderId: row.id,
      status: row.status,
      customerUserId: row.customerUserId,
      assignedDriverUserId: typeof row.assignedDriverUserId === 'string' ? row.assignedDriverUserId : null,
    });
  }

  private canSee(actor: Actor, order: { customerUserId: string; assignedDriverUserId: string | null }) {
    if (actor.role === Role.admin) return true;
    if (actor.role === Role.customer) return order.customerUserId === actor.userId;
    if (actor.role === Role.driver) return order.assignedDriverUserId === actor.userId;
    return false;
  }

  private async readReplay(
    tx: Prisma.TransactionClient,
    actorUserId: string,
    method: string,
    path: string,
    key: string,
    requestHash: string,
  ) {
    const existing = await tx.idempotencyRecord.findUnique({
      where: { actorUserId_method_path_key: { actorUserId, method, path, key } },
    });
    if (!existing) return null;
    if (existing.expiresAt < new Date()) {
      await tx.idempotencyRecord.delete({ where: { id: existing.id } });
      return null;
    }
    if (existing.requestHash !== requestHash) {
      throw new ConflictException({
        code: 'IDEMPOTENCY_CONFLICT',
        message: 'Idempotency-Key was already used with a different body',
      });
    }
    return existing.responseBody;
  }

  private async insertOrder(
    tx: Prisma.TransactionClient,
    customerUserId: string,
    dto: CreateOrderDto,
    priceSnapshotId: string,
    intermediateStopCount: number,
  ) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await tx.order.create({
          data: {
            orderNumber: orderNumber(),
            customerUserId,
            status: OrderStatus.SEARCHING_DRIVER,
            mode: dto.mode,
            weightClass: dto.weightClass,
            specialHandlingNotes: dto.specialHandlingNotes,
            intermediateStopCount,
            pickupZoneId: dto.pickupZoneId,
            deliveryZoneId: dto.deliveryZoneId,
            pickupShopName: dto.pickupShopName,
            deliveryShopName: dto.deliveryShopName,
            pickupLandmark: dto.pickupLandmark,
            deliveryLandmark: dto.deliveryLandmark,
            pickupLat: dto.pickupLat,
            pickupLng: dto.pickupLng,
            deliveryLat: dto.deliveryLat,
            deliveryLng: dto.deliveryLng,
            pickupPhotoMediaId: dto.pickupPhotoMediaId,
            deliveryPhotoMediaId: dto.deliveryPhotoMediaId,
            priceSnapshotId,
          },
        });
      } catch (error) {
        if (this.isUnique(error, 'orderNumber')) continue;
        throw error;
      }
    }
    throw new ConflictException({
      code: 'ORDER_INVALID_STATE',
      message: 'Could not allocate an order number',
    });
  }

  private async load(tx: Prisma.TransactionClient, id: string): Promise<OrderRow> {
    const order = await tx.order.findUnique({ where: { id }, include: orderInclude });
    if (!order) {
      throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'Order not found' });
    }
    return order;
  }

  private async assertShopPhoto(
    tx: Prisma.TransactionClient,
    mediaId: string | undefined,
    ownerUserId: string,
  ) {
    if (!mediaId) return;
    const media = await tx.mediaObject.findUnique({ where: { id: mediaId } });
    if (
      !media?.confirmedAt ||
      media.purpose !== MediaPurpose.shop_landmark ||
      media.ownerUserId !== ownerUserId
    ) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Shop photo must be a confirmed upload owned by this account',
      });
    }
  }

  private async assertProof(tx: Prisma.TransactionClient, mediaId: string, ownerUserId: string) {
    const media = await tx.mediaObject.findUnique({ where: { id: mediaId } });
    if (
      !media?.confirmedAt ||
      media.purpose !== MediaPurpose.delivery_proof ||
      media.ownerUserId !== ownerUserId
    ) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Delivery proof must be a confirmed upload owned by this driver',
      });
    }
  }

  private assertCoordPair(lat: number | undefined, lng: number | undefined, label: string) {
    const hasLat = lat !== undefined;
    const hasLng = lng !== undefined;
    if (hasLat !== hasLng) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: `${label} needs both latitude and longitude`,
      });
    }
  }

  private isUnique(error: unknown, field?: string): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
      return false;
    }
    if (!field) return true;
    const target = error.meta?.target;
    const text = Array.isArray(target) ? target.join(',') : String(target ?? '');
    return text.includes(field);
  }
}
