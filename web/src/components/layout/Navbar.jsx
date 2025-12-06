import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import logo from "../../assets/logo.png";
import "./Navbar.css";

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

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
        {currentUser && <Link to="/dashboard" className="nav-link">DASHBOARD</Link>}
      </div>

      {/* RIGHT SIDE: LOGIN OR PROFILE */}
      <div className="navbar-right">
        {!currentUser ? (
          <>
            <Link to="/login" className="btn login-btn">LOGIN</Link>
            <Link to="/signup" className="btn signup-btn">SIGN UP</Link>
          </>
        ) : (
          <>
            <Link to="/profile" className="btn profile-btn">PROFILE</Link>
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
          {currentUser && <Link to="/dashboard" className="nav-link" onClick={() => setMenuOpen(false)}>DASHBOARD</Link>}

          {!currentUser ? (
            <>
              <Link to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>LOGIN</Link>
              <Link to="/signup" className="nav-link" onClick={() => setMenuOpen(false)}>SIGN UP</Link>
            </>
          ) : (
            <>
              <Link to="/profile" className="nav-link" onClick={() => setMenuOpen(false)}>PROFILE</Link>
              <button onClick={handleLogout} className="logout-btn nav-link">LOGOUT</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;