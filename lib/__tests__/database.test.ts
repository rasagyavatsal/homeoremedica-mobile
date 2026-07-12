import { apiClient } from '../api/client';
import { findRemedies, searchSymptoms, searchSymptomsCount } from '../database';

jest.mock('../api/client', () => ({
  apiClient: {
    searchSymptoms: jest.fn(),
    findRemedies: jest.fn(),
  },
}));

describe('mobile-database', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('searches symptoms through the remote API', async () => {
    jest.mocked(apiClient.searchSymptoms).mockResolvedValue({
      results: [{ name: 'Head pain' }],
      total: 12,
    });

    await expect(searchSymptoms('boericke', 'head', 20, 5)).resolves.toEqual(['Head pain']);
    expect(apiClient.searchSymptoms).toHaveBeenCalledWith('head', 'boericke', 20, 5);
  });

  it('reads the symptom count from the remote API', async () => {
    jest.mocked(apiClient.searchSymptoms).mockResolvedValue({ results: [], total: 12 });
    await expect(searchSymptomsCount('kent', 'head')).resolves.toBe(12);
  });

  it('maps remote remedy results to the mobile shape', async () => {
    jest.mocked(apiClient.findRemedies).mockResolvedValue({
      remedies: [{
        id: 'belladonna-boericke',
        name: 'Belladonna',
        score: 1,
        matchedSymptoms: ['Head pain'],
        sourceBooks: ['boericke'],
      }],
      totalMatches: 1,
    });

    await expect(findRemedies('boericke', ['Head pain'])).resolves.toEqual([{
      remedy: 'Belladonna',
      slug: 'belladonna-boericke',
      matchedSymptoms: ['Head pain'],
    }]);
  });
});
