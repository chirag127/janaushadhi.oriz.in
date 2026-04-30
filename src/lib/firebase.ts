/**
 * Firebase Configuration for Janaushadhi Store
 * Handles missing credentials gracefully during build time
 */

// Firebase config from environment variables (may be empty during build)
const firebaseConfig = {
  apiKey: import.meta.env.FIREBASE_API_KEY || '',
  authDomain: import.meta.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.FIREBASE_APP_ID || '',
};

// Flag to check if we have valid config
const hasFirebaseConfig = Object.values(firebaseConfig).every(v => v && v !== '');

// Export config for runtime use
export { firebaseConfig, hasFirebaseConfig };

// Stubs for build time
export let auth: any = null;
export let db: any = null;
export let googleProvider: any = null;
export let phoneProvider: any = null;
export const collections = {
  users: null,
  orders: null,
  wishlist: null,
};

export const signInWithGoogle = async () => {
  const authInstance = getAuthInstance();
  if (!authInstance) throw new Error("Firebase Auth not initialized");
  const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
  const provider = new GoogleAuthProvider();
  return signInWithPopup(authInstance, provider);
};

export const signOutUser = async () => {
  const authInstance = getAuthInstance();
  if (!authInstance) throw new Error("Firebase Auth not initialized");
  const { signOut } = await import('firebase/auth');
  return signOut(authInstance);
};

export const onAuthStateChanged = (authObj: any, callback: (user: any) => void) => {
  const authInstance = getAuthInstance();
  if (!authInstance) {
    callback(null);
    return () => {};
  }
  const { onAuthStateChanged: firebaseOnAuthStateChanged } = require('firebase/auth');
  return firebaseOnAuthStateChanged(authInstance, callback);
};

// Helper functions that initialize Firebase on-demand in the browser
export function getAuthInstance() {
  if (typeof window === 'undefined' || !hasFirebaseConfig) return null;
  
  try {
    const { initializeApp } = require('firebase/app');
    const { getAuth } = require('firebase/auth');
    const { getFirestore } = require('firebase/firestore');
    
    const app = initializeApp(firebaseConfig);
    return getAuth(app);
  } catch (error) {
    console.error('Firebase Auth initialization failed:', error);
    return null;
  }
}

export function getDbInstance() {
  if (typeof window === 'undefined' || !hasFirebaseConfig) return null;
  
  try {
    const { initializeApp } = require('firebase/app');
    const { getFirestore } = require('firebase/firestore');
    
    const app = initializeApp(firebaseConfig);
    return getFirestore(app);
  } catch (error) {
    console.error('Firestore initialization failed:', error);
    return null;
  }
}
