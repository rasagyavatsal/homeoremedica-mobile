import { createAuthStore, AuthAdapter } from '@homeoremedica/shared';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  signInWithGoogle,
  signOutUser, 
  getCurrentUserToken,
  onIdTokenChange,
  changePassword as firebaseChangePassword
} from '@/lib/auth/firebase-auth';
import { apiClient } from '@/lib/api/client';

const rnAuthAdapter: AuthAdapter = {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOutUser,
  getCurrentUserToken,
  onIdTokenChange,
  changePassword: firebaseChangePassword,
};

// Helper to safely get AsyncStorage
const getStorageFallback = () => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    if (!AsyncStorage) throw new Error('AsyncStorage is null');
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
};

const rnStorage = getStorageFallback();

export const useAuthStore = createAuthStore({
  apiClient,
  authAdapter: rnAuthAdapter,
  storage: rnStorage,
});
