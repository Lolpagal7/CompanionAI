// Advanced Firebase configuration with key obfuscation
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Obfuscated key parts - split across multiple environment variables
const getFirebaseConfig = () => {
  // Runtime key reconstruction to make it harder to extract
  const keyPart1 = import.meta.env.VITE_FB_KEY_P1; // AIzaSy
  const keyPart2 = import.meta.env.VITE_FB_KEY_P2; // DQXBbq
  const keyPart3 = import.meta.env.VITE_FB_KEY_P3; // le4nKm
  const keyPart4 = import.meta.env.VITE_FB_KEY_P4; // mkbF-P
  const keyPart5 = import.meta.env.VITE_FB_KEY_P5; // _HtLa9
  const keyPart6 = import.meta.env.VITE_FB_KEY_P6; // 43eIuy
  const keyPart7 = import.meta.env.VITE_FB_KEY_P7; // -0s

  // Reconstruct the API key at runtime
  const apiKey = `${keyPart1}${keyPart2}${keyPart3}${keyPart4}${keyPart5}${keyPart6}${keyPart7}`;

  return {
    apiKey: apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
};

// Initialize Firebase with obfuscated config
const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);

// Export auth and db instances
export const auth = getAuth(app);
export const db = getFirestore(app);
const storage = getStorage(app);
export { storage };
export const bucketName = firebaseConfig.storageBucket;
