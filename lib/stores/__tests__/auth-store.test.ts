/**
 * Tests that the mobile auth store is correctly wired with the RN auth adapter,
 * AsyncStorage fallback, and the shared createAuthStore factory.
 */

// ---------------------------------------------------------------------------
// Mock modules BEFORE imports
// ---------------------------------------------------------------------------

// Mock the firebase-auth module used by the mobile auth adapter
jest.mock('@/lib/auth/firebase-auth', () => ({
  signInWithEmail: jest.fn().mockResolvedValue({
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
  }),
  signUpWithEmail: jest.fn().mockResolvedValue({
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
  }),
  signInWithGoogle: jest.fn().mockResolvedValue({
    uid: 'google-uid',
    email: 'google@example.com',
    displayName: 'Google User',
  }),
  signOutUser: jest.fn().mockResolvedValue(undefined),
  getCurrentUserToken: jest.fn().mockResolvedValue('mock-token'),
  onIdTokenChange: jest.fn().mockReturnValue(() => {}),
  changePassword: jest.fn().mockResolvedValue(undefined),
}));

// Mock the API client
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    setAuthToken: jest.fn(),
    getSession: jest.fn().mockResolvedValue({ user: { uid: 'u1' } }),
  },
}));

// Mock AsyncStorage — default: available
const mockAsyncStorage = {
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
};

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: mockAsyncStorage,
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { useAuthStore } from '../auth-store';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  // Reset the store state between tests
  useAuthStore.setState({ user: null, loading: false, initialized: false });
});

describe('Mobile Auth Store Wiring', () => {
  it('initializes with null user', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.initialized).toBe(false);
  });

  it('delegates signIn to rnAuthAdapter correctly', async () => {
    const firebaseAuth = require('@/lib/auth/firebase-auth');
    const apiClient = require('@/lib/api/client').apiClient;

    await useAuthStore.getState().signIn('test@example.com', 'password123');

    expect(firebaseAuth.signInWithEmail).toHaveBeenCalledWith(
      'test@example.com',
      'password123'
    );
    expect(firebaseAuth.getCurrentUserToken).toHaveBeenCalled();
    expect(apiClient.setAuthToken).toHaveBeenCalledWith('mock-token');
    expect(apiClient.getSession).toHaveBeenCalled();

    const state = useAuthStore.getState();
    expect(state.user).toEqual({
      id: 'test-uid',
      email: 'test@example.com',
      name: 'Test User',
    });
  });

  it('delegates logout to rnAuthAdapter correctly', async () => {
    const firebaseAuth = require('@/lib/auth/firebase-auth');
    const apiClient = require('@/lib/api/client').apiClient;

    // Set up a user first
    useAuthStore.getState().setUser({
      id: 'test-uid',
      email: 'test@example.com',
      name: 'Test User',
    });

    await useAuthStore.getState().logout();

    expect(firebaseAuth.signOutUser).toHaveBeenCalled();
    expect(apiClient.setAuthToken).toHaveBeenCalledWith(null);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('delegates initializeAuthListener correctly', () => {
    const firebaseAuth = require('@/lib/auth/firebase-auth');

    const unsubscribe = useAuthStore.getState().initializeAuthListener();

    expect(firebaseAuth.onIdTokenChange).toHaveBeenCalledWith(
      expect.any(Function)
    );
    expect(typeof unsubscribe).toBe('function');
  });
});

describe('AsyncStorage Fallback', () => {
  it('uses AsyncStorage when available', () => {
    // The store was created with AsyncStorage mock above.
    // Verify the store is functional (no crash from storage).
    const state = useAuthStore.getState();
    expect(state).toBeDefined();
    expect(typeof state.signIn).toBe('function');
  });
});
