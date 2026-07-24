import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from '../client';

describe('ApiClient', () => {
  let client: ApiClient;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    client = new ApiClient('http://localhost:3000/api');
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockFetchResponse(body: any, status = 200) {
    fetchSpy.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      text: () => Promise.resolve(JSON.stringify(body)),
    });
  }

  describe('request() headers', () => {
    it('adds Content-Type header to every request', async () => {
      mockFetchResponse({ cases: [] });
      await client.getCases();

      const [, options] = fetchSpy.mock.calls[0];
      expect(options.headers['Content-Type']).toBe('application/json');
    });

    it('adds Authorization header when auth token is set', async () => {
      client.setAuthToken('my-token');
      mockFetchResponse({ cases: [] });
      await client.getCases();

      const [, options] = fetchSpy.mock.calls[0];
      expect(options.headers.Authorization).toBe('Bearer my-token');
    });

    it('omits Authorization header when setAuthToken(null) is called', async () => {
      client.setAuthToken('my-token');
      client.setAuthToken(null);
      mockFetchResponse({ cases: [] });
      await client.getCases();

      const [, options] = fetchSpy.mock.calls[0];
      expect(options.headers.Authorization).toBeUndefined();
    });
  });

  describe('findRemedies()', () => {
    it('validates input with Zod and rejects bad bookId', async () => {
      await expect(
        client.findRemedies({ bookId: 'invalid' as any, symptoms: ['headache'] })
      ).rejects.toThrow();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('validates input with Zod and rejects empty symptoms', async () => {
      await expect(
        client.findRemedies({ bookId: 'boericke-MM', symptoms: [] })
      ).rejects.toThrow();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('sends valid request to /find endpoint', async () => {
      const mockResponse = { remedies: [], totalMatches: 0 };
      mockFetchResponse(mockResponse);

      const result = await client.findRemedies({
        bookId: 'boericke-MM',
        symptoms: ['headache'],
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toBe('http://localhost:3000/api/find');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({
        bookId: 'boericke-MM',
        symptoms: ['headache'],
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCases()', () => {
    it('calls GET /cases', async () => {
      mockFetchResponse({ cases: [{ id: '1', name: 'Test' }] });
      const result = await client.getCases();

      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toBe('http://localhost:3000/api/cases');
      expect(options.method).toBeUndefined();
      expect(result.cases).toHaveLength(1);
    });
  });

  describe('createCase()', () => {
    it('calls POST /cases with validated body', async () => {
      mockFetchResponse({ id: 'new-id', name: 'My Case' }, 201);

      const result = await client.createCase({ name: 'My Case' });

      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toBe('http://localhost:3000/api/cases');
      expect(options.method).toBe('POST');
      expect(result).toEqual({ id: 'new-id', name: 'My Case' });
    });

    it('rejects invalid payloads before fetch (Zod gate)', async () => {
      // Empty object with no title or name should fail createCaseSchema's superRefine
      await expect(client.createCase({})).rejects.toThrow();
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('updateCase()', () => {
    it('calls PATCH /cases/:id with validated body', async () => {
      mockFetchResponse({ id: 'case-1', name: 'Updated' });

      const result = await client.updateCase('case-1', { name: 'Updated' });

      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toBe('http://localhost:3000/api/cases/case-1');
      expect(options.method).toBe('PATCH');
      expect(result).toEqual({ id: 'case-1', name: 'Updated' });
    });

    it('rejects empty update payload before fetch', async () => {
      await expect(client.updateCase('case-1', {})).rejects.toThrow();
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('deleteCase()', () => {
    it('calls DELETE /cases/:id', async () => {
      mockFetchResponse({ success: true });

      const result = await client.deleteCase('case-1');

      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toBe('http://localhost:3000/api/cases/case-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ success: true });
    });
  });

  describe('error handling', () => {
    it('throws structured error object for non-OK responses', async () => {
      mockFetchResponse(
        { code: 'AUTH_REQUIRED', message: 'Auth needed' },
        401
      );

      await expect(client.getCases()).rejects.toEqual({
        code: 'AUTH_REQUIRED',
        message: 'Auth needed',
      });
    });

    it('throws generic error for non-JSON error responses', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      await expect(client.getCases()).rejects.toEqual({
        code: 'INTERNAL_ERROR',
        message: 'Internal Server Error',
        details: { status: 500 },
      });
    });
  });

  describe('getSession()', () => {
    it('calls POST /auth/session without name', async () => {
      mockFetchResponse({ user: { uid: 'u1', email: 'a@b.com' } });
      await client.getSession();

      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toBe('http://localhost:3000/api/auth/session');
      expect(options.method).toBe('POST');
    });

    it('calls POST /auth/session with name in body', async () => {
      mockFetchResponse({ user: { uid: 'u1', email: 'a@b.com' } });
      await client.getSession('John');

      const [, options] = fetchSpy.mock.calls[0];
      expect(JSON.parse(options.body)).toEqual({ name: 'John' });
    });
  });
});
