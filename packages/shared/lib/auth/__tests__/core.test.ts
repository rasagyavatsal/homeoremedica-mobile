import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFirebaseAuthCore, mapFirebaseUser } from '../core';
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

vi.mock('firebase/auth', () => ({
  reauthenticateWithCredential: vi.fn(),
  updatePassword: vi.fn(),
  EmailAuthProvider: {
    credential: vi.fn(),
  },
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  onIdTokenChanged: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  updateProfile: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
}));

describe('FirebaseAuthCore', () => {
  let mockAuth: any;
  let mockGoogleSignIn: any;
  let mockGoogleSignOut: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGoogleSignIn = vi.fn();
    mockGoogleSignOut = vi.fn();
    mockAuth = {
      currentUser: null,
    };
  });

  describe('mapFirebaseUser', () => {
    it('maps firebase user properly with display name', () => {
      const mockUser = {
        uid: 'uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
      } as unknown as User;

      const result = mapFirebaseUser(mockUser);
      expect(result).toEqual({
        uid: 'uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
      });
    });

    it('maps firebase user properly without display name', () => {
      const mockUser = {
        uid: 'uid-123',
        email: 'test@example.com',
        displayName: null,
      } as unknown as User;

      const result = mapFirebaseUser(mockUser);
      expect(result).toEqual({
        uid: 'uid-123',
        email: 'test@example.com',
        displayName: undefined,
      });
    });
  });

  describe('signInWithEmail', () => {
    it('calls signInWithEmailAndPassword and maps user', async () => {
      const mockUser = {
        uid: 'uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
      };
      (signInWithEmailAndPassword as any).mockResolvedValue({ user: mockUser });

      const core = createFirebaseAuthCore({
        auth: mockAuth,
        signInWithGoogle: mockGoogleSignIn,
      });

      const user = await core.signInWithEmail('test@example.com', 'password123');
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, 'test@example.com', 'password123');
      expect(user).toEqual({
        uid: 'uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
      });
    });
  });

  describe('signUpWithEmail', () => {
    it('creates user and trims display name, calls updateProfile and user.getIdToken', async () => {
      const mockUser = {
        uid: 'uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
        getIdToken: vi.fn().mockResolvedValue('token-123'),
      };
      (createUserWithEmailAndPassword as any).mockResolvedValue({ user: mockUser });

      const core = createFirebaseAuthCore({
        auth: mockAuth,
        signInWithGoogle: mockGoogleSignIn,
      });

      const user = await core.signUpWithEmail('test@example.com', 'password123', '  Test User  ');
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, 'test@example.com', 'password123');
      expect(updateProfile).toHaveBeenCalledWith(mockUser, { displayName: 'Test User' });
      expect(mockUser.getIdToken).toHaveBeenCalledWith(true);
      expect(user).toEqual({
        uid: 'uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
      });
    });

    it('creates user without name and skips updateProfile', async () => {
      const mockUser = {
        uid: 'uid-123',
        email: 'test@example.com',
        displayName: null,
      };
      (createUserWithEmailAndPassword as any).mockResolvedValue({ user: mockUser });

      const core = createFirebaseAuthCore({
        auth: mockAuth,
        signInWithGoogle: mockGoogleSignIn,
      });

      const user = await core.signUpWithEmail('test@example.com', 'password123');
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, 'test@example.com', 'password123');
      expect(updateProfile).not.toHaveBeenCalled();
      expect(user).toEqual({
        uid: 'uid-123',
        email: 'test@example.com',
        displayName: undefined,
      });
    });
  });

  describe('signOutUser', () => {
    it('calls signOutGoogle if configured and then signOut', async () => {
      const core = createFirebaseAuthCore({
        auth: mockAuth,
        signInWithGoogle: mockGoogleSignIn,
        signOutGoogle: mockGoogleSignOut,
      });

      await core.signOutUser();
      expect(mockGoogleSignOut).toHaveBeenCalled();
      expect(signOut).toHaveBeenCalledWith(mockAuth);
    });

    it('continues sign out if signOutGoogle throws', async () => {
      mockGoogleSignOut.mockRejectedValue(new Error('google sign out error'));
      const core = createFirebaseAuthCore({
        auth: mockAuth,
        signInWithGoogle: mockGoogleSignIn,
        signOutGoogle: mockGoogleSignOut,
      });

      await core.signOutUser();
      expect(mockGoogleSignOut).toHaveBeenCalled();
      expect(signOut).toHaveBeenCalledWith(mockAuth);
    });
  });

  describe('onIdTokenChange', () => {
    it('sets up onIdTokenChanged mapping', async () => {
      let registeredCallback: any;
      (onIdTokenChanged as any).mockImplementation((_auth: any, callback: any) => {
        registeredCallback = callback;
        return () => 'unsubscribed';
      });

      const core = createFirebaseAuthCore({
        auth: mockAuth,
        signInWithGoogle: mockGoogleSignIn,
      });

      const mockCallback = vi.fn();
      const unsubscribe = core.onIdTokenChange(mockCallback);

      expect(onIdTokenChanged).toHaveBeenCalledWith(mockAuth, expect.any(Function));
      expect(unsubscribe()).toBe('unsubscribed');

      // Trigger callback with null user
      await registeredCallback(null);
      expect(mockCallback).toHaveBeenCalledWith(null, null);

      // Trigger callback with user
      const mockUser = {
        uid: 'uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
        getIdToken: vi.fn().mockResolvedValue('token-abc'),
      };
      await registeredCallback(mockUser);
      expect(mockUser.getIdToken).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith('token-abc', {
        uid: 'uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
      });
    });
  });

  describe('changePassword', () => {
    it('throws error if user is not signed in', async () => {
      const core = createFirebaseAuthCore({
        auth: mockAuth,
        signInWithGoogle: mockGoogleSignIn,
      });

      await expect(core.changePassword('old-password', 'new-password')).rejects.toThrow('No user is currently signed in');
    });

    it('throws error if passwords are the same', async () => {
      mockAuth.currentUser = { email: 'test@example.com' };
      const core = createFirebaseAuthCore({
        auth: mockAuth,
        signInWithGoogle: mockGoogleSignIn,
      });

      await expect(core.changePassword('same-password', 'same-password')).rejects.toThrow('New password must be different from the current password');
    });

    it('reauthenticates and updates password', async () => {
      const mockUser = { email: 'test@example.com' };
      mockAuth.currentUser = mockUser;
      (EmailAuthProvider.credential as any).mockReturnValue('mock-credential');

      const core = createFirebaseAuthCore({
        auth: mockAuth,
        signInWithGoogle: mockGoogleSignIn,
      });

      await core.changePassword('old-password', 'new-password');
      expect(EmailAuthProvider.credential).toHaveBeenCalledWith('test@example.com', 'old-password');
      expect(reauthenticateWithCredential).toHaveBeenCalledWith(mockUser, 'mock-credential');
      expect(updatePassword).toHaveBeenCalledWith(mockUser, 'new-password');
    });

    it('maps error codes correctly', async () => {
      const mockUser = { email: 'test@example.com' };
      mockAuth.currentUser = mockUser;
      (EmailAuthProvider.credential as any).mockReturnValue('mock-credential');

      const core = createFirebaseAuthCore({
        auth: mockAuth,
        signInWithGoogle: mockGoogleSignIn,
      });

      // auth/wrong-password
      (reauthenticateWithCredential as any).mockRejectedValue({ code: 'auth/wrong-password' });
      await expect(core.changePassword('old-password', 'new-password')).rejects.toThrow('Current password is incorrect');

      // auth/requires-recent-login
      (reauthenticateWithCredential as any).mockRejectedValue({ code: 'auth/requires-recent-login' });
      await expect(core.changePassword('old-password', 'new-password')).rejects.toThrow('Please sign in again to update your password');

      // auth/weak-password
      (reauthenticateWithCredential as any).mockResolvedValue({});
      (updatePassword as any).mockRejectedValue({ code: 'auth/weak-password' });
      await expect(core.changePassword('old-password', 'new-password')).rejects.toThrow('Password does not meet minimum requirements');

      // auth/too-many-requests
      (updatePassword as any).mockRejectedValue({ code: 'auth/too-many-requests' });
      await expect(core.changePassword('old-password', 'new-password')).rejects.toThrow('Too many attempts. Please try again later');
    });
  });

  describe('isGoogleUser', () => {
    it('returns false if no user is signed in', () => {
      const core = createFirebaseAuthCore({
        auth: mockAuth,
        signInWithGoogle: mockGoogleSignIn,
      });
      expect(core.isGoogleUser()).toBe(false);
    });

    it('returns true if a provider is google.com', () => {
      mockAuth.currentUser = {
        providerData: [{ providerId: 'google.com' }],
      };
      const core = createFirebaseAuthCore({
        auth: mockAuth,
        signInWithGoogle: mockGoogleSignIn,
      });
      expect(core.isGoogleUser()).toBe(true);
    });

    it('returns false if no provider is google.com', () => {
      mockAuth.currentUser = {
        providerData: [{ providerId: 'password' }],
      };
      const core = createFirebaseAuthCore({
        auth: mockAuth,
        signInWithGoogle: mockGoogleSignIn,
      });
      expect(core.isGoogleUser()).toBe(false);
    });
  });
});
