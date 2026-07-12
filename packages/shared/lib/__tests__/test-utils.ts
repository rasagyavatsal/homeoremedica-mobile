import { vi } from 'vitest';
import { ApiClient } from '../api/client';
import { AuthAdapter } from '../stores/auth-store';
import { StateStorage } from 'zustand/middleware';

/**
 * Create a fully-mocked ApiClient instance with all methods stubbed.
 * Callers can override individual method return values as needed.
 */
export function createMockApiClient(): {
  [K in keyof ApiClient]: ReturnType<typeof vi.fn>;
} & ApiClient {
  return {
    setAuthToken: vi.fn(),
    getSession: vi.fn().mockResolvedValue({ user: { uid: 'mock-uid', email: 'mock@test.com' } }),
    findRemedies: vi.fn().mockResolvedValue({ remedies: [], totalMatches: 0 }),
    getCases: vi.fn().mockResolvedValue({ cases: [] }),
    createCase: vi.fn().mockResolvedValue({ id: 'new-case-id', name: 'New Case' }),
    updateCase: vi.fn().mockResolvedValue({ id: 'case-id', name: 'Updated Case' }),
    deleteCase: vi.fn().mockResolvedValue({ success: true }),
  } as any;
}

/**
 * Create a fully-mocked AuthAdapter with all methods stubbed.
 */
export function createMockAuthAdapter(overrides: Partial<{
  [K in keyof AuthAdapter]: ReturnType<typeof vi.fn>;
}> = {}): AuthAdapter & { [K in keyof AuthAdapter]: ReturnType<typeof vi.fn> } {
  const defaultFirebaseUser = {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  return {
    signInWithEmail: vi.fn().mockResolvedValue(defaultFirebaseUser),
    signUpWithEmail: vi.fn().mockResolvedValue(defaultFirebaseUser),
    signInWithGoogle: vi.fn().mockResolvedValue(defaultFirebaseUser),
    signOutUser: vi.fn().mockResolvedValue(undefined),
    getCurrentUserToken: vi.fn().mockResolvedValue('mock-token'),
    onIdTokenChange: vi.fn().mockReturnValue(() => {}),
    changePassword: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as any;
}

/**
 * Create an in-memory StateStorage mock compatible with Zustand persist.
 */
export function createMockStorage(): StateStorage & {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
  _store: Record<string, string>;
} {
  const store: Record<string, string> = {};
  return {
    _store: store,
    getItem: vi.fn((name: string) => store[name] ?? null),
    setItem: vi.fn((name: string, value: string) => {
      store[name] = value;
    }),
    removeItem: vi.fn((name: string) => {
      delete store[name];
    }),
  };
}
