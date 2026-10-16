/** Service city is Damascus (UTC+3, no DST). Week starts Monday, matching the ops UI. */
const DAMASCUS_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export type ReportPeriod = 'day' | 'week' | 'month' | 'year';

export function reportWindow(period: ReportPeriod, instant = new Date()): { from: Date; to: Date } {
  const parts = damascusParts(instant);
  if (period === 'day') {
    const from = damascusStart(parts.year, parts.month, parts.day);
    return { from, to: new Date(from.getTime() + DAY_MS) };
  }
  if (period === 'week') {
    const mondayOffset = (parts.weekday + 6) % 7;
    const from = new Date(damascusStart(parts.year, parts.month, parts.day).getTime() - mondayOffset * DAY_MS);
    return { from, to: new Date(from.getTime() + 7 * DAY_MS) };
  }
  if (period === 'month') {
    const from = damascusStart(parts.year, parts.month, 1);
    const to = parts.month === 12 ? damascusStart(parts.year + 1, 1, 1) : damascusStart(parts.year, parts.month + 1, 1);
    return { from, to };
  }
  return { from: damascusStart(parts.year, 1, 1), to: damascusStart(parts.year + 1, 1, 1) };
}

function damascusParts(instant: Date): { year: number; month: number; day: number; weekday: number } {
  const shifted = new Date(instant.getTime() + DAMASCUS_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
  };
}

function damascusStart(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day) - DAMASCUS_OFFSET_MS);
}
