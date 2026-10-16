import { createHash } from 'crypto';

export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

export function assertIdempotencyKey(key: string | undefined): string {
  const trimmed = (key ?? '').trim();
  if (trimmed.length < 8 || trimmed.length > 128) {
    throw Object.assign(new Error('Idempotency-Key must be 8–128 characters'), {
      code: 'VALIDATION_ERROR',
    });
  }
  return trimmed;
}

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(',')}]`;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(',')}}`;
}

export function hashRequestBody(body: unknown): string {
  return createHash('sha256').update(canonicalJson(body)).digest('hex');
}
