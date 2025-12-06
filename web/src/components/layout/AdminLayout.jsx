// src/components/layout/AdminLayout.jsx
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import './AdminLayout.css';

const AdminLayout = () => {
  const { logout, role } = useAuth();
  const location = useLocation();

  // Double-check user is admin (extra security)
  if (role !== 'admin') {
    return null; // Or redirect to regular dashboard
  }

  const isActive = (path) => {
    return location.pathname.includes(path) ? 'active' : '';
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="admin-logo">
            <span className="admin-logo-text">LEARNIO</span>
            <span className="admin-badge">ADMIN</span>
          </div>
          <p className="admin-subtitle">Admin Panel</p>
        </div>
        
        <nav className="admin-nav">
          <Link 
            to="/admin/dashboard" 
            className={`nav-item ${isActive('/admin/dashboard') ? 'active' : ''}`}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </Link>
          
          <Link 
            to="/admin/courses" 
            className={`nav-item ${isActive('/admin/courses') ? 'active' : ''}`}
          >
            <span className="nav-icon">📚</span>
            <span className="nav-text">Courses</span>
          </Link>
          
          <Link 
            to="/admin/users" 
            className={`nav-item ${isActive('/admin/users') ? 'active' : ''}`}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-text">Users</span>
          </Link>
          
          <div className="nav-divider"></div>
          
          <Link 
            to="/" 
            className="nav-item"
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Back to Site</span>
          </Link>
          
          <button 
            onClick={logout}
            className="nav-item logout-btn"
          >
            <span className="nav-icon">🚪</span>
            <span className="nav-text">Logout</span>
          </button>
        </nav>
      </aside>
      
      <main className="admin-main">
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;