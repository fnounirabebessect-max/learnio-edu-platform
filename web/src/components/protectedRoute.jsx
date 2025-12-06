// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext"; 
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { currentUser, loading: authLoading } = useAuth(); // CHANGE: currentUser instead of user
  const [role, setRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setRole(docSnap.data().role);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
      setRoleLoading(false);
    };
    
    if (!authLoading && currentUser) {
      fetchRole();
    } else if (!authLoading) {
      setRoleLoading(false);
    }
  }, [currentUser, authLoading]);

  if (authLoading || roleLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />; // Not connected
  }
  
  if (adminOnly && role !== "admin") {
    return <Navigate to="/dashboard" replace />; // Not admin
  }

  return children;
};

export default ProtectedRoute;