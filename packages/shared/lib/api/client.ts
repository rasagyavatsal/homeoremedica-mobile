import { FindRemedyResponse } from '../../types';
import { createCaseSchema, findRemedySchema, FindRemedyRequest, updateCaseSchema } from '../validation/schemas';

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

  // Find remedies with zod validation
  async findRemedies(request: FindRemedyRequest): Promise<FindRemedyResponse> {
    const validated = findRemedySchema.parse(request);
    return this.request<FindRemedyResponse>('/find', {
      method: 'POST',
      body: JSON.stringify(validated),
    });
  }

  // Cases endpoints
  async getCases(): Promise<{ cases: any[] }> {
    return this.request<{ cases: any[] }>('/cases');
  }

  async createCase(caseData: any): Promise<any> {
    const validated = createCaseSchema.parse(caseData);
    return this.request('/cases', {
      method: 'POST',
      body: JSON.stringify(validated),
    });
  }

  async updateCase(id: string, updates: any): Promise<any> {
    const validated = updateCaseSchema.parse(updates);
    return this.request(`/cases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(validated),
    });
  }

  async deleteCase(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/cases/${id}`, {
      method: 'DELETE',
    });
  }
}
