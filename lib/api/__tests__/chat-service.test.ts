import { sendChatMessage } from '../chat-service';

const UNREACHABLE = {
  code: 'UPSTREAM_UNAVAILABLE',
  message: 'The chat service could not answer right now. Please try again.',
};

const SAMPLE_RESPONSE = {
  answer: 'Nux vomica is irritable [1].',
  corpusVersion: '2026-08-15.v1',
  model: 'gemini-2.5-flash-lite',
  sources: [
    {
      id: '2026-08-15.v1/kent-lectures/chk_1',
      bookId: 'kent-lectures',
      bookTitle: "Kent's Lectures on Homoeopathic Materia Medica",
      author: 'James Tyler Kent',
      remedyName: 'NUX VOMICA',
      sectionTitle: 'Mind',
      passageIndexes: [0],
      text: 'Irritable.',
    },
  ],
};

describe('sendChatMessage', () => {
  let fetchSpy: jest.Mock;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    fetchSpy = jest.fn();
    globalThis.fetch = fetchSpy as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  function mockFetchResponse(body: unknown, ok = true) {
    fetchSpy.mockResolvedValueOnce({
      ok,
      status: ok ? 200 : 502,
      json: () => Promise.resolve(body),
    });
  }

  it('posts the message and history to the RAG backend /v1/chat', async () => {
    mockFetchResponse(SAMPLE_RESPONSE);

    const response = await sendChatMessage({
      message: 'How is Nux vomica described?',
      history: [
        { role: 'user', content: 'First question' },
        { role: 'assistant', content: 'First answer.' },
      ],
    });

    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toBe(
      'https://homeoremedica-chat-619837289655.us-central1.run.app/v1/chat'
    );
    expect(options.method).toBe('POST');
    expect(options.headers['content-type']).toBe('application/json');
    expect(options.signal).toBeDefined();
    expect(JSON.parse(options.body)).toEqual({
      message: 'How is Nux vomica described?',
      history: [
        { role: 'user', content: 'First question' },
        { role: 'assistant', content: 'First answer.' },
      ],
    });
    expect(response).toEqual(SAMPLE_RESPONSE);
  });

  it('sends an empty history and omits bookIds when they are not provided', async () => {
    mockFetchResponse(SAMPLE_RESPONSE);

    await sendChatMessage({ message: 'Tell me about Sulphur' });

    const [, options] = fetchSpy.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.history).toEqual([]);
    expect(body.bookIds).toBeUndefined();
  });

  it('forwards bookIds when the caller narrows the corpus', async () => {
    mockFetchResponse(SAMPLE_RESPONSE);

    await sendChatMessage({
      message: 'Tell me about Sulphur',
      bookIds: ['clarke-MM', 'kent-lectures'],
    });

    const [, options] = fetchSpy.mock.calls[0];
    expect(JSON.parse(options.body).bookIds).toEqual([
      'clarke-MM',
      'kent-lectures',
    ]);
  });

  it('resolves the base URL from EXPO_PUBLIC_RAG_CHAT_BASE_URL when configured', async () => {
    const previous = process.env.EXPO_PUBLIC_RAG_CHAT_BASE_URL;
    process.env.EXPO_PUBLIC_RAG_CHAT_BASE_URL =
      'https://rag.example.com/staging/';
    mockFetchResponse(SAMPLE_RESPONSE);

    try {
      await sendChatMessage({ message: 'hi' });
      expect(fetchSpy.mock.calls[0][0]).toBe(
        'https://rag.example.com/staging/v1/chat'
      );
    } finally {
      if (previous === undefined) {
        delete process.env.EXPO_PUBLIC_RAG_CHAT_BASE_URL;
      } else {
        process.env.EXPO_PUBLIC_RAG_CHAT_BASE_URL = previous;
      }
    }
  });

  it('validates the request before any network call', async () => {
    await expect(
      sendChatMessage({ message: '', history: [] })
    ).rejects.toThrow();
    await expect(
      sendChatMessage({ message: 'hi', history: Array(21).fill({ role: 'user', content: 'q' }) } as any)
    ).rejects.toThrow();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('normalizes transport failures to UPSTREAM_UNAVAILABLE', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network request failed'));

    await expect(sendChatMessage({ message: 'hi' })).rejects.toEqual(
      UNREACHABLE
    );
  });

  it('normalizes non-ok responses to UPSTREAM_UNAVAILABLE', async () => {
    mockFetchResponse({ detail: 'upstream failed' }, false);

    await expect(sendChatMessage({ message: 'hi' })).rejects.toEqual(
      UNREACHABLE
    );
  });

  it('normalizes unparseable responses to UPSTREAM_UNAVAILABLE', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.reject(new SyntaxError('Unexpected token')),
    });

    await expect(sendChatMessage({ message: 'hi' })).rejects.toEqual(
      UNREACHABLE
    );
  });
});
