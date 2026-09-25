/**
 * Demo UI currency — الليرة السورية الجديدة (user-confirmed for prototype).
 * Absolute price tables remain demo (ADR-006 still PROPOSED).
 */

export const DEMO_CURRENCY_NAME = "الليرة السورية الجديدة";
/** Short label used next to amounts */
export const DEMO_CURRENCY_LABEL = "ل.س.ج";
export const DEMO_CURRENCY_FULL = "الليرة السورية الجديدة (ل.س.ج)";

/** Format integer amount for display (no silent rounding beyond integer fils). */
export function formatSyp(amount: number): string {
  const n = Math.round(Number.isFinite(amount) ? amount : 0);
  return `${n.toLocaleString("ar-SY")} ${DEMO_CURRENCY_LABEL}`;
}

export function formatSypParts(amount: number): { value: string; unit: string } {
  const n = Math.round(Number.isFinite(amount) ? amount : 0);
  return { value: n.toLocaleString("ar-SY"), unit: DEMO_CURRENCY_LABEL };
}
