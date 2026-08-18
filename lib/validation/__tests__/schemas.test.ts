import {
  findRemedySchema,
  createCaseSchema,
  updateCaseSchema,
  selectedSymptomSchema,
  caseResultSchema,
  aiMatchSymptomsSchema,
  apiErrorSchema,
  chatTurnSchema,
  chatRequestSchema
} from '../schemas';

describe('schemas', () => {
  describe('findRemedySchema', () => {
    it('should validate valid find remedy requests', () => {
      const valid = {
        symptoms: ['itching', 'fever'],
        bookId: 'boericke-MM'
      };
      const result = findRemedySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid book types', () => {
      const invalid = {
        symptoms: ['itching'],
        bookId: 'invalid-book'
      };
      const result = findRemedySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject empty symptoms array', () => {
      const invalid = {
        symptoms: [],
        bookId: 'boericke-MM'
      };
      const result = findRemedySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('createCaseSchema', () => {
    it('should validate valid case creation', () => {
      const valid = {
        name: 'John Doe',
        symptoms: ['itching'],
        bookId: 'boericke-MM'
      };
      const result = createCaseSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should allow title instead of name', () => {
      const valid = {
        title: 'Case Title',
        bookId: 'boericke-MM'
      };
      const result = createCaseSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject if both title and name are missing', () => {
      const invalid = {
        bookId: 'boericke-MM'
      };
      const result = createCaseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should validate name length boundary (200 chars)', () => {
      const longName = 'a'.repeat(200);
      const valid = { name: longName };
      expect(createCaseSchema.safeParse(valid).success).toBe(true);

      const tooLongName = 'a'.repeat(201);
      const invalid = { name: tooLongName };
      expect(createCaseSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('updateCaseSchema', () => {
    it('should allow partial updates', () => {
      const valid = {
        name: 'Jane Doe'
      };
      const result = updateCaseSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate symptoms if provided', () => {
      const valid = {
        symptoms: ['cough']
      };
      const result = updateCaseSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject empty update', () => {
      const invalid = {};
      const result = updateCaseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('selectedSymptomSchema', () => {
    it('should validate valid selected symptoms', () => {
      const valid = {
        id: 's1',
        name: 'Symptom 1',
        synonyms: ['Syn 1'],
        books: ['boericke-MM']
      };
      const result = selectedSymptomSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject missing id or name', () => {
      expect(selectedSymptomSchema.safeParse({ id: 's1' }).success).toBe(false);
      expect(selectedSymptomSchema.safeParse({ name: 'N1' }).success).toBe(false);
    });
  });

  describe('caseResultSchema', () => {
    it('should validate valid results', () => {
      const valid = { remedyId: 'r1', score: 10 };
      expect(caseResultSchema.safeParse(valid).success).toBe(true);
    });

    it('should reject non-number score', () => {
      const invalid = { remedyId: 'r1', score: '10' };
      expect(caseResultSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('aiMatchSymptomsSchema', () => {
    it('should validate valid AI requests', () => {
      const valid = { query: 'itch', selectedBooks: ['boericke-MM'] };
      expect(aiMatchSymptomsSchema.safeParse(valid).success).toBe(true);
    });

    it('should reject empty query', () => {
      expect(aiMatchSymptomsSchema.safeParse({ query: '' }).success).toBe(false);
    });
  });

  describe('apiErrorSchema', () => {
    it('should validate all allowed error codes', () => {
      ['AUTH_REQUIRED', 'INVALID_INPUT', 'INTERNAL_ERROR', 'NOT_FOUND'].forEach(code => {
        const valid = { code, message: 'error' };
        expect(apiErrorSchema.safeParse(valid).success).toBe(true);
      });
    });

    it('should reject invalid error codes', () => {
      const invalid = { code: 'BAD_REQUEST', message: 'error' };
      expect(apiErrorSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('chatTurnSchema', () => {
    it('should validate a user or assistant turn', () => {
      expect(chatTurnSchema.safeParse({ role: 'user', content: 'Tell me about Nux vomica.' }).success).toBe(true);
      expect(chatTurnSchema.safeParse({ role: 'assistant', content: 'Nux vomica is chilly.' }).success).toBe(true);
    });

    it('should reject unknown roles', () => {
      expect(chatTurnSchema.safeParse({ role: 'system', content: 'prompt' }).success).toBe(false);
    });

    it('should reject blank content and content over 4000 chars', () => {
      expect(chatTurnSchema.safeParse({ role: 'user', content: '   ' }).success).toBe(false);
      expect(chatTurnSchema.safeParse({ role: 'user', content: 'a'.repeat(4001) }).success).toBe(false);
    });
  });

  describe('chatRequestSchema', () => {
    it('should validate a minimal grounded chat request', () => {
      expect(chatRequestSchema.safeParse({ message: 'How is Nux vomica described?' }).success).toBe(true);
    });

    it('should trim the message and reject blank ones', () => {
      const parsed = chatRequestSchema.parse({ message: '  Hello  ' });
      expect(parsed.message).toBe('Hello');
      expect(chatRequestSchema.safeParse({ message: '   ' }).success).toBe(false);
    });

    it('should cap history at 20 turns', () => {
      const turn = { role: 'user', content: 'question' };
      expect(chatRequestSchema.safeParse({ message: 'hi', history: Array(20).fill(turn) }).success).toBe(true);
      expect(chatRequestSchema.safeParse({ message: 'hi', history: Array(21).fill(turn) }).success).toBe(false);
    });

    it('should reject duplicate bookIds', () => {
      expect(
        chatRequestSchema.safeParse({
          message: 'hi',
          bookIds: ['clarke-MM', 'clarke-MM']
        }).success
      ).toBe(false);
    });
  });
});
