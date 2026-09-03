import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ShieldAlert,
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Mail,
  Building2,
  ExternalLink,
  LogOut
} from "lucide-react";

export const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <header className="admin-navbar">
      <div className="admin-navbar-container">
        {/* Brand */}
        <Link to="/admin/dashboard" className="admin-brand">
          <div className="admin-brand-icon">
            <ShieldAlert size={20} color="#ffffff" />
          </div>
          <div>
            <div className="admin-brand-title">CivicAI Admin</div>
            <div className="admin-brand-subtitle">Municipal Control Panel</div>
          </div>
        </Link>

        {/* Admin Navigation */}
        <nav className="admin-nav-links">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => (isActive ? "admin-nav-item active" : "admin-nav-item")}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin/complaints"
            className={({ isActive }) => (isActive ? "admin-nav-item active" : "admin-nav-item")}
          >
            <ClipboardList size={16} />
            <span>Complaints</span>
          </NavLink>

          <NavLink
            to="/admin/analytics"
            className={({ isActive }) => (isActive ? "admin-nav-item active" : "admin-nav-item")}
          >
            <BarChart3 size={16} />
            <span>Analytics</span>
          </NavLink>

          <NavLink
            to="/admin/email-logs"
            className={({ isActive }) => (isActive ? "admin-nav-item active" : "admin-nav-item")}
          >
            <Mail size={16} />
            <span>Email Logs</span>
          </NavLink>

          <NavLink
            to="/admin/departments"
            className={({ isActive }) => (isActive ? "admin-nav-item active" : "admin-nav-item")}
          >
            <Building2 size={16} />
            <span>Departments</span>
          </NavLink>
        </nav>

        {/* Actions */}
        <div className="admin-actions">
          <Link to="/submit" className="btn-citizen-switch" title="Go to citizen view">
            <span>Citizen View</span>
            <ExternalLink size={14} />
          </Link>

          <div className="admin-user-pill">
            <span className="admin-name">{user?.name || "Admin"}</span>
            <button onClick={handleLogout} className="btn-admin-logout" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
