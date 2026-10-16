import { OrderStatus } from '@prisma/client';

export type OrderAction =
  | 'confirm_price'
  | 'submit_order'
  | 'cancel'
  | 'start_to_pickup'
  | 'confirm_pickup'
  | 'mark_in_transit'
  | 'confirm_delivery'
  | 'complete';

/** Customer may cancel through DRIVER_TO_PICKUP. No fee until a commercial sheet is signed (ADR-004). */
const CUSTOMER_CANCEL_FROM = new Set<OrderStatus>([
  OrderStatus.DRAFT,
  OrderStatus.PRICE_CONFIRMED,
  OrderStatus.SEARCHING_DRIVER,
  OrderStatus.DRIVER_OFFERED,
  OrderStatus.DRIVER_ACCEPTED,
  OrderStatus.DRIVER_TO_PICKUP,
]);

const NEXT: Record<string, OrderStatus> = {
  [`${OrderStatus.DRAFT}:confirm_price`]: OrderStatus.PRICE_CONFIRMED,
  [`${OrderStatus.PRICE_CONFIRMED}:submit_order`]: OrderStatus.SEARCHING_DRIVER,
  [`${OrderStatus.DRIVER_ACCEPTED}:start_to_pickup`]: OrderStatus.DRIVER_TO_PICKUP,
  [`${OrderStatus.DRIVER_TO_PICKUP}:confirm_pickup`]: OrderStatus.PICKED_UP,
  [`${OrderStatus.PICKED_UP}:mark_in_transit`]: OrderStatus.IN_TRANSIT,
  [`${OrderStatus.IN_TRANSIT}:confirm_delivery`]: OrderStatus.DELIVERED,
  [`${OrderStatus.DELIVERED}:complete`]: OrderStatus.COMPLETED,
};

export class IllegalTransitionError extends Error {
  readonly code = 'ORDER_INVALID_STATE';

  constructor(from: OrderStatus, action: OrderAction) {
    super(`Illegal transition ${from} via ${action}`);
  }
}

export function nextStatus(from: OrderStatus, action: OrderAction): OrderStatus {
  if (action === 'cancel') {
    if (!CUSTOMER_CANCEL_FROM.has(from)) {
      throw new IllegalTransitionError(from, action);
    }
    return OrderStatus.CANCELLED;
  }
  const next = NEXT[`${from}:${action}`];
  if (!next) throw new IllegalTransitionError(from, action);
  return next;
}
