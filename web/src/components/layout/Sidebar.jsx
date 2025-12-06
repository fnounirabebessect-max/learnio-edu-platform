import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={collapsed ? "sidebar collapsed" : "sidebar"}>
      {/* COLLAPSE BUTTON */}
      <button
        className="collapse-btn"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? "☰" : "✕"}
      </button>

      {/* MENU */}
      <nav className="sidebar-menu">
        <NavLink to="/dashboard" className="menu-link">
          <span className="icon">🏠</span>
          {!collapsed && <span>Dashboard</span>}
        </NavLink>

        <NavLink to="/courses" className="menu-link">
          <span className="icon">📚</span>
          {!collapsed && <span>My Courses</span>}
        </NavLink>

        <NavLink to="/profile" className="menu-link">
          <span className="icon">👤</span>
          {!collapsed && <span>Profile</span>}
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
