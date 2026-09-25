import type { DeliveryMode, DemoPriceBreakdown } from "./types";
import { DEMO_CURRENCY_FULL, DEMO_CURRENCY_LABEL } from "./demo-currency";
import {
  getPricingConfig,
  routeKey,
} from "./demo-pricing-config";
import { INDUSTRIAL_AREAS } from "./demo-pricing-areas";

/**
 * DEMO pricing only — NOT authoritative.
 * Amounts come from Admin-editable local config (still ADR-006 PROPOSED).
 */
export const DEMO_PRICING_DISCLAIMER =
  `معاينة سعر تجريبية بـ${DEMO_CURRENCY_LABEL} — قابلة للتعديل من لوحة الأدمن (ADR-006 غير معتمد بعد)`;

function normalizeArea(area: string, zoneBases: Record<string, number>): string {
  const trimmed = area.trim();
  const known = Object.keys(zoneBases).find((z) => trimmed.includes(z));
  return known ?? "أخرى";
}

export function calculateDemoPrice(input: {
  pickupArea: string;
  deliveryArea: string;
  mode: DeliveryMode;
  intermediateStopCount: number;
}): DemoPriceBreakdown {
  const cfg = getPricingConfig();
  const pickupZone = normalizeArea(input.pickupArea, cfg.zoneBases);
  const deliveryZone = normalizeArea(input.deliveryArea, cfg.zoneBases);

  const fixed =
    cfg.routeOverrides[routeKey(pickupZone, deliveryZone)] ??
    cfg.routeOverrides[routeKey(input.pickupArea.trim(), input.deliveryArea.trim())];

  let baseAmount: number;
  if (typeof fixed === "number" && fixed > 0) {
    baseAmount = Math.round(fixed);
  } else {
    const pickupBase = cfg.zoneBases[pickupZone] ?? cfg.zoneBases["أخرى"] ?? 17000;
    const deliveryBase =
      cfg.zoneBases[deliveryZone] ?? cfg.zoneBases["أخرى"] ?? 17000;
    baseAmount = Math.round((pickupBase + deliveryBase) / 2);
    if (pickupZone !== deliveryZone) {
      baseAmount = Math.round(baseAmount * cfg.crossZoneMultiplier);
    }
  }

  const modeSurcharge =
    input.mode === "vip"
      ? Math.round(baseAmount * cfg.vipSurchargeRate)
      : 0;
  const stopsSurcharge =
    Math.max(0, input.intermediateStopCount) * cfg.perStop;
  const total = baseAmount + modeSurcharge + stopsSurcharge;

  return {
    currencyLabel: DEMO_CURRENCY_FULL,
    baseAmount,
    modeSurcharge,
    stopsSurcharge,
    total,
    isDemo: true,
    disclaimer: DEMO_PRICING_DISCLAIMER,
  };
}

export { INDUSTRIAL_AREAS };

export const DEMO_DRIVER = {
  name: "أحمد معروف",
  phone: "0944123456",
  plate: "دمشق · د 45821",
  etaMinutes: 30,
};
