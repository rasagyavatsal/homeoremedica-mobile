import { ApiClient } from '../client';

describe('ApiClient', () => {
  let client: ApiClient;
  let fetchSpy: jest.Mock;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    client = new ApiClient('http://localhost:3000/api');
    originalFetch = globalThis.fetch;
    fetchSpy = jest.fn();
    globalThis.fetch = fetchSpy as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
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
      mockFetchResponse({ user: { uid: 'u1', email: 'a@b.com' } });
      await client.getSession();

      const [, options] = fetchSpy.mock.calls[0];
      expect(options.headers['Content-Type']).toBe('application/json');
    });

    it('adds Authorization header when auth token is set', async () => {
      client.setAuthToken('my-token');
      mockFetchResponse({ user: { uid: 'u1', email: 'a@b.com' } });
      await client.getSession();

      const [, options] = fetchSpy.mock.calls[0];
      expect(options.headers.Authorization).toBe('Bearer my-token');
    });

    it('omits Authorization header when setAuthToken(null) is called', async () => {
      client.setAuthToken('my-token');
      client.setAuthToken(null);
      mockFetchResponse({ user: { uid: 'u1', email: 'a@b.com' } });
      await client.getSession();

      const [, options] = fetchSpy.mock.calls[0];
      expect(options.headers.Authorization).toBeUndefined();
    });
  });

  describe('getSession()', () => {
    it('calls POST /auth/session without name', async () => {
      mockFetchResponse({ user: { uid: 'u1', email: 'a@b.com' } });
      await client.getSession();

      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toBe('http://localhost:3000/api/auth/session');
      expect(options.method).toBe('POST');
      expect(options.body).toBe('{}');
    });

    it('sends the display name when provided', async () => {
      mockFetchResponse({ user: { uid: 'u1', email: 'a@b.com' } });
      await client.getSession('Rasagya');

      const [, options] = fetchSpy.mock.calls[0];
      expect(JSON.parse(options.body)).toEqual({ name: 'Rasagya' });
    });
  });

  describe('error handling', () => {
    it('throws structured error object for non-OK responses', async () => {
      mockFetchResponse(
        { code: 'AUTH_REQUIRED', message: 'Auth needed' },
        401
      );

      await expect(client.getSession()).rejects.toEqual({
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

      await expect(client.getSession()).rejects.toEqual({
        code: 'INTERNAL_ERROR',
        message: 'Internal Server Error',
        details: { status: 500 },
      });
    });
  });
});
