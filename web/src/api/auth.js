import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";


// LOGIN
export const loginUser = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};


// REGISTER USER + CREATE FIRESTORE DOCUMENT
export const registerUser = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = userCredential.user;

  // Create Firestore profile
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    role: "user",
    createdAt: new Date(),
  });

  return user;
};


// LOGOUT
export const logoutUser = () => signOut(auth);


// FORGOT PASSWORD
export const resetPassword = (email) => {
  return sendPasswordResetEmail(auth, email);
};
