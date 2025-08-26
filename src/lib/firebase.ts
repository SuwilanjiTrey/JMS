import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef123456',
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  // If app already initialized, use the existing one
  if (error.code === 'app/duplicate-app') {
    app = initializeApp(firebaseConfig, 'secondary');
  } else {
    console.error('Firebase initialization error:', error);
    // For demo purposes, we'll continue without Firebase
    app = null;
  }
}

// Initialize services only if app is initialized
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
export const auth = app ? getAuth(app) : null;

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  CASES: 'cases',
  HEARINGS: 'hearings',
  DOCUMENTS: 'documents',
  RULINGS: 'rulings',
  ROLES: 'roles',
} as const;

// Document references helper
export const getUserRef = (userId: string) => 
  db?.collection(COLLECTIONS.USERS)?.doc(userId);

export const getCaseRef = (caseId: string) => 
  db?.collection(COLLECTIONS.CASES)?.doc(caseId);

export const getHearingRef = (hearingId: string) => 
  db?.collection(COLLECTIONS.HEARINGS)?.doc(hearingId);

export const getDocumentRef = (documentId: string) => 
  db?.collection(COLLECTIONS.DOCUMENTS)?.doc(documentId);

export const getRulingRef = (rulingId: string) => 
  db?.collection(COLLECTIONS.RULINGS)?.doc(rulingId);

export default app;