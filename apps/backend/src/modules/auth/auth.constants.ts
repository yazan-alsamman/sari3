export const ACCESS_TOKEN_TTL_SEC = 15 * 60; // ADR-002 default
export const REFRESH_TOKEN_TTL_SEC = 30 * 24 * 60 * 60;
export const MAX_SESSIONS_PER_USER = 5; // ADR-002 recommended default

/** Minimal common-password blocklist (v1). */
export const COMMON_PASSWORDS = new Set(
  [
    'password',
    'password1',
    '12345678',
    '123456789',
    'qwerty123',
    '11111111',
    '00000000',
    'sareee123',
    'admin123',
    'letmein1',
  ].map((p) => p.toLowerCase()),
);

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) {
    return `+${digits.slice(1).replace(/\D/g, '')}`;
  }
  const only = digits.replace(/\D/g, '');
  // Syria local numbers often start with 09… — store as +9639…
  if (only.startsWith('09') && only.length >= 10) {
    return `+963${only.slice(1)}`;
  }
  if (only.startsWith('963')) {
    return `+${only}`;
  }
  return only.startsWith('+') ? only : `+${only}`;
}

export function assertPasswordPolicy(password: string): void {
  if (password.length < 8) {
    throw Object.assign(new Error('Password must be at least 8 characters'), {
      code: 'VALIDATION_ERROR',
    });
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    throw Object.assign(new Error('Password is too common'), {
      code: 'VALIDATION_ERROR',
    });
  }
}
