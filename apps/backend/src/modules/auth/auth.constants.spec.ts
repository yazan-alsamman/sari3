import {
  assertPasswordPolicy,
  normalizePhone,
} from './auth.constants';

describe('auth.constants', () => {
  describe('normalizePhone', () => {
    it('keeps E.164 +963', () => {
      expect(normalizePhone('+963912345678')).toBe('+963912345678');
    });

    it('converts local 09… to +9639…', () => {
      expect(normalizePhone('0912345678')).toBe('+963912345678');
    });

    it('adds + to bare 963…', () => {
      expect(normalizePhone('963912345678')).toBe('+963912345678');
    });
  });

  describe('assertPasswordPolicy', () => {
    it('rejects short passwords', () => {
      expect(() => assertPasswordPolicy('short')).toThrow(/at least 8/);
    });

    it('rejects common passwords', () => {
      expect(() => assertPasswordPolicy('password1')).toThrow(/too common/);
    });

    it('accepts a strong-enough password', () => {
      expect(() => assertPasswordPolicy('Tr0ll-basket!')).not.toThrow();
    });
  });
});
