import { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup, // ✅ ADD THIS
  GoogleAuthProvider // ✅ ADD THIS
} from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setCurrentUser(user);

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setRole(snap.data().role || "user");
        } else {
          // Create user document if it doesn't exist (for Google sign-in)
          await setDoc(ref, {
            uid: user.uid,
            email: user.email,
            role: "user",
            createdAt: new Date(),
          });
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const register = async (email, password) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = cred.user;

      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        email: newUser.email,
        role: "user",
        createdAt: new Date(),
      });

      return newUser;
    } catch (error) {
      console.error("Erreur inscription:", error);
      throw error;
    }
  };

  // ✅ ADD GOOGLE SIGN-IN
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error("Error with Google sign-in:", error);
      throw error;
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        loading,
        login,
        register,
        logout,
        signInWithGoogle, // ✅ ADD THIS
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);