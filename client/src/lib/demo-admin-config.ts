/**
 * Demo Admin config — UI prototype only.
 * See docs/backend/DEMO_ADMIN_UI.md. Not ACCEPTED ADR-002/012/013.
 */

import { getPricingConfig } from "./demo-pricing-config";

export const DEMO_ADMIN_USERNAME = "admin";
export const DEMO_ADMIN_PASSWORD = "HoshBlass@Admin";

/** Fallback defaults — live rates come from getPricingConfig(). User-confirmed 75/25. */
export const DEMO_DRIVER_SHARE_RATE = 0.75;
export const DEMO_PLATFORM_SHARE_RATE = 0.25;

/** User-confirmed: alert when stars ≤ this value. */
export const DEMO_BAD_RATING_MAX_STARS = 2;

export const DEMO_ADMIN_SESSION_KEY = "sareee-admin-session-v1";

export function getDriverShareRate(driverId?: string | null): number {
  const cfg = getPricingConfig();
  if (driverId && cfg.driverShareOverrides[driverId] != null) {
    return Math.min(1, Math.max(0, cfg.driverShareOverrides[driverId]!));
  }
  return Math.min(1, Math.max(0, cfg.defaultDriverShareRate));
}

export function getDriverBonus(driverId?: string | null): number {
  if (!driverId) return 0;
  const cfg = getPricingConfig();
  return Math.max(0, Math.round(cfg.driverBonuses[driverId] ?? 0));
}

export function splitDemoDeliveryCharge(
  totalCharge: number,
  driverId?: string | null,
): {
  driverEarning: number;
  platformShare: number;
  shareRate: number;
  bonus: number;
} {
  const shareRate = getDriverShareRate(driverId);
  const bonus = getDriverBonus(driverId);
  const baseCut = Math.round(totalCharge * shareRate);
  const driverEarning = baseCut + bonus;
  const platformShare = Math.max(0, totalCharge - baseCut);
  return { driverEarning, platformShare, shareRate, bonus };
}

export function isDemoBadRating(stars: number): boolean {
  return stars <= DEMO_BAD_RATING_MAX_STARS;
}
