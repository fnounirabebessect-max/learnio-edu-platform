import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDl9GWeXlC9fxPvY0wnvuzAZD4Jmrrh9kQ",
  authDomain: "learnio-edu-platform.firebaseapp.com",
  projectId: "learnio-edu-platform",
  storageBucket: "learnio-edu-platform.firebasestorage.app",
  messagingSenderId: "633537696725",
  appId: "1:633537696725:web:3fb637ab947a9e00ef635c",
  measurementId: "G-6FNLRMLLPY"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);