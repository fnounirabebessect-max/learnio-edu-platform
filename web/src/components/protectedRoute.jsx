import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext"; 
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRole(docSnap.data().role);
        }
      }
      setLoading(false);
    };
    fetchRole();
  }, [user]);

  if (loading) return <p>Loading...</p>;

  if (!user) return <Navigate to="/login" replace />; // pas connecté
  if (adminOnly && role !== "admin") return <Navigate to="/dashboard" replace />; // pas admin

  return children;
};

export default ProtectedRoute;
