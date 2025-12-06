import { db } from "../services/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";


// FETCH USER DOCUMENT
export const getUserProfile = async (uid) => {
  const userDoc = await getDoc(doc(db, "users", uid));
  return userDoc.exists() ? userDoc.data() : null;
};


// UPDATE USER PROFILE
export const updateUserProfile = async (uid, data) => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, data);
  return true;
};
