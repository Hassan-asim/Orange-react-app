import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDwreuu-6OSPxakFa8NRuHJLOLGicRPlJc",
  authDomain: "orange-5fa42.firebaseapp.com",
  projectId: "orange-5fa42",
  storageBucket: "orange-5fa42.firebasestorage.app",
  messagingSenderId: "1069432460023",
  appId: "1:1069432460023:web:058aa81f78b1bc455b39f2"
};


// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}


// Get Firebase services
const auth = firebase.auth();
const firestore = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();
const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;

export { auth, firestore, googleProvider, serverTimestamp };