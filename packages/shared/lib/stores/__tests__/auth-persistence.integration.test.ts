import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthStore } from '../auth-store';

describe('AuthStore Integration with Persistence', () => {
  let mockApiClient: any;
  let mockAuthAdapter: any;
  let mockStorageData: Record<string, string> = {};
  
  const mockStorage = {
    getItem: vi.fn((name: string) => mockStorageData[name] || null),
    setItem: vi.fn((name: string, value: string) => {
      mockStorageData[name] = value;
    }),
    removeItem: vi.fn((name: string) => {
      delete mockStorageData[name];
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageData = {};
    mockApiClient = { setAuthToken: vi.fn() };
    mockAuthAdapter = { 
      onIdTokenChange: vi.fn().mockReturnValue(() => {}),
      signOutUser: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('should persist user to storage when setUser is called', () => {
    const useAuthStore = createAuthStore({
      apiClient: mockApiClient,
      authAdapter: mockAuthAdapter,
      storage: mockStorage,
    });

    const user = { id: '123', email: 'test@example.com', name: 'Test' };
    useAuthStore.getState().setUser(user);

    // Verify storage was called
    expect(mockStorage.setItem).toHaveBeenCalled();
    expect(mockStorageData['auth-storage']).toContain('"user":{"id":"123"');
  });

  it('should recover user from storage on initialization', () => {
    // 1. Pre-fill storage
    const persistedState = JSON.stringify({
      state: { user: { id: 'recover-me', email: 'recovered@example.com', name: 'Recovered' } },
      version: 0
    });
    mockStorageData['auth-storage'] = persistedState;

    // 2. Create store (it should read from storage)
    const useAuthStore = createAuthStore({
      apiClient: mockApiClient,
      authAdapter: mockAuthAdapter,
      storage: mockStorage,
    });

    // 3. Verify recovered state
    const state = useAuthStore.getState();
    expect(state.user?.id).toBe('recover-me');
  });

  it('should clear storage on logout', async () => {
    const useAuthStore = createAuthStore({
      apiClient: mockApiClient,
      authAdapter: mockAuthAdapter,
      storage: mockStorage,
    });

    useAuthStore.getState().setUser({ id: '123', email: 't@e.com', name: 'T' });
    expect(mockStorageData['auth-storage']).toBeDefined();

    await useAuthStore.getState().logout();

    // Zustand persist middleware updates the storage after state change
    expect(useAuthStore.getState().user).toBeNull();
    expect(mockStorageData['auth-storage']).toContain('"user":null');
  });
});
