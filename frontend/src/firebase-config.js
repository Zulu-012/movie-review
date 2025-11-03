// firebase-config.js - Complete Firebase configuration
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCIQ_r-deACiq13wS8CA3wi74zqkk3BnlI",
  authDomain: "katleho-aee73.firebaseapp.com",
  projectId: "katleho-aee73",
  storageBucket: "katleho-aee73.firebasestorage.app",
  messagingSenderId: "791293567141",
  appId: "1:791293567141:web:9448f9ee3dfaa65512ed4c",
  measurementId: "G-11LF3Y7MP9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };