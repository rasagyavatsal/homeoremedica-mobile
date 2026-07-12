import { 
  Auth,
  User,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  onIdTokenChanged,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface FirebaseUser {
  uid: string;
  email: string;
  displayName?: string;
}

export interface FirebaseAuthCoreConfig {
  auth: Auth;
  signInWithGoogle: () => Promise<FirebaseUser>;
  signOutGoogle?: () => Promise<void>;
  tokenConfig?: {
    timeoutMs?: number;
    maxAttempts?: number;
    backoffMs?: number;
  };
}

export function mapFirebaseUser(user: User): FirebaseUser {
  return {
    uid: user.uid,
    email: user.email!,
    displayName: user.displayName || undefined
  };
}

export function createFirebaseAuthCore(config: FirebaseAuthCoreConfig) {
  const { auth, signInWithGoogle, signOutGoogle, tokenConfig } = config;

  async function waitForFirebaseUser(timeoutMs: number = 5000): Promise<User | null> {
    if (auth.currentUser) return auth.currentUser;

    return new Promise((resolve) => {
      let settled = false;
      let timeout: ReturnType<typeof setTimeout> | undefined;

      const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
        if (settled) return;
        settled = true;
        if (timeout) clearTimeout(timeout);
        unsubscribe();
        resolve(user);
      });

      timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        unsubscribe();
        resolve(auth.currentUser);
      }, timeoutMs);
    });
  }

  async function signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return mapFirebaseUser(userCredential.user);
  }

  async function signUpWithEmail(email: string, password: string, name?: string): Promise<FirebaseUser> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (trimmedName) {
      await updateProfile(user, { displayName: trimmedName });
      // Force token refresh so listeners pick up the updated profile quickly
      await user.getIdToken(true);
    }

    return mapFirebaseUser(user);
  }

  async function signOutUser(): Promise<void> {
    if (signOutGoogle) {
      try {
        await signOutGoogle();
      } catch (error) {
        console.warn('Google Sign-Out failed:', error);
      }
    }
    await signOut(auth);
  }

  async function getCurrentUserToken(): Promise<string | null> {
    try {
      const timeoutMs = tokenConfig?.timeoutMs ?? 5000;
      const user = await waitForFirebaseUser(timeoutMs);
      if (!user) return null;

      const maxAttempts = tokenConfig?.maxAttempts ?? 1;
      const backoffMs = tokenConfig?.backoffMs ?? 200;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const token = await user.getIdToken(attempt > 0);
          if (token) return token;
        } catch (error) {
          console.error('Error getting user token:', error);
        }

        if (attempt < maxAttempts - 1) {
          await sleep(backoffMs * (attempt + 1));
        }
      }

      return await user.getIdToken(maxAttempts > 1);
    } catch (error) {
      console.error('Error getting user token:', error);
      return null;
    }
  }

  function onIdTokenChange(
    callback: (token: string | null, user: FirebaseUser | null) => void
  ): () => void {
    return onIdTokenChanged(auth, async (user: User | null) => {
      if (!user) {
        callback(null, null);
        return;
      }
      try {
        const token = await user.getIdToken();
        callback(token, mapFirebaseUser(user));
      } catch (err) {
        console.error('Error refreshing ID token:', err);
        callback(null, mapFirebaseUser(user));
      }
    });
  }

  function onAuthStateChange(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        callback(mapFirebaseUser(user));
      } else {
        callback(null);
      }
    });
  }

  async function sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user?.email) {
      throw new Error('No user is currently signed in');
    }

    if (currentPassword === newPassword) {
      throw new Error('New password must be different from the current password');
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
    } catch (error: any) {
      if (error?.code === 'auth/wrong-password') {
        throw new Error('Current password is incorrect');
      }
      if (error?.code === 'auth/requires-recent-login') {
        throw new Error('Please sign in again to update your password');
      }
      if (error?.code === 'auth/weak-password') {
        throw new Error('Password does not meet minimum requirements');
      }
      if (error?.code === 'auth/too-many-requests') {
        throw new Error('Too many attempts. Please try again later');
      }
      throw error;
    }
  }

  function isGoogleUser(): boolean {
    const user = auth.currentUser;
    if (!user) return false;
    return user.providerData.some((provider) => provider.providerId === 'google.com');
  }

  return {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOutUser,
    getCurrentUserToken,
    onIdTokenChange,
    onAuthStateChange,
    sendPasswordReset,
    changePassword,
    isGoogleUser,
    waitForFirebaseUser
  };
}
