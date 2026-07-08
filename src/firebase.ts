import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCbPtzVyAjTTdFtZmN4IfSpb0SMIzCZZA0",
  authDomain: "devpulsebyriyo.firebaseapp.com",
  projectId: "devpulsebyriyo",
  storageBucket: "devpulsebyriyo.firebasestorage.app",
  messagingSenderId: "217372018322",
  appId: "1:217372018322:web:9fa691a1638ce327f4884b",
  measurementId: "G-DWCED7236T"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { signInWithPopup, signOut };
