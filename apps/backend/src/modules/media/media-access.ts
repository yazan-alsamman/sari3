import { createHmac, timingSafeEqual } from 'crypto';

/** ADR-015: download links are short-lived. v1 lifetime is 5 minutes. */
export const DOWNLOAD_TTL_SEC = 5 * 60;

/** ADR-015: unconfirmed uploads are orphans after 24 hours. */
export const ORPHAN_TTL_MS = 24 * 60 * 60 * 1000;

export function signMediaDownload(secret: string, mediaId: string, exp: number): string {
  return createHmac('sha256', secret).update(`${mediaId}.${exp}`).digest('base64url');
}

export function verifyMediaDownload(
  secret: string,
  mediaId: string,
  exp: number,
  sig: string,
): boolean {
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false;
  const expected = signMediaDownload(secret, mediaId, exp);
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isUnconfirmedOrphan(
  createdAt: Date,
  confirmedAt: Date | null,
  now: Date,
): boolean {
  if (confirmedAt) return false;
  return now.getTime() - createdAt.getTime() >= ORPHAN_TTL_MS;
}
