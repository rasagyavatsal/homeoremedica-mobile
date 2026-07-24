import { ApiClient } from '@homeoremedica/shared';

type SymptomSearchResponse = {
  results: { name: string }[];
  total: number;
};

class MobileApiClient extends ApiClient {
  searchSymptoms(query: string, book: string, limit: number, offset: number) {
    const params = new URLSearchParams({
      query,
      book,
      limit: String(limit),
      offset: String(offset),
    });
    return this.request<SymptomSearchResponse>(`/symptoms/search?${params}`);
  }
}

export const apiClient = new MobileApiClient(
  process.env.EXPO_PUBLIC_API_URL ||
    'https://homeoremedica-web--homeoremedica.us-central1.hosted.app/api'
);
