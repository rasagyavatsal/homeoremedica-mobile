import { describe, it, expect } from '@jest/globals';
import { chatTurnSchema, chatRequestSchema, apiErrorSchema } from '../schemas';

describe('schemas', () => {
  describe('chatTurnSchema', () => {
    it('accepts user and assistant turns', () => {
      expect(chatTurnSchema.safeParse({ role: 'user', content: 'Question' }).success).toBe(true);
      expect(chatTurnSchema.safeParse({ role: 'assistant', content: 'Answer' }).success).toBe(true);
    });

    it('rejects unknown roles', () => {
      const invalid = { role: 'system', content: 'Hidden' };
      expect(chatTurnSchema.safeParse(invalid).success).toBe(false);
    });

    it('rejects blank and over-long content', () => {
      expect(chatTurnSchema.safeParse({ role: 'user', content: '   ' }).success).toBe(false);
      expect(chatTurnSchema.safeParse({ role: 'user', content: 'a'.repeat(4001) }).success).toBe(false);
    });
  });

  describe('chatRequestSchema', () => {
    it('validates a minimal chat request', () => {
      const result = chatRequestSchema.safeParse({ message: 'How is Nux vomica described?' });
      expect(result.success).toBe(true);
    });

    it('rejects blank and over-long messages', () => {
      expect(chatRequestSchema.safeParse({ message: '   ' }).success).toBe(false);
      expect(chatRequestSchema.safeParse({ message: 'a'.repeat(4001) }).success).toBe(false);
    });

    it('accepts valid bookIds and history', () => {
      const valid = {
        message: 'Sleeplessness?',
        bookIds: ['clarke-MM', 'kent-lectures'],
        history: [{ role: 'user' as const, content: 'Earlier' }],
      };
      expect(chatRequestSchema.safeParse(valid).success).toBe(true);
    });

    it('rejects unknown bookIds', () => {
      const invalid = { message: 'Hello', bookIds: ['kent'] };
      expect(chatRequestSchema.safeParse(invalid).success).toBe(false);
    });

    it('rejects duplicate bookIds', () => {
      const invalid = { message: 'Hello', bookIds: ['kent-lectures', 'kent-lectures'] };
      expect(chatRequestSchema.safeParse(invalid).success).toBe(false);
    });

    it('rejects history longer than 20 turns', () => {
      const history = Array.from({ length: 21 }, (_, index) => ({
        role: index % 2 === 0 ? 'user' : 'assistant',
        content: `turn ${index}`,
      }));
      expect(chatRequestSchema.safeParse({ message: 'Hello', history }).success).toBe(false);
    });
  });

  describe('apiErrorSchema', () => {
    it('validates all allowed error codes', () => {
      ['APP_CHECK_REQUIRED', 'AUTH_REQUIRED', 'INVALID_INPUT', 'INTERNAL_ERROR', 'NOT_FOUND', 'UPSTREAM_UNAVAILABLE'].forEach(code => {
        const valid = { code, message: 'error' };
        expect(apiErrorSchema.safeParse(valid).success).toBe(true);
      });
    });

    it('rejects invalid error codes', () => {
      const invalid = { code: 'BAD_REQUEST', message: 'error' };
      expect(apiErrorSchema.safeParse(invalid).success).toBe(false);
    });
  });
});
