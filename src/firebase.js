import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCuou2SVl0pc4tGya4adVFVGIav1ETf3ZM",
  authDomain: "social-media-creator-b6df8.firebaseapp.com",
  projectId: "social-media-creator-b6df8",
  storageBucket: "social-media-creator-b6df8.firebasestorage.app",
  messagingSenderId: "643281424957",
  appId: "1:643281424957:web:ea0f9f4639b4feff999054",
  measurementId: "G-RR951QF8L6"
};

const app = initializeApp(firebaseConfig);
if (typeof window !== 'undefined') {
  console.log(`✅ Firebase initialized for project: ${firebaseConfig.projectId}`);
}
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
