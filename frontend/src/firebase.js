// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCPVrz3FQD6cTnB0kjZgJlWEmbUhj99G-4",
  authDomain: "road-scan-ai.firebaseapp.com",
  projectId: "road-scan-ai",
  storageBucket: "road-scan-ai.firebasestorage.app",
  messagingSenderId: "699657765179",
  appId: "1:699657765179:web:870a8e0e4b879af0e9b71e",
  measurementId: "G-NSGYKBYP41"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
