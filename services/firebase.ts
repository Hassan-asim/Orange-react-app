import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDwreuu-6OSPxakFa8NRuHJLOLGicRPlJc",
  authDomain: "orange-5fa42.firebaseapp.com",
  projectId: "orange-5fa42",
  storageBucket: "orange-5fa42.firebasestorage.app",
  messagingSenderId: "1069432460023",
  appId: "1:1069432460023:web:058aa81f78b1bc455b39f2"
};

// Initialize Firebase (compat version only for auth)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize modular app (v9+) for Firestore operations
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

// Get Firebase services
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Modular exports for Firestore operations
const modularApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
// Prefer long-polling to avoid HTTP/2/QUIC issues for broader compatibility
const modularDb = initializeFirestore(modularApp, {
  experimentalAutoDetectLongPolling: true
});

export { auth, googleProvider, modularApp, modularDb };