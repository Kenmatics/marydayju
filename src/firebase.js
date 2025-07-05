// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDYHhgsmMWX2GbXHUDJINOcuGPOc737iFs",
  authDomain: "marydayju.firebaseapp.com",
  projectId: "marydayju",
  storageBucket: "marydayju.appspot.com",
  messagingSenderId: "863332074231",
  appId: "1:863332074231:web:c4d0bd57453a563e14c9f2",
  measurementId: "G-FVJ39EX345"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore DB
const db = getFirestore(app);

// Firebase Auth
const auth = getAuth(app);

export { db, auth };
