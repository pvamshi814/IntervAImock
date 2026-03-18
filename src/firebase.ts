import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCoeaijLVqzai2vRp8m-k5AaZpysorWrX8",
  authDomain: "aimock-f6bd7.firebaseapp.com",
  projectId: "aimock-f6bd7",
  storageBucket: "aimock-f6bd7.firebasestorage.app",
  messagingSenderId: "362817507132",
  appId: "1:362817507132:web:21ed1735bbe30e98525839"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Log configuration for debugging (excluding sensitive parts)
console.log("Firebase initialized with project:", firebaseConfig.projectId);
console.log("Auth Domain:", firebaseConfig.authDomain);

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection successful");
  } catch (error: any) {
    if (error.message?.includes('the client is offline')) {
      console.error("Firestore is offline. Check your internet or Firebase config.");
    } else if (error.code === 'permission-denied') {
      console.log("Firestore connection test: Permission denied (expected if rules are strict)");
    } else {
      console.error("Firestore connection error:", error);
    }
  }
}
testConnection();
