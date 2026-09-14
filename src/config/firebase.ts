// Firebase Firestore integration configuration & initialization

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import type { FirebaseConfigData } from '../types/game';

const LOCAL_STORAGE_KEY = 'word_blaster_firebase_config';

// Default / production Firebase config
export const DEFAULT_FIREBASE_CONFIG: FirebaseConfigData = {
  apiKey: "AIzaSyCPahwM9uFBSdt74mOpAO9uw9qHu1NAWms",
  authDomain: "word-blaster-game.firebaseapp.com",
  projectId: "word-blaster-game",
  storageBucket: "word-blaster-game.firebasestorage.app",
  messagingSenderId: "332161788489",
  appId: "1:332161788489:web:358706395d0781155ced98"
};

export function getSavedFirebaseConfig(): FirebaseConfigData | null {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load Firebase config from localStorage", e);
  }
  return null;
}

export function saveFirebaseConfig(config: FirebaseConfigData): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save Firebase config to localStorage", e);
  }
}

export function clearFirebaseConfig(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (e) {
    console.error("Failed to remove Firebase config", e);
  }
}

let firebaseAppInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;

export function getFirebaseApp(): { app: FirebaseApp | null; db: Firestore | null; isConfigured: boolean } {
  const config = getSavedFirebaseConfig() || DEFAULT_FIREBASE_CONFIG;
  
  if (!config || !config.apiKey || config.apiKey.includes('DemoKey')) {
    return { app: null, db: null, isConfigured: false };
  }

  try {
    if (!firebaseAppInstance) {
      const apps = getApps();
      if (apps.length > 0) {
        firebaseAppInstance = apps[0];
      } else {
        firebaseAppInstance = initializeApp(config);
      }
      firestoreInstance = getFirestore(firebaseAppInstance);
    }
    return { app: firebaseAppInstance, db: firestoreInstance, isConfigured: true };
  } catch (err) {
    console.warn("Could not initialize Firebase Firestore with provided config:", err);
    return { app: null, db: null, isConfigured: false };
  }
}

export function resetFirebaseInstance(): void {
  firebaseAppInstance = null;
  firestoreInstance = null;
}
