import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRepertorySearchService, RepertoryQueryExecutor } from '../search-service';

describe('RepertorySearchService', () => {
  let mockExecutor: RepertoryQueryExecutor;
  let service: ReturnType<typeof createRepertorySearchService>;

  beforeEach(() => {
    mockExecutor = {
      all: vi.fn(),
      get: vi.fn(),
    };
    service = createRepertorySearchService(mockExecutor);
  });

  describe('listSymptoms', () => {
    it('returns a list of symptoms for a given book', async () => {
      vi.mocked(mockExecutor.all).mockResolvedValueOnce([{ text: 'Headache' }, { text: 'Fever' }]);
      
      const result = await service.listSymptoms('boericke');
      
      expect(result).toEqual(['Headache', 'Fever']);
      expect(mockExecutor.all).toHaveBeenCalledWith(
        'SELECT DISTINCT text FROM symptoms WHERE book = ? ORDER BY text',
        ['boericke']
      );
    });

    it('applies search, limit, and offset', async () => {
      vi.mocked(mockExecutor.all).mockResolvedValueOnce([{ text: 'Throbbing Headache' }]);
      
      const result = await service.listSymptoms('boericke', 'Head', 10, 5);
      
      expect(result).toEqual(['Throbbing Headache']);
      expect(mockExecutor.all).toHaveBeenCalledWith(
        'SELECT DISTINCT text FROM symptoms WHERE book = ? AND text LIKE ? ORDER BY text LIMIT ? OFFSET ?',
        ['boericke', '%Head%', 10, 5]
      );
    });
  });

  describe('countSymptoms', () => {
    it('returns the count of symptoms', async () => {
      vi.mocked(mockExecutor.get).mockResolvedValueOnce({ count: 42 });
      
      const result = await service.countSymptoms('boericke');
      
      expect(result).toEqual(42);
      expect(mockExecutor.get).toHaveBeenCalledWith(
        'SELECT COUNT(DISTINCT text) as count FROM symptoms WHERE book = ?',
        ['boericke']
      );
    });
  });

  describe('findRemedies', () => {
    it('returns matching remedies and their matched symptoms', async () => {
      vi.mocked(mockExecutor.all)
        .mockResolvedValueOnce([{ id: 1, text: 'Headache' }, { id: 2, text: 'Fever' }])
        .mockResolvedValueOnce([
          { name: 'Belladonna', slug: 'belladonna', symptom_id: 1 },
          { name: 'Belladonna', slug: 'belladonna', symptom_id: 2 },
          { name: 'Aconite', slug: 'aconite', symptom_id: 1 }
        ]);

      const result = await service.findRemedies('boericke', ['Headache', 'Fever']);
      
      expect(result).toEqual([
        { remedy: 'Belladonna', slug: 'belladonna', matchedSymptoms: ['Headache', 'Fever'] },
        { remedy: 'Aconite', slug: 'aconite', matchedSymptoms: ['Headache'] }
      ]);
    });
  });

});
