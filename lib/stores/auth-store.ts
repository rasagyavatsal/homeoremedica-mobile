import type { StateStorage } from 'zustand/middleware';

import { apiClient } from '@/lib/api/client';
import {
  changePassword as firebaseChangePassword,
  getCurrentUserToken,
  onIdTokenChange,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  signUpWithEmail,
} from '@/lib/auth/firebase-auth';
import { createAuthStore, type AuthAdapter } from './create-auth-store';

const rnAuthAdapter: AuthAdapter = {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOutUser,
  getCurrentUserToken,
  onIdTokenChange,
  changePassword: firebaseChangePassword,
};

function getStorageFallback(): StateStorage {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    if (!AsyncStorage) {
      throw new Error('AsyncStorage is null');
    }
    return AsyncStorage;
  } catch (error) {
    console.warn('AsyncStorage is not available. Using in-memory storage fallback.', error);
    const memoryStorage: Record<string, string> = {};

    return {
      getItem: (name: string) => memoryStorage[name] ?? null,
      setItem: (name: string, value: string) => {
        memoryStorage[name] = value;
      },
      removeItem: (name: string) => {
        delete memoryStorage[name];
      },
    };
  }
}

export const useAuthStore = createAuthStore({
  apiClient,
  authAdapter: rnAuthAdapter,
  storage: getStorageFallback(),
});
