// authContext.jsx - FIXED VERSION
import { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 🔑 Connexion
  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  // 🔑 Inscription + stockage Firestore
  const register = async (email, password) => {
    try {
      // 1️⃣ Créer l'utilisateur dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const newUser = userCredential.user;

      // 2️⃣ Stocker l'utilisateur dans Firestore
      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        email: newUser.email,
        role: "user", // rôle par défaut
        createdAt: new Date(),
      });

      return newUser;
    } catch (error) {
      console.error("Erreur inscription:", error);
      throw error;
    }
  };

  // 🔑 Déconnexion
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);