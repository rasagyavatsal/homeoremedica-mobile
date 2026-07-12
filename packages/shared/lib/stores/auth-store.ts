import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { User } from '../../types';

export interface FirebaseUser {
  uid: string;
  email: string;
  displayName?: string;
}

export interface AuthAdapter {
  signInWithEmail: (email: string, password: string) => Promise<FirebaseUser>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<FirebaseUser>;
  signInWithGoogle: () => Promise<FirebaseUser>;
  signOutUser: () => Promise<void>;
  getCurrentUserToken: () => Promise<string | null>;
  onIdTokenChange: (callback: (token: string | null, user: FirebaseUser | null) => void) => () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export interface AuthApiClient {
  setAuthToken: (token: string | null) => void;
  getSession: (name?: string) => Promise<any>;
}

export interface AuthStoreConfig {
  apiClient: AuthApiClient;
  authAdapter: AuthAdapter;
  storage: StateStorage;
  onLogout?: () => void;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  setUser: (user: User | null) => void;
  initializeAuthListener: () => () => void;
}

export function createAuthStore(config: AuthStoreConfig) {
  const { apiClient, authAdapter, storage, onLogout } = config;

  return create<AuthState>()(
    persist(
      (set, get) => ({
        user: null,
        loading: false,
        initialized: false,
        
        signIn: async (email: string, password: string) => {
          set({ loading: true });
          try {
            const firebaseUser = await authAdapter.signInWithEmail(email, password);
            const token = await authAdapter.getCurrentUserToken();
            if (token) {
              apiClient.setAuthToken(token);
            }

            try {
              await apiClient.getSession();
            } catch (error) {
              console.error('Failed to establish backend session after sign-in:', error);
            }

            const user: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || '',
            };
            
            set({ user, loading: false });
          } catch (error) {
            set({ loading: false });
            throw error;
          }
        },
        
        signUp: async (email: string, password: string, name?: string) => {
          set({ loading: true });
          try {
            const firebaseUser = await authAdapter.signUpWithEmail(email, password, name);
            const token = await authAdapter.getCurrentUserToken();
            if (token) {
              apiClient.setAuthToken(token);
            }

            try {
              await apiClient.getSession(name);
            } catch (error) {
              console.error('Failed to establish backend session after sign-up:', error);
            }

            const user: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: name || firebaseUser.displayName || '',
            };
            
            set({ user, loading: false });
          } catch (error) {
            set({ loading: false });
            throw error;
          }
        },

        signInWithGoogle: async () => {
          set({ loading: true });
          try {
            const firebaseUser = await authAdapter.signInWithGoogle();
            const token = await authAdapter.getCurrentUserToken();
            if (token) {
              apiClient.setAuthToken(token);
            }

            try {
              await apiClient.getSession(firebaseUser.displayName);
            } catch (error) {
              console.error('Failed to establish backend session after Google sign-in:', error);
            }

            const user: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || '',
            };
            
            set({ user, loading: false });
          } catch (error: any) {
            set({ loading: false });
            console.error('signInWithGoogle error in store:', error);
            
            if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
              const backendError = new Error('Failed to connect to backend. Please check your connection.');
              (backendError as any).code = 'backend/connection-failed';
              throw backendError;
            }
            
            throw error;
          }
        },
        
        logout: async () => {
          await authAdapter.signOutUser();
          apiClient.setAuthToken(null);
          set({ user: null });
          if (onLogout) {
            onLogout();
          }
        },

        changePassword: async (currentPassword, newPassword) => {
          await authAdapter.changePassword(currentPassword, newPassword);
        },
        
        setUser: (user) => set({ user }),

        initializeAuthListener: () => {
          return authAdapter.onIdTokenChange((token, firebaseUser) => {
            apiClient.setAuthToken(token);
            if (firebaseUser) {
              const currentUser = get().user;
              set({ 
                user: {
                  id: firebaseUser.uid,
                  email: firebaseUser.email,
                  name: firebaseUser.displayName || currentUser?.name || '',
                },
                initialized: true
              });
            } else {
              set({ user: null, initialized: true });
            }
          });
        }
      }),
      {
        name: 'auth-storage',
        storage: createJSONStorage(() => storage),
        partialize: (state) => ({ user: state.user })
      }
    )
  );
}
