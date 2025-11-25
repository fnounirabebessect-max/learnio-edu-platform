// src/services/authService.js
import { auth } from "../firebase/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

// Connexion
export const login = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Inscription
export const register = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

// Déconnexion
export const logout = () => {
  return auth.signOut();
};
