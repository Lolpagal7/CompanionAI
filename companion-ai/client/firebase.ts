import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadString, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDQXBbqle4nKmmkbF-P_HtLa943eIuy-0s",
  authDomain: "companion-ai-38676.firebaseapp.com",
  projectId: "companion-ai-38676",
  storageBucket: "companion-ai-38676.appspot.com",
  messagingSenderId: "231277753395",
  appId: "1:231277753395:web:9d2bdb7294537202eedf46",
  measurementId: "G-BZGGR8DDT0E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth and db instances
export const auth = getAuth(app);
export const db = getFirestore(app);
const storage = getStorage(app);
export { storage };
export const bucketName = firebaseConfig.storageBucket;
