import { vi } from 'vitest';
import { createMockApiClient } from '../../__tests__/test-utils';
import { createCasesStore } from '../cases-store';

export type MockApiClient = ReturnType<typeof createMockApiClient>;
export type MockGetToken = ReturnType<typeof vi.fn<() => Promise<string | null>>>;

export function createMockApiClientTyped(): MockApiClient {
  return createMockApiClient() as any;
}

export function createMockGetTokenTyped(tokenValue: string | null = 'test-token'): MockGetToken {
  return vi.fn<() => Promise<string | null>>().mockResolvedValue(tokenValue);
}

export function createTestCasesStore(apiClient: MockApiClient, getToken: MockGetToken) {
  return createCasesStore({ apiClient: apiClient as any, getToken });
}

export const caseFixtures = {
  case1: { id: '1', name: 'Case 1', userId: 'u1', createdAt: '2026-06-04T00:00:00.000Z' },
  case2: { id: '2', name: 'Case 2', userId: 'u1', createdAt: '2026-06-04T00:00:00.000Z' },
};

export async function loadCasesIntoStore(
  store: ReturnType<typeof createTestCasesStore>,
  apiClient: MockApiClient,
  cases: any[]
) {
  apiClient.getCases.mockResolvedValue({ cases });
  await store.getState().loadUserCases();
}
