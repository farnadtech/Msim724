
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "studio-6437170298-9b924",
  appId: "1:378820785975:web:346d45d5d64ad53a16ccb2",
  storageBucket: "studio-6437170298-9b924.firebasestorage.app",
  apiKey: "AIzaSyDV9vXH6TfjuBnJXQvw_zRwOYVVw9KNSac",
  authDomain: "studio-6437170298-9b924.firebaseapp.com",
  messagingSenderId: "378820785975"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const isFirebaseConfigured = firebaseConfig.apiKey !== "AIzaSyDV9vXH6TfjuBnJXQvw_zRwOYVVw9KNSac";

export { app, auth, db, isFirebaseConfigured, firebaseConfig };
