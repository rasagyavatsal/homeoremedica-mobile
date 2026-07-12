import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { createFirebaseAuthCore, mapFirebaseUser } from '@homeoremedica/shared';
import type { FirebaseUser } from '@homeoremedica/shared';

const core = createFirebaseAuthCore({
  auth,
  signInWithGoogle: async () => {
    try {
      let GoogleSignin;
      try {
        const module = require('@react-native-google-signin/google-signin');
        GoogleSignin = module.GoogleSignin;
      } catch (error) {
        console.warn('Google Sign-In native module could not be loaded:', error);
        throw new Error('Google Sign-In is not supported in this environment (Expo Go or missing native module).');
      }
      
      if (!GoogleSignin) {
        throw new Error('Google Sign-In is not supported in this environment (Native module missing).');
      }

      // Configure Google Sign-In inside the call to be safe
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true,
      });

      // Check if your device has Google Play Services
      const checkPlayServices = GoogleSignin.checkPlayServices || GoogleSignin.hasPlayServices;
      await checkPlayServices({ showPlayServicesUpdateDialog: true });

      // Get the users ID token
      let response = await GoogleSignin.signIn();
      
      // If no saved credential found, prompt for one (createAccount)
      if (response.type === 'noSavedCredentialFound' && GoogleSignin.createAccount) {
        response = await GoogleSignin.createAccount();
      }

      // In v13+, the response is nested under .data
      const idToken = response.data?.idToken || (response as any).idToken;

      if (!idToken) {
        if (response.type === 'cancelled') {
          throw new Error('Google Sign-In was cancelled');
        }
        throw new Error('No ID token found from Google Sign-In');
      }

      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      const userCredential = await signInWithCredential(auth, googleCredential);
      return mapFirebaseUser(userCredential.user);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  },
  signOutGoogle: async () => {
    try {
      let GoogleSignin;
      try {
        const module = require('@react-native-google-signin/google-signin');
        GoogleSignin = module.GoogleSignin;
      } catch (error) {
        console.warn('Google Sign-In native module could not be loaded during sign-out:', error);
      }
      
      if (GoogleSignin) {
        await GoogleSignin.signOut();
      }
    } catch (error) {
      console.warn('Google Sign-In sign-out failed:', error);
    }
  },
  tokenConfig: {
    timeoutMs: 5000,
    maxAttempts: 1,
  },
});

export type { FirebaseUser };

export const signInWithEmail = core.signInWithEmail;
export const signUpWithEmail = core.signUpWithEmail;
export const signInWithGoogle = core.signInWithGoogle;
export const signOutUser = core.signOutUser;
export const waitForFirebaseUser = core.waitForFirebaseUser;
export const getCurrentUserToken = core.getCurrentUserToken;
export const onAuthStateChange = core.onAuthStateChange;
export const onIdTokenChange = core.onIdTokenChange;
export const sendPasswordReset = core.sendPasswordReset;
export const changePassword = core.changePassword;
export const isGoogleUser = core.isGoogleUser;
