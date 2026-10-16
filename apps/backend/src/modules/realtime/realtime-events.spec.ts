import { ADMIN_OPS_ROOM, driverRoom, orderRoom } from './realtime-events';

describe('realtime rooms', () => {
  it('keeps order and driver rooms distinct', () => {
    expect(orderRoom('ord-1')).toBe('order:ord-1');
    expect(driverRoom('ord-1')).toBe('driver:ord-1');
    expect(orderRoom('ord-1')).not.toBe(driverRoom('ord-1'));
  });

  it('uses one admin operations room', () => {
    expect(ADMIN_OPS_ROOM).toBe('admin:ops');
  });
});
