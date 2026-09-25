/**
 * Demo pricing & share config — editable from Admin UI, stored in localStorage.
 * Not ACCEPTED ADR-006 / ADR-013. Defaults match DEMO_ADMIN_UI.md (75/25).
 */

export const PRICING_CONFIG_KEY = "sareee-demo-pricing-config-v2";

export type DemoPricingConfig = {
  /** Per-area base (ل.س.ج) used when averaging pickup/delivery */
  zoneBases: Record<string, number>;
  crossZoneMultiplier: number;
  vipSurchargeRate: number;
  perStop: number;
  /** Default driver cut of delivery charge (0–1) */
  defaultDriverShareRate: number;
  /** Per-driver share override (0–1), keyed by driver account id */
  driverShareOverrides: Record<string, number>;
  /** Flat bonus (ل.س.ج) added to driver earning on each completed trip */
  driverBonuses: Record<string, number>;
  /**
   * Fixed route prices: key = `${from}→${to}`
   * When set, replaces averaged zone base (VIP/stops still apply).
   */
  routeOverrides: Record<string, number>;
};

export const DEFAULT_PRICING_CONFIG: DemoPricingConfig = {
  zoneBases: {
    "حوش بلاس": 15000,
    صناعة: 18000,
    برامكة: 17000,
    مزة: 20000,
    جرمانا: 19000,
    "كراج تيناوي": 16000,
    "كراج النخيل": 16000,
    "كراج خان زاده": 16500,
    "صناعية تل": 17500,
    دوما: 21000,
    أخرى: 17000,
  },
  crossZoneMultiplier: 1.15,
  vipSurchargeRate: 0.4,
  perStop: 5000,
  defaultDriverShareRate: 0.75,
  driverShareOverrides: {},
  driverBonuses: {},
  routeOverrides: {},
};

function readRaw(): DemoPricingConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PRICING_CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoPricingConfig;
  } catch {
    return null;
  }
}

export function getPricingConfig(): DemoPricingConfig {
  const saved = readRaw();
  if (!saved) return structuredClone(DEFAULT_PRICING_CONFIG);
  return {
    ...DEFAULT_PRICING_CONFIG,
    ...saved,
    zoneBases: {
      ...DEFAULT_PRICING_CONFIG.zoneBases,
      ...(saved.zoneBases ?? {}),
    },
    driverShareOverrides: saved.driverShareOverrides ?? {},
    driverBonuses: saved.driverBonuses ?? {},
    routeOverrides: saved.routeOverrides ?? {},
  };
}

export function savePricingConfig(next: DemoPricingConfig) {
  const clamped: DemoPricingConfig = {
    ...next,
    defaultDriverShareRate: Math.min(
      1,
      Math.max(0, next.defaultDriverShareRate),
    ),
    crossZoneMultiplier: Math.max(1, next.crossZoneMultiplier),
    vipSurchargeRate: Math.max(0, next.vipSurchargeRate),
    perStop: Math.max(0, Math.round(next.perStop)),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(PRICING_CONFIG_KEY, JSON.stringify(clamped));
    window.dispatchEvent(new CustomEvent("sareee-pricing-config"));
  }
  return clamped;
}

export function routeKey(from: string, to: string): string {
  return `${from.trim()}→${to.trim()}`;
}

export function subscribePricingConfig(listener: () => void): () => void {
  const on = () => listener();
  const onStorage = (e: StorageEvent) => {
    if (e.key === PRICING_CONFIG_KEY) listener();
  };
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("sareee-pricing-config", on);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("sareee-pricing-config", on);
    window.removeEventListener("storage", onStorage);
  };
}
