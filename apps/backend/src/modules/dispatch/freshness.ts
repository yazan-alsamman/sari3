/** ADR-011. Urban motorcycle courier thresholds (Yalla Go / BeOrder style). */
export const FRESH_MAX_AGE_MS = 15_000;
export const AGING_MAX_AGE_MS = 45_000;
export const FUTURE_SKEW_MS = 5_000;
export const FRESH_MAX_ACCURACY_M = 30;
export const AGING_MAX_ACCURACY_M = 80;
export const SAMPLE_MIN_INTERVAL_MS = 5_000;
export const SAMPLE_MIN_DISTANCE_M = 20;
export const SAMPLE_RETENTION_MS = 24 * 60 * 60 * 1000;
/** ADR-007 recommended start. */
export const MAX_PARALLEL_OFFERS = 5;
/** ADR-007 offer window. */
export const OFFER_TTL_MS = 15_000;
/** Sweep cadence so a 15s offer expires on time. */
export const DISPATCH_SWEEP_MS = 5_000;

export type FreshnessClass = 'fresh' | 'aging' | 'stale' | 'unknown';

export function classifyLocation(input: {
  capturedAt: Date;
  receivedAt: Date;
  accuracyMeters: number;
}): FreshnessClass {
  if (!Number.isFinite(input.accuracyMeters) || input.accuracyMeters < 0) {
    return 'unknown';
  }
  const age = input.receivedAt.getTime() - input.capturedAt.getTime();
  if (age < -FUTURE_SKEW_MS || age > AGING_MAX_AGE_MS) return 'stale';
  if (input.accuracyMeters > AGING_MAX_ACCURACY_M) return 'stale';
  if (age <= FRESH_MAX_AGE_MS && input.accuracyMeters <= FRESH_MAX_ACCURACY_M) {
    return 'fresh';
  }
  if (age <= AGING_MAX_AGE_MS && input.accuracyMeters <= AGING_MAX_ACCURACY_M) {
    return 'aging';
  }
  return 'stale';
}

export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const r = 6_371_000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function shouldStoreSample(
  previous: { capturedAt: Date; lat: number; lng: number } | null,
  next: { capturedAt: Date; lat: number; lng: number },
): boolean {
  if (!previous) return true;
  const elapsed = next.capturedAt.getTime() - previous.capturedAt.getTime();
  if (elapsed >= SAMPLE_MIN_INTERVAL_MS) return true;
  return haversineMeters(previous, next) >= SAMPLE_MIN_DISTANCE_M;
}

/** ADR-009: no second offer while a trip is still before DELIVERED, because ETA is not provided. */
const BLOCKING_ACTIVE = new Set([
  'DRIVER_ACCEPTED',
  'DRIVER_TO_PICKUP',
  'PICKED_UP',
  'IN_TRANSIT',
]);

export function canTakeOffer(activeStatuses: string[]): boolean {
  if (activeStatuses.length >= 2) return false;
  return !activeStatuses.some((status) => BLOCKING_ACTIVE.has(status));
}
