import React from "react";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div>
      <h1>Bienvenue {user?.email}</h1>
      <button onClick={handleLogout}>Se déconnecter</button>
    </div>
  );
}
