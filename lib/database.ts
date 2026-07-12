import { apiClient } from './api/client';

export type BookType = 'boericke' | 'clarke' | 'kent' | 'allen';

export async function initDatabase(): Promise<void> {
  // Remedy data is server-side; no local database initialization is required.
}

export async function getSymptoms(
  book: BookType,
  search?: string,
  limit?: number,
  offset?: number
): Promise<string[]> {
  if (!search) return [];
  return searchSymptoms(book, search, limit, offset);
}

export async function getSymptomsCount(book: BookType, search?: string): Promise<number> {
  if (!search) return 0;
  return searchSymptomsCount(book, search);
}

export async function searchSymptoms(
  book: BookType,
  searchQuery: string,
  limit: number = 100,
  offset: number = 0
): Promise<string[]> {
  const response = await apiClient.searchSymptoms(searchQuery, book, limit, offset);
  return response.results.map((result) => result.name);
}

export async function searchSymptomsCount(book: BookType, searchQuery: string): Promise<number> {
  const response = await apiClient.searchSymptoms(searchQuery, book, 1, 0);
  return response.total;
}

export async function findRemedies(
  book: BookType,
  symptoms: string[]
): Promise<{ remedy: string; slug: string; matchedSymptoms: string[] }[]> {
  if (symptoms.length === 0) return [];
  const response = await apiClient.findRemedies({ bookId: book, symptoms });
  return response.remedies.map((remedy) => ({
    remedy: remedy.name,
    slug: remedy.id,
    matchedSymptoms: remedy.matchedSymptoms,
  }));
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  // Kept for compatibility with existing lifecycle callers.
}
