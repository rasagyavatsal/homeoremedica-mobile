import { createMockApiClient } from './test-utils';
import { createCasesStore } from '../create-cases-store';

export type MockApiClient = ReturnType<typeof createMockApiClient>;
export type MockGetToken = jest.Mock<Promise<string | null>, []>;

export function createMockApiClientTyped(): MockApiClient {
  return createMockApiClient() as any;
}

export function createMockGetTokenTyped(tokenValue: string | null = 'test-token'): MockGetToken {
  return jest.fn<Promise<string | null>, []>().mockResolvedValue(tokenValue);
}

export function createTestCasesStore(apiClient: MockApiClient, getToken: MockGetToken) {
  return createCasesStore({ apiClient: apiClient as any, getToken });
}

export const caseFixtures = {
  case1: { id: '1', name: 'Case 1', userId: 'u1', createdAt: '2026-06-04T00:00:00.000Z' },
  case2: { id: '2', name: 'Case 2', userId: 'u1', createdAt: '2026-06-04T00:00:00.000Z' },
};

/** Loads cases through the public store action for integration tests. */
export async function loadCasesIntoStore(
  store: ReturnType<typeof createTestCasesStore>,
  apiClient: MockApiClient,
  cases: any[]
) {
  apiClient.getCases.mockResolvedValue({ cases });
  await store.getState().loadUserCases();
}
