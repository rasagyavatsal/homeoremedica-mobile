import { describe, it, expect, beforeEach } from 'vitest';
import { normalizeCaseFromApi } from '../cases-store';
import {
  createMockApiClientTyped,
  createMockGetTokenTyped,
  createTestCasesStore,
  loadCasesIntoStore,
  caseFixtures,
  MockApiClient,
  MockGetToken,
} from './cases-store-harness';

describe('cases-store integration', () => {
  let mockApiClient: MockApiClient;
  let mockGetToken: MockGetToken;

  beforeEach(() => {
    mockApiClient = createMockApiClientTyped();
    mockGetToken = createMockGetTokenTyped();
  });

  describe('deleteCase', () => {
    it('calls API and removes case from state on valid ID', async () => {
      mockApiClient.deleteCase.mockResolvedValue({ success: true });

      const store = createTestCasesStore(mockApiClient, mockGetToken);
      await loadCasesIntoStore(store, mockApiClient, [caseFixtures.case1, caseFixtures.case2]);
      expect(store.getState().cases).toHaveLength(2);

      await store.getState().deleteCase('1');

      expect(mockApiClient.deleteCase).toHaveBeenCalledWith('1');
      expect(store.getState().cases).toHaveLength(1);
      expect(store.getState().cases[0].id).toBe('2');
    });

    it('throws without calling API for empty ID', async () => {
      const store = createTestCasesStore(mockApiClient, mockGetToken);

      await expect(store.getState().deleteCase('')).rejects.toThrow('Invalid case ID');
      expect(mockApiClient.deleteCase).not.toHaveBeenCalled();
    });

    it('throws without calling API for whitespace-only ID', async () => {
      const store = createTestCasesStore(mockApiClient, mockGetToken);

      await expect(store.getState().deleteCase('   ')).rejects.toThrow('Invalid case ID');
      expect(mockApiClient.deleteCase).not.toHaveBeenCalled();
    });

    it('clears selectedCase when deleted case was selected', async () => {
      mockApiClient.deleteCase.mockResolvedValue({ success: true });

      const store = createTestCasesStore(mockApiClient, mockGetToken);
      await loadCasesIntoStore(store, mockApiClient, [caseFixtures.case1]);
      store.getState().selectCase('1');
      expect(store.getState().selectedCase?.id).toBe('1');

      await store.getState().deleteCase('1');
      expect(store.getState().selectedCase).toBeNull();
    });
  });

  describe('updateCase', () => {
    it('merges updated data into state correctly', async () => {
      mockApiClient.updateCase.mockResolvedValue({
        id: '1',
        name: 'Updated Name',
        userId: 'u1',
        createdAt: new Date().toISOString(),
      });

      const store = createTestCasesStore(mockApiClient, mockGetToken);
      await loadCasesIntoStore(store, mockApiClient, [caseFixtures.case1]);

      await store.getState().updateCase('1', { name: 'Updated Name' });

      expect(store.getState().cases[0].name).toBe('Updated Name');
    });

    it('updates selectedCase when it matches the updated case', async () => {
      mockApiClient.updateCase.mockResolvedValue({
        id: '1',
        name: 'Updated',
        userId: 'u1',
        createdAt: new Date().toISOString(),
      });

      const store = createTestCasesStore(mockApiClient, mockGetToken);
      await loadCasesIntoStore(store, mockApiClient, [caseFixtures.case1]);
      store.getState().selectCase('1');

      await store.getState().updateCase('1', { name: 'Updated' });

      expect(store.getState().selectedCase?.name).toBe('Updated');
    });
  });

  describe('selectCase / clearCases', () => {
    it.each([
      { inputId: '2', expectedId: '2', expectedName: 'Case 2', description: 'sets selectedCase from cases array' },
      { inputId: null, expectedId: null, expectedName: null, description: 'clears selection' },
      { inputId: 'nonexistent', expectedId: null, expectedName: null, description: 'with nonexistent ID sets null' },
    ])('selectCase $description', async ({ inputId, expectedId, expectedName }) => {
      const store = createTestCasesStore(mockApiClient, mockGetToken);
      await loadCasesIntoStore(store, mockApiClient, [caseFixtures.case1, caseFixtures.case2]);

      if (inputId === null) {
        store.getState().selectCase('1');
        expect(store.getState().selectedCase).not.toBeNull();
      }

      store.getState().selectCase(inputId);

      if (expectedId === null) {
        expect(store.getState().selectedCase).toBeNull();
      } else {
        expect(store.getState().selectedCase?.id).toBe(expectedId);
        expect(store.getState().selectedCase?.name).toBe(expectedName);
      }
    });

    it('clearCases resets all state', async () => {
      const store = createTestCasesStore(mockApiClient, mockGetToken);
      await loadCasesIntoStore(store, mockApiClient, [caseFixtures.case1]);
      store.getState().selectCase('1');

      store.getState().clearCases();

      const state = store.getState();
      expect(state.cases).toEqual([]);
      expect(state.selectedCase).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('loadUserCases with null token', () => {
    it('sets error state when token is null', async () => {
      const nullTokenGetter = createMockGetTokenTyped(null);

      const store = createTestCasesStore(mockApiClient, nullTokenGetter);
      await store.getState().loadUserCases();

      const state = store.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe('User not authenticated');
      expect(mockApiClient.getCases).not.toHaveBeenCalled();
    });
  });

  describe('normalizeCaseFromApi edge cases', () => {
    it('returns null for missing id', () => {
      expect(normalizeCaseFromApi({ name: 'No ID' })).toBeNull();
      expect(normalizeCaseFromApi({})).toBeNull();
      expect(normalizeCaseFromApi(null)).toBeNull();
      expect(normalizeCaseFromApi(undefined)).toBeNull();
    });

    it('uses title as name when name is missing', () => {
      const result = normalizeCaseFromApi({ id: '1', title: 'Title Only' });
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Title Only');
    });

    it('handles createdAt timestamp format', () => {
      const iso = '2024-01-15T10:30:00.000Z';
      const result = normalizeCaseFromApi({ id: '1', name: 'Test', createdAt: iso });
      expect(result).not.toBeNull();
      expect(result!.timestamp).toEqual(new Date(iso));
    });

    it('handles timestamp field as fallback', () => {
      const iso = '2024-06-01T00:00:00.000Z';
      const result = normalizeCaseFromApi({ id: '1', name: 'Test', timestamp: iso });
      expect(result).not.toBeNull();
      expect(result!.timestamp).toEqual(new Date(iso));
    });
  });
});
