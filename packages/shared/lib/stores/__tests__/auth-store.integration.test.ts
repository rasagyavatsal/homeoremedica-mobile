import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthStore } from '../auth-store';
import { createMockApiClient, createMockAuthAdapter, createMockStorage } from '../../__tests__/test-utils';

describe('auth-store integration', () => {
  let mockApiClient: ReturnType<typeof createMockApiClient>;
  let mockAuthAdapter: ReturnType<typeof createMockAuthAdapter>;
  let mockStorage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    mockApiClient = createMockApiClient();
    mockAuthAdapter = createMockAuthAdapter();
    mockStorage = createMockStorage();
  });

  describe('signUp flow', () => {
    it('creates user, sets token, and calls getSession with name', async () => {
      const firebaseUser = { uid: 'new-uid', email: 'new@test.com', displayName: 'New User' };
      mockAuthAdapter.signUpWithEmail.mockResolvedValue(firebaseUser);

      const store = createAuthStore({
        apiClient: mockApiClient as any,
        authAdapter: mockAuthAdapter,
        storage: mockStorage,
      });

      await store.getState().signUp('new@test.com', 'password123', 'New User');

      const state = store.getState();
      expect(state.user).toEqual({
        id: 'new-uid',
        email: 'new@test.com',
        name: 'New User',
      });
      expect(state.loading).toBe(false);
      expect(mockAuthAdapter.signUpWithEmail).toHaveBeenCalledWith('new@test.com', 'password123', 'New User');
      expect(mockAuthAdapter.getCurrentUserToken).toHaveBeenCalled();
      expect(mockApiClient.setAuthToken).toHaveBeenCalledWith('mock-token');
      expect(mockApiClient.getSession).toHaveBeenCalledWith('New User');
    });

    it('uses displayName when name param is not provided', async () => {
      const firebaseUser = { uid: 'uid-1', email: 'a@b.com', displayName: 'Display' };
      mockAuthAdapter.signUpWithEmail.mockResolvedValue(firebaseUser);

      const store = createAuthStore({
        apiClient: mockApiClient as any,
        authAdapter: mockAuthAdapter,
        storage: mockStorage,
      });

      await store.getState().signUp('a@b.com', 'pass');

      expect(store.getState().user?.name).toBe('Display');
    });
  });

  describe('signInWithGoogle flow', () => {
    it('handles Google adapter, sets token, and calls getSession', async () => {
      const googleUser = { uid: 'google-uid', email: 'google@test.com', displayName: 'Google User' };
      mockAuthAdapter.signInWithGoogle.mockResolvedValue(googleUser);

      const store = createAuthStore({
        apiClient: mockApiClient as any,
        authAdapter: mockAuthAdapter,
        storage: mockStorage,
      });

      await store.getState().signInWithGoogle();

      const state = store.getState();
      expect(state.user).toEqual({
        id: 'google-uid',
        email: 'google@test.com',
        name: 'Google User',
      });
      expect(mockApiClient.setAuthToken).toHaveBeenCalledWith('mock-token');
      expect(mockApiClient.getSession).toHaveBeenCalledWith('Google User');
    });

    it('throws backend/connection-failed on network error', async () => {
      mockAuthAdapter.signInWithGoogle.mockRejectedValue(new Error('network fetch failed'));

      const store = createAuthStore({
        apiClient: mockApiClient as any,
        authAdapter: mockAuthAdapter,
        storage: mockStorage,
      });

      await expect(store.getState().signInWithGoogle()).rejects.toMatchObject({
        code: 'backend/connection-failed',
      });
      expect(store.getState().loading).toBe(false);
    });

    it('re-throws non-network errors as-is', async () => {
      const popupError = new Error('Popup closed');
      (popupError as any).code = 'auth/popup-closed-by-user';
      mockAuthAdapter.signInWithGoogle.mockRejectedValue(popupError);

      const store = createAuthStore({
        apiClient: mockApiClient as any,
        authAdapter: mockAuthAdapter,
        storage: mockStorage,
      });

      await expect(store.getState().signInWithGoogle()).rejects.toThrow('Popup closed');
    });
  });

  describe('changePassword', () => {
    it('delegates to adapter', async () => {
      const store = createAuthStore({
        apiClient: mockApiClient as any,
        authAdapter: mockAuthAdapter,
        storage: mockStorage,
      });

      await store.getState().changePassword('oldPass', 'newPass');

      expect(mockAuthAdapter.changePassword).toHaveBeenCalledWith('oldPass', 'newPass');
    });
  });

  describe('initializeAuthListener', () => {
    it('updates user on token change and sets initialized: true', () => {
      let capturedCallback: ((token: string | null, user: any) => void) | null = null;
      mockAuthAdapter.onIdTokenChange.mockImplementation((cb: any) => {
        capturedCallback = cb;
        return () => {};
      });

      const store = createAuthStore({
        apiClient: mockApiClient as any,
        authAdapter: mockAuthAdapter,
        storage: mockStorage,
      });

      expect(store.getState().initialized).toBe(false);

      store.getState().initializeAuthListener();

      expect(capturedCallback).not.toBeNull();

      // Simulate token change with user
      capturedCallback!('new-token', {
        uid: 'listener-uid',
        email: 'listener@test.com',
        displayName: 'Listener User',
      });

      const state = store.getState();
      expect(state.initialized).toBe(true);
      expect(state.user).toEqual({
        id: 'listener-uid',
        email: 'listener@test.com',
        name: 'Listener User',
      });
      expect(mockApiClient.setAuthToken).toHaveBeenCalledWith('new-token');
    });

    it('sets user to null when no firebase user', () => {
      let capturedCallback: ((token: string | null, user: any) => void) | null = null;
      mockAuthAdapter.onIdTokenChange.mockImplementation((cb: any) => {
        capturedCallback = cb;
        return () => {};
      });

      const store = createAuthStore({
        apiClient: mockApiClient as any,
        authAdapter: mockAuthAdapter,
        storage: mockStorage,
      });

      store.getState().initializeAuthListener();
      capturedCallback!(null, null);

      expect(store.getState().user).toBeNull();
      expect(store.getState().initialized).toBe(true);
    });
  });

  describe('onLogout callback', () => {
    it('fires on logout', async () => {
      const onLogout = vi.fn();

      const store = createAuthStore({
        apiClient: mockApiClient as any,
        authAdapter: mockAuthAdapter,
        storage: mockStorage,
        onLogout,
      });

      store.getState().setUser({ id: '1', email: 'a@b.com', name: 'Test' });
      await store.getState().logout();

      expect(onLogout).toHaveBeenCalledTimes(1);
      expect(store.getState().user).toBeNull();
      expect(mockApiClient.setAuthToken).toHaveBeenCalledWith(null);
    });
  });
});
