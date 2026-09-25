import { PricingConfig, routeKey } from './pricing.defaults';

export type PriceCalcInput = {
  pickupZoneName: string;
  deliveryZoneName: string;
  mode: 'standard' | 'vip';
  weightClass: 'light' | 'heavy';
  intermediateStopCount: number;
};

export type PriceCalcResult = {
  baseAmount: number;
  modeSurcharge: number;
  stopsSurcharge: number;
  heavySurcharge: number;
  totalAmount: number;
  usedRouteOverride: boolean;
};

/** Pure calculator — same rules as demo (ADR-006 Option A). */
export function calculatePrice(
  cfg: PricingConfig,
  input: PriceCalcInput,
): PriceCalcResult {
  const pickup = input.pickupZoneName.trim();
  const delivery = input.deliveryZoneName.trim();

  const fixed =
    cfg.routeOverrides[routeKey(pickup, delivery)] ??
    undefined;

  let baseAmount: number;
  let usedRouteOverride = false;
  if (typeof fixed === 'number' && fixed > 0) {
    baseAmount = Math.round(fixed);
    usedRouteOverride = true;
  } else {
    const pickupBase = cfg.zoneBases[pickup];
    const deliveryBase = cfg.zoneBases[delivery];
    if (pickupBase === undefined || deliveryBase === undefined) {
      throw new Error('ZONE_BASE_MISSING');
    }
    baseAmount = Math.round((pickupBase + deliveryBase) / 2);
    if (pickup !== delivery) {
      baseAmount = Math.round(baseAmount * cfg.crossZoneMultiplier);
    }
  }

  const modeSurcharge =
    input.mode === 'vip'
      ? Math.round(baseAmount * cfg.vipSurchargeRate)
      : 0;
  const stopsSurcharge =
    Math.max(0, input.intermediateStopCount) * Math.max(0, Math.round(cfg.perStop));
  const heavySurcharge =
    input.weightClass === 'heavy'
      ? Math.max(0, Math.round(cfg.heavySurcharge))
      : 0;
  const totalAmount = baseAmount + modeSurcharge + stopsSurcharge + heavySurcharge;

  return {
    baseAmount,
    modeSurcharge,
    stopsSurcharge,
    heavySurcharge,
    totalAmount,
    usedRouteOverride,
  };
}
