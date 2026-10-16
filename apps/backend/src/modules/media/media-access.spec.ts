import {
  DOWNLOAD_TTL_SEC,
  ORPHAN_TTL_MS,
  isUnconfirmedOrphan,
  signMediaDownload,
  verifyMediaDownload,
} from './media-access';

describe('media access', () => {
  const secret = 'test-secret';
  const mediaId = 'med_1';

  it('accepts a signature until it expires', () => {
    const exp = Math.floor(Date.now() / 1000) + DOWNLOAD_TTL_SEC;
    const sig = signMediaDownload(secret, mediaId, exp);
    expect(verifyMediaDownload(secret, mediaId, exp, sig)).toBe(true);
    expect(verifyMediaDownload(secret, mediaId, exp, 'nope')).toBe(false);
    expect(verifyMediaDownload('other', mediaId, exp, sig)).toBe(false);
  });

  it('rejects an expired signature', () => {
    const exp = Math.floor(Date.now() / 1000) - 5;
    const sig = signMediaDownload(secret, mediaId, exp);
    expect(verifyMediaDownload(secret, mediaId, exp, sig)).toBe(false);
  });

  it('treats only unconfirmed objects older than 24h as orphans', () => {
    const now = new Date('2026-10-12T12:00:00.000Z');
    const fresh = new Date(now.getTime() - ORPHAN_TTL_MS + 1000);
    const stale = new Date(now.getTime() - ORPHAN_TTL_MS);
    expect(isUnconfirmedOrphan(fresh, null, now)).toBe(false);
    expect(isUnconfirmedOrphan(stale, null, now)).toBe(true);
    expect(isUnconfirmedOrphan(stale, now, now)).toBe(false);
  });
});
