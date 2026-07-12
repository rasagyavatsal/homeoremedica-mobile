import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthStore } from '../auth-store';

describe('auth-store', () => {
  let mockApiClient: any;
  let mockAuthAdapter: any;
  let mockStorage: any;

  beforeEach(() => {
    mockApiClient = {
      setAuthToken: vi.fn(),
      getSession: vi.fn().mockResolvedValue({}),
    };

    mockAuthAdapter = {
      signInWithEmail: vi.fn(),
      signUpWithEmail: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOutUser: vi.fn(),
      getCurrentUserToken: vi.fn().mockResolvedValue('test-token'),
      onIdTokenChange: vi.fn(),
      changePassword: vi.fn(),
    };

    mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
  });

  it('should initialize with default state', () => {
    const useAuthStore = createAuthStore({
      apiClient: mockApiClient,
      authAdapter: mockAuthAdapter,
      storage: mockStorage,
    });
    
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.initialized).toBe(false);
  });

  it('should sign in successfully', async () => {
    const firebaseUser = { uid: '123', email: 'test@example.com', displayName: 'Test User' };
    mockAuthAdapter.signInWithEmail.mockResolvedValue(firebaseUser);

    const useAuthStore = createAuthStore({
      apiClient: mockApiClient,
      authAdapter: mockAuthAdapter,
      storage: mockStorage,
    });

    await useAuthStore.getState().signIn('test@example.com', 'password');

    const state = useAuthStore.getState();
    expect(state.user).toEqual({
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
    });
    expect(state.loading).toBe(false);
    expect(mockApiClient.setAuthToken).toHaveBeenCalledWith('test-token');
    expect(mockApiClient.getSession).toHaveBeenCalled();
  });

  it('should sign up successfully', async () => {
    const firebaseUser = { uid: '123', email: 'test@example.com', displayName: 'Test User' };
    mockAuthAdapter.signUpWithEmail.mockResolvedValue(firebaseUser);

    const useAuthStore = createAuthStore({
      apiClient: mockApiClient,
      authAdapter: mockAuthAdapter,
      storage: mockStorage,
    });

    await useAuthStore.getState().signUp('test@example.com', 'password', 'New User');

    const state = useAuthStore.getState();
    expect(state.user).toEqual({
      id: '123',
      email: 'test@example.com',
      name: 'New User',
    });
    expect(state.loading).toBe(false);
    expect(mockAuthAdapter.signUpWithEmail).toHaveBeenCalledWith('test@example.com', 'password', 'New User');
    expect(mockApiClient.setAuthToken).toHaveBeenCalledWith('test-token');
    expect(mockApiClient.getSession).toHaveBeenCalledWith('New User');
  });

  it('should handle sign up errors', async () => {
    const error = new Error('Email already in use');
    mockAuthAdapter.signUpWithEmail.mockRejectedValue(error);

    const useAuthStore = createAuthStore({
      apiClient: mockApiClient,
      authAdapter: mockAuthAdapter,
      storage: mockStorage,
    });

    await expect(useAuthStore.getState().signUp('test@example.com', 'password'))
      .rejects.toThrow('Email already in use');

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('should sign in with Google successfully', async () => {
    const firebaseUser = { uid: 'google123', email: 'google@example.com', displayName: 'Google User' };
    mockAuthAdapter.signInWithGoogle.mockResolvedValue(firebaseUser);

    const useAuthStore = createAuthStore({
      apiClient: mockApiClient,
      authAdapter: mockAuthAdapter,
      storage: mockStorage,
    });

    await useAuthStore.getState().signInWithGoogle();

    const state = useAuthStore.getState();
    expect(state.user).toEqual({
      id: 'google123',
      email: 'google@example.com',
      name: 'Google User',
    });
    expect(state.loading).toBe(false);
    expect(mockApiClient.setAuthToken).toHaveBeenCalledWith('test-token');
    expect(mockApiClient.getSession).toHaveBeenCalledWith('Google User');
  });

  it('should wrap network errors in signInWithGoogle', async () => {
    const networkError = new Error('Failed to fetch');
    mockAuthAdapter.signInWithGoogle.mockRejectedValue(networkError);

    const useAuthStore = createAuthStore({
      apiClient: mockApiClient,
      authAdapter: mockAuthAdapter,
      storage: mockStorage,
    });

    try {
      await useAuthStore.getState().signInWithGoogle();
      expect.fail('Should have thrown');
    } catch (error: any) {
      if (error.name === 'AssertionError') throw error;
      expect(error.message).toContain('Failed to connect to backend');
      expect(error.code).toBe('backend/connection-failed');
    }

    expect(useAuthStore.getState().loading).toBe(false);
  });

  it('should logout successfully', async () => {
    const onLogout = vi.fn();
    const useAuthStore = createAuthStore({
      apiClient: mockApiClient,
      authAdapter: mockAuthAdapter,
      storage: mockStorage,
      onLogout,
    });

    // Manually set user first
    useAuthStore.getState().setUser({ id: '123', email: 'test@example.com', name: 'Test User' });
    
    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(mockAuthAdapter.signOutUser).toHaveBeenCalled();
    expect(mockApiClient.setAuthToken).toHaveBeenCalledWith(null);
    expect(onLogout).toHaveBeenCalled();
  });

  it('should handle sign in errors', async () => {
    const error = new Error('Invalid credentials');
    mockAuthAdapter.signInWithEmail.mockRejectedValue(error);

    const useAuthStore = createAuthStore({
      apiClient: mockApiClient,
      authAdapter: mockAuthAdapter,
      storage: mockStorage,
    });

    await expect(useAuthStore.getState().signIn('test@example.com', 'wrong'))
      .rejects.toThrow('Invalid credentials');

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('should delegate changePassword to adapter', async () => {
    const useAuthStore = createAuthStore({
      apiClient: mockApiClient,
      authAdapter: mockAuthAdapter,
      storage: mockStorage,
    });

    await useAuthStore.getState().changePassword('old', 'new');
    expect(mockAuthAdapter.changePassword).toHaveBeenCalledWith('old', 'new');
  });

  it('should initialize auth listener correctly', () => {
    const unsubscribe = vi.fn();
    mockAuthAdapter.onIdTokenChange.mockReturnValue(unsubscribe);

    const useAuthStore = createAuthStore({
      apiClient: mockApiClient,
      authAdapter: mockAuthAdapter,
      storage: mockStorage,
    });

    const result = useAuthStore.getState().initializeAuthListener();
    expect(result).toBe(unsubscribe);
    expect(mockAuthAdapter.onIdTokenChange).toHaveBeenCalled();

    // Simulate token change with user
    const callback = mockAuthAdapter.onIdTokenChange.mock.calls[0][0];
    const firebaseUser = { uid: '456', email: 'other@example.com', displayName: 'Other User' };
    
    callback('new-token', firebaseUser);
    
    let state = useAuthStore.getState();
    expect(state.user).toEqual({
      id: '456',
      email: 'other@example.com',
      name: 'Other User',
    });
    expect(state.initialized).toBe(true);
    expect(mockApiClient.setAuthToken).toHaveBeenCalledWith('new-token');

    // Simulate null user (logout)
    callback(null, null);
    state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.initialized).toBe(true);
    expect(mockApiClient.setAuthToken).toHaveBeenCalledWith(null);
  });
});
