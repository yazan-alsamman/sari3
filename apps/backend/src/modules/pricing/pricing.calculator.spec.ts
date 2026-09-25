import { calculatePrice } from './pricing.calculator';
import { PricingConfig } from './pricing.defaults';

const cfg: PricingConfig = {
  zoneBases: {
    'حوش بلاس': 15000,
    دوما: 21000,
  },
  crossZoneMultiplier: 1.15,
  vipSurchargeRate: 0.4,
  perStop: 5000,
  heavySurcharge: 2000,
  routeOverrides: {
    'حوش بلاس→دوما': 25000,
  },
};

describe('calculatePrice', () => {
  it('averages same-zone bases', () => {
    const r = calculatePrice(cfg, {
      pickupZoneName: 'حوش بلاس',
      deliveryZoneName: 'حوش بلاس',
      mode: 'standard',
      weightClass: 'light',
      intermediateStopCount: 0,
    });
    expect(r.baseAmount).toBe(15000);
    expect(r.totalAmount).toBe(15000);
    expect(r.usedRouteOverride).toBe(false);
  });

  it('applies cross-zone multiplier', () => {
    const r = calculatePrice(
      { ...cfg, routeOverrides: {} },
      {
        pickupZoneName: 'حوش بلاس',
        deliveryZoneName: 'دوما',
        mode: 'standard',
        weightClass: 'light',
        intermediateStopCount: 0,
      },
    );
    const avg = Math.round((15000 + 21000) / 2);
    expect(r.baseAmount).toBe(Math.round(avg * 1.15));
  });

  it('uses route override and VIP + stops + heavy', () => {
    const r = calculatePrice(cfg, {
      pickupZoneName: 'حوش بلاس',
      deliveryZoneName: 'دوما',
      mode: 'vip',
      weightClass: 'heavy',
      intermediateStopCount: 2,
    });
    expect(r.usedRouteOverride).toBe(true);
    expect(r.baseAmount).toBe(25000);
    expect(r.modeSurcharge).toBe(Math.round(25000 * 0.4));
    expect(r.stopsSurcharge).toBe(10000);
    expect(r.heavySurcharge).toBe(2000);
    expect(r.totalAmount).toBe(
      25000 + Math.round(25000 * 0.4) + 10000 + 2000,
    );
  });
});
