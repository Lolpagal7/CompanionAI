import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Ultra-secure Firebase configuration with encoding and obfuscation
const getSecureFirebaseConfig = () => {
  // Multiple layers of obfuscation
  const encodedKey = import.meta.env.VITE_FB_ENCODED_KEY;
  const keyOffset = parseInt(import.meta.env.VITE_FB_KEY_OFFSET || '0');
  
  if (!encodedKey) {
    throw new Error('Firebase configuration not available');
  }

  // Decode and deobfuscate the API key
  let decodedKey;
  try {
    // Reverse the offset transformation
    const adjustedKey = encodedKey.split('').map((char) => {
      const charCode = char.charCodeAt(0) - keyOffset;
      return String.fromCharCode(charCode);
    }).join('');
    
    // Base64 decode
    decodedKey = atob(adjustedKey);
  } catch (error) {
    throw new Error('Invalid Firebase configuration');
  }

  return {
    apiKey: decodedKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
};

// Runtime configuration generation
const firebaseConfig = getSecureFirebaseConfig();

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth and db instances
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const bucketName = firebaseConfig.storageBucket;
