// src/router/AppRouter.jsx - COMPLETE VERSION
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import ForgotPassword from "../pages/ForgotPassword";
import ProtectedRoute from "../components/protectedRoute";

// Other imports...
import Home from "../pages/Home";
import Courses from "../pages/course/Courses";
import CourseDetail from "../pages/course/CourseDetail";
import Profile from "../pages/user/Profile";
import Cart from "../pages/cart/Cart";
import Checkout from "../pages/checkout/Checkout"; // NEW: Added checkout page
import PaymentSuccess from "../pages/payment/PaymentSuccess";
import PaymentFailure from "../pages/payment/PaymentFailure";
import PaymentCancel from "../pages/payment/PaymentCancel";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

// Admin imports
import AdminLayout from "../components/layout/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminCourses from "../pages/admin/AdminCourses";
import AdminUsers from "../pages/admin/AdminUsers";

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
      {/* Conditionally render Navbar - NOT for admin routes */}
      <Routes>
        <Route path="/admin/*" element={null} />
        <Route path="*" element={<Navbar />} />
      </Routes>
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          
          <Route 
            path="/signup" 
            element={currentUser ? <Navigate to="/dashboard" replace /> : <Register />} 
          />
          <Route 
            path="/login" 
            element={currentUser ? <Navigate to="/dashboard" replace /> : <Login />} 
          />
          
          <Route 
            path="/register" 
            element={<Navigate to="/signup" replace />} 
          />
          
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Public Courses pages */}
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />

          {/* Cart Page - Public but cart requires login for checkout */}
          <Route path="/cart" element={<Cart />} />

          {/* Checkout Page - Protected */}
          <Route 
            path="/checkout" 
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            } 
          />

          {/* Payment Pages - These handle payment callbacks */}
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failure" element={<PaymentFailure />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />

          {/* Protected routes for regular users */}
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

          {/* ADMIN ROUTES - Completely separate layout */}
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

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      
      {/* Conditionally render Footer - NOT for admin routes */}
      <Routes>
        <Route path="/admin/*" element={null} />
        <Route path="*" element={<Footer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;