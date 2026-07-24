import { apiClient } from '@/lib/api/client';

describe('mobile API source identifiers', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('falls back to the canonical production API when no URL is configured', async () => {
    const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;
    delete process.env.EXPO_PUBLIC_API_URL;
    jest.resetModules();

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ results: [], total: 0 }),
    } as Response);

    try {
      const { apiClient: fallbackClient } = require('@/lib/api/client');

      await fallbackClient.searchSymptoms('head', 'boericke-MM', 1, 0);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(
          /^https:\/\/homeoremedica-web--homeoremedica\.us-central1\.hosted\.app\/api\/symptoms\/search\?/,
        ),
        expect.any(Object),
      );
    } finally {
      if (configuredApiUrl === undefined) {
        delete process.env.EXPO_PUBLIC_API_URL;
      } else {
        process.env.EXPO_PUBLIC_API_URL = configuredApiUrl;
      }
    }
  });

  it('accepts and sends the canonical source IDs used by the web API', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ remedies: [] }),
    } as Response);

    await expect(
      apiClient.findRemedies({
        bookId: 'boericke-MM' as any,
        symptoms: ['Head pain'],
      }),
    ).resolves.toEqual({ remedies: [] });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/find'),
      expect.objectContaining({
        body: JSON.stringify({
          bookId: 'boericke-MM',
          symptoms: ['Head pain'],
        }),
      }),
    );
  });
});
