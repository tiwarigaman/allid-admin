// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// ✅ App Check
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  debugProvider,
} from "firebase/app-check";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

/**
 * =====================================================
 * 🔐 APP CHECK
 * DEV  : debug provider (requires adding debug token in Firebase Console)
 * PROD : reCAPTCHA v3 provider
 * =====================================================
 */
const appCheckProvider = import.meta.env.PROD
  ? new ReCaptchaV3Provider(import.meta.env.VITE_FIREBASE_RECAPTCHA_V3_SITE_KEY)
  : debugProvider(); // ✅ explicit debug provider fixes your error

export const appCheck = initializeAppCheck(app, {
  provider: appCheckProvider,
  isTokenAutoRefreshEnabled: true,
});

// Analytics only runs in browser
isSupported().then((yes) => {
  if (yes) getAnalytics(app);
});

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
