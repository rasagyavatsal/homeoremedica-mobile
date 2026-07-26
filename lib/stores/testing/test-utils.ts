import type { StateStorage } from 'zustand/middleware';

import type { ApiClient } from '../../api/client';
import type { AuthAdapter } from '../create-auth-store';

type AnyFunction = (...args: any[]) => any;

function mockFunction<T extends AnyFunction>() {
  return jest.fn<ReturnType<T>, Parameters<T>>();
}

/**
 * Creates a fully-mocked ApiClient instance with all methods stubbed.
 * Callers can override individual method return values as needed.
 */
export function createMockApiClient(): jest.Mocked<ApiClient> {
  return {
    setAuthToken: mockFunction<ApiClient['setAuthToken']>(),
    getSession: mockFunction<ApiClient['getSession']>().mockResolvedValue({
      user: { uid: 'mock-uid', email: 'mock@test.com' },
    }),
    findRemedies: mockFunction<ApiClient['findRemedies']>().mockResolvedValue({
      remedies: [],
      totalMatches: 0,
    }),
    getCases: mockFunction<ApiClient['getCases']>().mockResolvedValue({ cases: [] }),
    createCase: mockFunction<ApiClient['createCase']>().mockResolvedValue({
      id: 'new-case-id',
      name: 'New Case',
    }),
    updateCase: mockFunction<ApiClient['updateCase']>().mockResolvedValue({
      id: 'case-id',
      name: 'Updated Case',
    }),
    deleteCase: mockFunction<ApiClient['deleteCase']>().mockResolvedValue({ success: true }),
    searchSymptoms: mockFunction<ApiClient['searchSymptoms']>().mockResolvedValue({
      results: [],
      total: 0,
    }),
  } as unknown as jest.Mocked<ApiClient>;
}

/**
 * Create a fully-mocked AuthAdapter with all methods stubbed.
 */
export function createMockAuthAdapter(
  overrides: Partial<jest.Mocked<AuthAdapter>> = {}
): jest.Mocked<AuthAdapter> {
  const defaultFirebaseUser = {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  return {
    signInWithEmail: mockFunction<AuthAdapter['signInWithEmail']>().mockResolvedValue(
      defaultFirebaseUser
    ),
    signUpWithEmail: mockFunction<AuthAdapter['signUpWithEmail']>().mockResolvedValue(
      defaultFirebaseUser
    ),
    signInWithGoogle: mockFunction<AuthAdapter['signInWithGoogle']>().mockResolvedValue(
      defaultFirebaseUser
    ),
    signOutUser: mockFunction<AuthAdapter['signOutUser']>().mockResolvedValue(undefined),
    getCurrentUserToken:
      mockFunction<AuthAdapter['getCurrentUserToken']>().mockResolvedValue('mock-token'),
    onIdTokenChange:
      mockFunction<AuthAdapter['onIdTokenChange']>().mockReturnValue(() => {}),
    changePassword: mockFunction<AuthAdapter['changePassword']>().mockResolvedValue(undefined),
    ...overrides,
  };
}

/**
 * Create an in-memory StateStorage mock compatible with Zustand persist.
 */
export function createMockStorage(): jest.Mocked<StateStorage> & {
  _store: Record<string, string>;
} {
  const store: Record<string, string> = {};
  return {
    _store: store,
    getItem: jest.fn((name: string) => store[name] ?? null),
    setItem: jest.fn((name: string, value: string) => {
      store[name] = value;
    }),
    removeItem: jest.fn((name: string) => {
      delete store[name];
    }),
  };
}
