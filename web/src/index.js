// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./router/AppRouter";
import { AuthProvider } from "./context/authContext";
import { CartProvider } from "./context/CartContext"; // ADD THIS

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AuthProvider>
    <CartProvider> {/* WRAP WITH CartProvider */}
      <AppRouter />
    </CartProvider>
  </AuthProvider>
);