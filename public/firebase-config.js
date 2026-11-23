// Configuration et initialisation Firebase MEVA
import { initializeApp } from "/vendor/firebase/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  connectAuthEmulator
} from "/vendor/firebase/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot,
  connectFirestoreEmulator
} from "/vendor/firebase/firebase-firestore.js";
import { getDatabase, connectDatabaseEmulator } from "/vendor/firebase/firebase-database.js";

import { firebaseConfig, emulators } from "./firebase-config.generated.js";

// Initialisation
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

// Dev : bascule sur les émulateurs Firebase (voir .env.dev)
if (emulators) {
  connectAuthEmulator(auth, `http://${emulators.host}:${emulators.authPort}`, { disableWarnings: true });
  connectFirestoreEmulator(db, emulators.host, emulators.firestorePort);
  connectDatabaseEmulator(rtdb, emulators.host, emulators.databasePort);
}

// Exports pratiques pour les requêtes
export { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot 
};