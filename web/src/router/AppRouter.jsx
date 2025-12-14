// src/router/AppRouter.jsx - CLEAN VERSION
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

// Auth pages
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";

// Main pages
import Home from "../pages/Home";
import Dashboard from "../pages/Dashboard";
import Courses from "../pages/course/Courses";
import CourseDetail from "../pages/course/CourseDetail";
import Profile from "../pages/user/Profile";
import Cart from "../pages/cart/Cart";
import Checkout from "../pages/checkout/Checkout";

// Payment pages
import PaymentSuccess from "../pages/payment/PaymentSuccess";
import PaymentFailure from "../pages/payment/PaymentFailure";
import PaymentCancel from "../pages/payment/PaymentCancel";

// Admin pages
import AdminLayout from "../components/layout/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminCourses from "../pages/admin/AdminCourses";
import AdminUsers from "../pages/admin/AdminUsers";

// Components
import ProtectedRoute from "../components/protectedRoute";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

function AppRouter() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {/* Navbar for non-admin routes */}
      <Routes>
        <Route path="/admin/*" element={null} />
        <Route path="*" element={<Navbar />} />
      </Routes>
      
      <main className="main-content">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/cart" element={<Cart />} />
          
          {/* Auth routes */}
          <Route 
            path="/login" 
            element={currentUser ? <Navigate to="/dashboard" /> : <Login />} 
          />
          <Route 
            path="/signup" 
            element={currentUser ? <Navigate to="/dashboard" /> : <Register />} 
          />
          <Route 
            path="/register" 
            element={<Navigate to="/signup" replace />} 
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected: Checkout */}
          <Route 
            path="/checkout" 
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            } 
          />

          {/* Payment callback routes - No auth required for callbacks */}
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failure" element={<PaymentFailure />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />

          {/* Protected: User routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Protected: Admin routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      
      {/* Footer for non-admin routes */}
      <Routes>
        <Route path="/admin/*" element={null} />
        <Route path="*" element={<Footer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;