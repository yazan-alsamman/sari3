import { OrderStatus } from '@prisma/client';
import { IllegalTransitionError, nextStatus } from './order-transitions';

describe('order transitions', () => {
  it('walks the happy path after a driver is assigned', () => {
    let status: OrderStatus = OrderStatus.DRAFT;
    status = nextStatus(status, 'confirm_price');
    status = nextStatus(status, 'submit_order');
    expect(status).toBe(OrderStatus.SEARCHING_DRIVER);
    status = OrderStatus.DRIVER_ACCEPTED;
    status = nextStatus(status, 'start_to_pickup');
    status = nextStatus(status, 'confirm_pickup');
    status = nextStatus(status, 'mark_in_transit');
    status = nextStatus(status, 'confirm_delivery');
    status = nextStatus(status, 'complete');
    expect(status).toBe(OrderStatus.COMPLETED);
  });

  it('lets the customer cancel through DRIVER_TO_PICKUP and rejects later cancel', () => {
    expect(nextStatus(OrderStatus.SEARCHING_DRIVER, 'cancel')).toBe(OrderStatus.CANCELLED);
    expect(nextStatus(OrderStatus.DRIVER_TO_PICKUP, 'cancel')).toBe(OrderStatus.CANCELLED);
    expect(() => nextStatus(OrderStatus.PICKED_UP, 'cancel')).toThrow(IllegalTransitionError);
    expect(() => nextStatus(OrderStatus.COMPLETED, 'cancel')).toThrow(IllegalTransitionError);
  });

  it('rejects skipped states', () => {
    expect(() => nextStatus(OrderStatus.DRIVER_ACCEPTED, 'confirm_delivery')).toThrow(
      IllegalTransitionError,
    );
    expect(() => nextStatus(OrderStatus.IN_TRANSIT, 'complete')).toThrow(IllegalTransitionError);
  });
});
