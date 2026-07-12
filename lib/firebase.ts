import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID_ANDROID,
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Safely get AsyncStorage for persistence
let persistence;
try {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  if (AsyncStorage) {
    persistence = getReactNativePersistence(AsyncStorage);
  }
} catch (error) {
  console.warn('Firebase Auth persistence disabled: AsyncStorage not available', error);
}

// Initialize Firebase Authentication
const auth = initializeAuth(app, {
  persistence
});

const db = getFirestore(app);

export { auth, db };
export default app;
