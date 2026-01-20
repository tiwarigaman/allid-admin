// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// App Check
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

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
 * 🔐 APP CHECK (compatible with older Firebase SDKs)
 * =====================================================
 *
 * PROD: reCAPTCHA v3 provider
 * DEV : debug token mode + still uses reCAPTCHA provider (OK)
 *
 * IMPORTANT:
 * - In DEV, Firebase prints a debug token in console. Add it in:
 *   Firebase Console → App Check → Debug tokens
 */
if (import.meta.env.DEV) {
  // enables debug token mode (Firebase will print token)
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

// Always provide ReCaptchaV3Provider (works for both DEV + PROD)
export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(
    import.meta.env.VITE_FIREBASE_RECAPTCHA_V3_SITE_KEY
  ),
  isTokenAutoRefreshEnabled: true,
});

// Analytics only runs in browser
isSupported().then((yes) => {
  if (yes) getAnalytics(app);
});

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
