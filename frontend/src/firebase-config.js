// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBbI-ySGFllOdzniUru0QOoaKe-06Jg8AY",
  authDomain: "movies-review-ddcb1.firebaseapp.com",
  projectId: "movies-review-ddcb1",
  storageBucket: "movies-review-ddcb1.firebasestorage.app",
  messagingSenderId: "871592028051",
  appId: "1:871592028051:web:acba4653cce613293aaa66",
  measurementId: "G-5VX50X6JVN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Auth and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
