/** ADR-016 rooms. Clients never supply these names. */
export const ADMIN_OPS_ROOM = 'admin:ops';

export function orderRoom(orderId: string): string {
  return `order:${orderId}`;
}

export function driverRoom(userId: string): string {
  return `driver:${userId}`;
}

export const ORDER_STATUS_CHANGED = 'order.status.changed';
export const DRIVER_LOCATION_UPDATED = 'driver.location.updated';
export const DISPATCH_OFFER_CREATED = 'dispatch.offer.created';
export const DISPATCH_OFFER_EXPIRED = 'dispatch.offer.expired';
export const RATING_REQUESTED = 'rating.requested';
