import { describe, it, expect } from 'vitest';
import { validatePassword } from '../password';

describe('validatePassword', () => {
  describe('length rule', () => {
    it('rejects empty string', () => {
      const result = validatePassword({ password: '' });
      expect(result.rules.length.passed).toBe(false);
      expect(result.unmetRules).toContain('length');
    });

    it('rejects 11 characters', () => {
      const result = validatePassword({ password: 'A1b!'.repeat(2) + 'A1b' }); // length 11
      expect(result.rules.length.passed).toBe(false);
    });

    it('accepts exactly 12 characters', () => {
      const result = validatePassword({ password: 'A1b!'.repeat(3) }); // length 12
      expect(result.rules.length.passed).toBe(true);
    });

    it('accepts 20+ characters', () => {
      const result = validatePassword({ password: 'A1b!'.repeat(6) }); // length 24
      expect(result.rules.length.passed).toBe(true);
    });
  });

  describe('uppercase rule', () => {
    it("rejects 'alllowercase123!'", () => {
      const result = validatePassword({ password: 'alllowercase123!' });
      expect(result.rules.uppercase.passed).toBe(false);
      expect(result.unmetRules).toContain('uppercase');
    });

    it("accepts 'hasUppercase123!'", () => {
      const result = validatePassword({ password: 'hasUppercase123!' });
      expect(result.rules.uppercase.passed).toBe(true);
    });
  });

  describe('lowercase rule', () => {
    it("rejects 'ALLUPPERCASE123!'", () => {
      const result = validatePassword({ password: 'ALLUPPERCASE123!' });
      expect(result.rules.lowercase.passed).toBe(false);
      expect(result.unmetRules).toContain('lowercase');
    });

    it("accepts 'hasLowercase123!'", () => {
      const result = validatePassword({ password: 'hasLowercase123!' });
      expect(result.rules.lowercase.passed).toBe(true);
    });
  });

  describe('number rule', () => {
    it("rejects 'NoNumbersHere!'", () => {
      const result = validatePassword({ password: 'NoNumbersHere!' });
      expect(result.rules.number.passed).toBe(false);
      expect(result.unmetRules).toContain('number');
    });

    it("accepts 'has1Number!'", () => {
      const result = validatePassword({ password: 'has1Number!' });
      expect(result.rules.number.passed).toBe(true);
    });
  });

  describe('symbol rule', () => {
    it("rejects 'NoSymbols1234'", () => {
      const result = validatePassword({ password: 'NoSymbols12345' }); // Made it 14 chars to pass length
      expect(result.rules.symbol.passed).toBe(false);
      expect(result.unmetRules).toContain('symbol');
    });

    it("accepts 'has1Symbol!'", () => {
      const result = validatePassword({ password: 'has1Symbol!@#' });
      expect(result.rules.symbol.passed).toBe(true);
    });
  });

  describe('common passwords', () => {
    it("rejects 'password12345'", () => {
      const result = validatePassword({ password: 'password12345' });
      expect(result.rules.common.passed).toBe(false);
      expect(result.unmetRules).toContain('common');
    });
    
    it("rejects 'Password1!' if too common", () => {
      const result = validatePassword({ password: 'Password1!' });
      expect(result.rules.common.passed).toBe(false);
      expect(result.unmetRules).toContain('common');
    });

    it("accepts 'StrongPass123!'", () => {
      const result = validatePassword({ password: 'StrongPass123!' });
      expect(result.rules.common.passed).toBe(true);
    });
  });

  describe('combined scenarios', () => {
    it('isValid=true when ALL rules pass', () => {
      const result = validatePassword({ password: 'StrongPassword123!' });
      expect(result.isValid).toBe(true);
      expect(result.unmetRules).toEqual([]);
      expect(result.score).toBe(5);
    });

    it('isValid=false when ANY rule fails', () => {
      const result = validatePassword({ password: 'nouppercase123!' });
      expect(result.isValid).toBe(false);
    });

    it('unmetRules lists exactly which failed', () => {
      const result = validatePassword({ password: 'weak' });
      const sortedUnmetRules = [...result.unmetRules];
      sortedUnmetRules.sort((a, b) => a.localeCompare(b));
      const expectedRules = ['length', 'uppercase', 'number', 'symbol'];
      expectedRules.sort((a, b) => a.localeCompare(b));
      expect(sortedUnmetRules).toEqual(expectedRules);
    });
  });

  describe('match rule', () => {
    it('only checked when confirmPassword provided', () => {
      const result = validatePassword({ password: 'Password123!' });
      expect(result.rules.match).toBeUndefined();
    });

    it('fails when passwords differ', () => {
      const result = validatePassword({ password: 'Password123!', confirmPassword: 'Password123?' });
      expect(result.rules.match?.passed).toBe(false);
      expect(result.unmetRules).toContain('match');
    });
    
    it('passes when passwords match', () => {
      const result = validatePassword({ password: 'Password123!', confirmPassword: 'Password123!' });
      expect(result.rules.match?.passed).toBe(true);
    });
  });

  describe('notCurrent rule', () => {
    it('only checked when currentPassword provided', () => {
      const result = validatePassword({ password: 'Password123!' });
      expect(result.rules.notCurrent).toBeUndefined();
    });

    it('fails when new === current', () => {
      const result = validatePassword({ password: 'Password123!', currentPassword: 'Password123!' });
      expect(result.rules.notCurrent?.passed).toBe(false);
      expect(result.unmetRules).toContain('notCurrent');
    });
  });

  describe('personal info rule', () => {
    it('fails when password contains email prefix', () => {
      const result = validatePassword({ password: 'johndoePassword1!', email: 'johndoe@example.com' });
      expect(result.rules.personalInfo?.passed).toBe(false);
      expect(result.unmetRules).toContain('personalInfo');
    });

    it('fails when password contains display name', () => {
      const result = validatePassword({ password: 'JohnDoePassword1!', displayName: 'John Doe' });
      expect(result.rules.personalInfo?.passed).toBe(false);
      expect(result.unmetRules).toContain('personalInfo');
    });
  });

  describe('score', () => {
    it('returns 0-5 based on complexity rules met', () => {
      expect(validatePassword({ password: '' }).score).toBe(0);
      expect(validatePassword({ password: 'alllowercase' }).score).toBe(2); // length, lowercase
      expect(validatePassword({ password: 'hasUppercase' }).score).toBe(3); // length, lowercase, uppercase
      expect(validatePassword({ password: 'hasUppercase1' }).score).toBe(4); // length, lower, upper, number
      expect(validatePassword({ password: 'hasUppercase1!' }).score).toBe(5); // all 5
    });
  });
});
