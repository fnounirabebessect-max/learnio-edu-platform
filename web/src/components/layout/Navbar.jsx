import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import CartButton from "../CartButton";
import logo from "../../assets/logo.png";
import "./Navbar.css";

const Navbar = () => {
  const { currentUser, logout, role } = useAuth(); // Added role
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Check if user is admin
  const isAdmin = role === 'admin';

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-logo">
          <img src={logo} alt="LEARNIO" />
          <span className="logo-text">LEARNIO</span>
        </Link>
      </div>

      {/* DESKTOP LINKS */}
      <div className="navbar-links">
        <Link to="/" className="nav-link">HOME</Link>
        <Link to="/courses" className="nav-link">COURSES</Link>
        
        {/* Show different links based on user role */}
        {currentUser && !isAdmin && <Link to="/dashboard" className="nav-link">DASHBOARD</Link>}
        {currentUser && isAdmin && <Link to="/admin/dashboard" className="nav-link">ADMIN</Link>}
      </div>

      {/* RIGHT SIDE: LOGIN OR PROFILE */}
      <div className="navbar-right">
        {/* CART BUTTON - Always visible if there are items */}
        {!isAdmin && <CartButton />}
        
        {!currentUser ? (
          <>
            <Link to="/login" className="btn login-btn">LOGIN</Link>
            <Link to="/signup" className="btn signup-btn">SIGN UP</Link>
          </>
        ) : (
          <>
            {/* Regular users see PROFILE, Admins don't need it in navbar */}
            {!isAdmin && <Link to="/profile" className="btn profile-btn">PROFILE</Link>}
            <button className="btn logout-btn" onClick={handleLogout}>LOGOUT</button>
          </>
        )}

        {/* MOBILE MENU BUTTON */}
        <div
          className="burger"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span><span></span><span></span>
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>HOME</Link>
          <Link to="/courses" className="nav-link" onClick={() => setMenuOpen(false)}>COURSES</Link>
          
          {/* Show different links based on user role in mobile */}
          {!isAdmin && <Link to="/cart" className="nav-link" onClick={() => setMenuOpen(false)}>🛒 CART</Link>}
          
          {currentUser && !isAdmin && (
            <Link to="/dashboard" className="nav-link" onClick={() => setMenuOpen(false)}>DASHBOARD</Link>
          )}
          {currentUser && isAdmin && (
            <Link to="/admin/dashboard" className="nav-link" onClick={() => setMenuOpen(false)}>ADMIN</Link>
          )}

          {!currentUser ? (
            <>
              <Link to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>LOGIN</Link>
              <Link to="/signup" className="nav-link" onClick={() => setMenuOpen(false)}>SIGN UP</Link>
            </>
          ) : (
            <>
              {!isAdmin && <Link to="/profile" className="nav-link" onClick={() => setMenuOpen(false)}>PROFILE</Link>}
              <button onClick={handleLogout} className="logout-btn nav-link">LOGOUT</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;