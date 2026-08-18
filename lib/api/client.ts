function parseResponseBody(text: string) {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return null;
  }

  if (trimmedText.startsWith('{') || trimmedText.startsWith('[')) {
    return JSON.parse(trimmedText);
  }

  return text;
}

export class ApiClient {
  private readonly baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      body: (options.method === 'POST' || options.method === 'PATCH') && !options.body ? JSON.stringify({}) : options.body
    });

    const text = await response.text();
    const data = parseResponseBody(text);

    if (!response.ok) {
      const error = data && typeof data === 'object' ? data : {
        code: 'INTERNAL_ERROR',
        message: text || `Request failed with status ${response.status}`,
        details: { status: response.status }
      };
      throw error;
    }

    return data as T;
  }

  // Auth endpoints
  async getSession(name?: string): Promise<any> {
    return this.request('/auth/session', {
      method: 'POST',
      body: name ? JSON.stringify({ name }) : undefined,
    });
  }
}

export const apiClient = new ApiClient(
  process.env.EXPO_PUBLIC_API_URL ||
    'https://homeoremedica-web--homeoremedica.us-central1.hosted.app/api'
);
