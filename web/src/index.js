import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./router/AppRouter";

import { AuthProvider } from "./context/authContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AuthProvider>
    <AppRouter />
  </AuthProvider>
);
