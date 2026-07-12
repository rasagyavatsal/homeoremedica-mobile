import { describe, it, expect } from 'vitest';
import { expandSingleWord, expandSearchTerms, getExpandedSearchWords, symptomSynonyms } from '../synonyms';

describe('synonyms', () => {
  describe('data integrity', () => {
    it('should have all keys in lowercase', () => {
      Object.keys(symptomSynonyms).forEach(key => {
        expect(key).toBe(key.toLowerCase());
      });
    });

    it('should have all values as arrays of strings', () => {
      Object.values(symptomSynonyms).forEach(value => {
        expect(Array.isArray(value)).toBe(true);
        value.forEach(syn => expect(typeof syn).toBe('string'));
      });
    });
  });

  describe('expandSingleWord', () => {
    it('should handle empty string', () => {
      expect(expandSingleWord('')).toEqual(['']);
    });

    it('should return the word itself if no synonyms found', () => {
      const result = expandSingleWord('unknownword');
      expect(result).toEqual(['unknownword']);
    });

    const singleWordCases = [
      { input: 'coryza', expected: ['coryza', 'cold', 'rhinitis', 'fluent'] },
      { input: 'itching', expected: ['itching', 'pruritus', 'itchy', 'itch'] },
      { input: 'ITCHING', expected: ['itching', 'pruritus'] },
    ];

    it.each(singleWordCases)('should expand $input correctly', ({ input, expected }) => {
      const result = expandSingleWord(input);
      expected.forEach(exp => expect(result).toContain(exp));
    });

    it('should expand bidirectionally (term A expands to term B and term B to term A)', () => {
      const fromA = expandSingleWord('coryza');
      expect(fromA).toContain('cold');
      
      const fromB = expandSingleWord('cold');
      expect(fromB).toContain('coryza');
    });

    it('should not contain duplicate terms in expansion results', () => {
      const result = expandSingleWord('coryza');
      const uniqueCount = new Set(result).size;
      expect(result.length).toBe(uniqueCount);
    });
  });

  describe('expandSearchTerms', () => {
    const searchCases = [
      { input: '', expectedLen: 0, groups: [] },
      { input: '   ', expectedLen: 0, groups: [] },
      { input: 'itching bed', expectedLen: 2, groups: [['itching', 'pruritus'], ['bed']] },
      { input: 'coryza fever', expectedLen: 2, groups: [['coryza', 'cold'], ['fever', 'pyrexia']] },
      { input: '  itching   bed  ', expectedLen: 2, groups: [['itching'], ['bed']] },
    ];

    it.each(searchCases)('should handle "$input"', ({ input, expectedLen, groups }) => {
      const result = expandSearchTerms(input);
      expect(result).toHaveLength(expectedLen);
      groups.forEach((group, index) => {
        group.forEach(term => expect(result[index]).toContain(term));
      });
    });
  });

  describe('getExpandedSearchWords', () => {
    it('should handle empty string', () => {
      expect(getExpandedSearchWords('')).toEqual([]);
    });

    it('should return a flat array of all synonyms', () => {
      const result = getExpandedSearchWords('itching bed');
      expect(result).toContain('itching');
      expect(result).toContain('pruritus');
      expect(result).toContain('bed');
      // Ensure no duplicates
      const uniqueResult = Array.from(new Set(result));
      expect(result.length).toBe(uniqueResult.length);
    });
  });
});
