import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import {
  ADMIN_OPS_ROOM,
  DISPATCH_OFFER_CREATED,
  DISPATCH_OFFER_EXPIRED,
  DRIVER_LOCATION_UPDATED,
  ORDER_STATUS_CHANGED,
  RATING_REQUESTED,
  driverRoom,
  orderRoom,
} from './realtime-events';

export type OfferEndStatus = 'expired' | 'rejected' | 'cancelled';

/**
 * Emits ADR-016 events after the database write has committed.
 * REST stays authoritative if a socket misses the event.
 */
@Injectable()
export class RealtimePublisher {
  constructor(private readonly gateway: RealtimeGateway) {}

  orderStatusChanged(input: {
    orderId: string;
    status: string;
    customerUserId: string;
    assignedDriverUserId: string | null;
  }): void {
    this.gateway.joinUser(input.customerUserId, orderRoom(input.orderId));
    if (input.assignedDriverUserId) {
      this.gateway.joinUser(input.assignedDriverUserId, orderRoom(input.orderId));
    }
    const payload = { orderId: input.orderId, status: input.status };
    this.gateway.emit(orderRoom(input.orderId), ORDER_STATUS_CHANGED, payload);
    this.gateway.emit(ADMIN_OPS_ROOM, ORDER_STATUS_CHANGED, payload);
    if (input.status === 'COMPLETED') {
      this.gateway.emit(orderRoom(input.orderId), RATING_REQUESTED, { orderId: input.orderId });
    }
  }

  driverLocationUpdated(input: {
    driverUserId: string;
    orderIds: string[];
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    capturedAt: string;
    freshness: string;
  }): void {
    const point = {
      driverUserId: input.driverUserId,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracyMeters: input.accuracyMeters,
      capturedAt: input.capturedAt,
      freshness: input.freshness,
    };
    for (const orderId of input.orderIds) {
      this.gateway.emit(orderRoom(orderId), DRIVER_LOCATION_UPDATED, { ...point, orderId });
    }
    this.gateway.emit(ADMIN_OPS_ROOM, DRIVER_LOCATION_UPDATED, point);
  }

  offerCreated(driverUserId: string, offer: { id: string; order: { id: string } }): void {
    this.gateway.emit(driverRoom(driverUserId), DISPATCH_OFFER_CREATED, offer);
    this.gateway.emit(ADMIN_OPS_ROOM, DISPATCH_OFFER_CREATED, {
      offerId: offer.id,
      orderId: offer.order.id,
      driverUserId,
    });
  }

  offerEnded(
    driverUserId: string,
    input: { offerId: string; orderId: string; status: OfferEndStatus },
  ): void {
    this.gateway.emit(driverRoom(driverUserId), DISPATCH_OFFER_EXPIRED, input);
    this.gateway.emit(ADMIN_OPS_ROOM, DISPATCH_OFFER_EXPIRED, { ...input, driverUserId });
  }
}
