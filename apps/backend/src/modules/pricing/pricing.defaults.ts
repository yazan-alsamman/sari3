/** ADR-005 v1 named service areas — matches demo INDUSTRIAL_AREAS (no OTHER). */
export const V1_SERVICE_ZONES: ReadonlyArray<{
  code: string;
  nameAr: string;
  sortOrder: number;
  /** Demo seed base (ل.س.ج) — LAUNCH_PATH / ADR-006 demo defaults */
  seedBaseAmount: number;
}> = [
  { code: 'hosh_blass', nameAr: 'حوش بلاس', sortOrder: 1, seedBaseAmount: 15000 },
  { code: 'sinaa', nameAr: 'صناعة', sortOrder: 2, seedBaseAmount: 18000 },
  { code: 'baramkeh', nameAr: 'برامكة', sortOrder: 3, seedBaseAmount: 17000 },
  { code: 'mezzeh', nameAr: 'مزة', sortOrder: 4, seedBaseAmount: 20000 },
  { code: 'jaramana', nameAr: 'جرمانا', sortOrder: 5, seedBaseAmount: 19000 },
  { code: 'garage_tinawi', nameAr: 'كراج تيناوي', sortOrder: 6, seedBaseAmount: 16000 },
  { code: 'garage_nakhil', nameAr: 'كراج النخيل', sortOrder: 7, seedBaseAmount: 16000 },
  { code: 'garage_khan_zadeh', nameAr: 'كراج خان زاده', sortOrder: 8, seedBaseAmount: 16500 },
  { code: 'sinaaiyat_tall', nameAr: 'صناعية تل', sortOrder: 9, seedBaseAmount: 17500 },
  { code: 'douma', nameAr: 'دوما', sortOrder: 10, seedBaseAmount: 21000 },
];

/** ADR-006 currency (owner-confirmed). */
export const PRICING_CURRENCY_CODE = 'SYP';
export const PRICING_CURRENCY_LABEL = 'ل.س.ج';
export const PRICING_CURRENCY_FULL = 'الليرة السورية الجديدة (ل.س.ج)';

/**
 * Demo seed calculator config (client DEFAULT_PRICING_CONFIG minus finance shares).
 * Changing amounts after seed is an admin action, not an engineering invent.
 */
export function buildSeedPricingConfig(
  zoneBases: Record<string, number>,
): PricingConfig {
  return {
    zoneBases,
    crossZoneMultiplier: 1.15,
    vipSurchargeRate: 0.4,
    perStop: 5000,
    heavySurcharge: 0,
    routeOverrides: {},
  };
}

export type PricingConfig = {
  zoneBases: Record<string, number>;
  crossZoneMultiplier: number;
  vipSurchargeRate: number;
  perStop: number;
  /** Flat amount for weightClass=heavy (may be 0 at launch — ADR-006) */
  heavySurcharge: number;
  /** Key `${fromNameAr}→${toNameAr}` replaces averaged base */
  routeOverrides: Record<string, number>;
};

export function routeKey(fromNameAr: string, toNameAr: string): string {
  return `${fromNameAr.trim()}→${toNameAr.trim()}`;
}
