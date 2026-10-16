import { assertIdempotencyKey, canonicalJson, hashRequestBody } from './idempotency';

describe('idempotency', () => {
  it('requires a key of 8 to 128 characters', () => {
    expect(assertIdempotencyKey('12345678')).toBe('12345678');
    expect(() => assertIdempotencyKey('short')).toThrow(/8–128/);
    expect(() => assertIdempotencyKey(undefined)).toThrow(/8–128/);
    expect(() => assertIdempotencyKey('x'.repeat(129))).toThrow(/8–128/);
  });

  it('hashes the same body regardless of key order', () => {
    const a = hashRequestBody({ b: 1, a: { d: 2, c: 3 } });
    const b = hashRequestBody({ a: { c: 3, d: 2 }, b: 1 });
    expect(a).toBe(b);
    expect(canonicalJson({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
    expect(hashRequestBody({ a: 1 })).not.toBe(hashRequestBody({ a: 2 }));
  });
});
