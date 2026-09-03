import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FileText, LayoutDashboard, History, User, LogOut, LogIn, ShieldAlert, Sparkles } from "lucide-react";

export const Navbar = () => {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="civic-navbar">
      <div className="navbar-container">
        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <div className="brand-logo-badge">
            <Sparkles size={20} color="#2563eb" />
          </div>
          <div>
            <div className="brand-title">
              Civic<span style={{ color: "#2563eb" }}>AI</span>
            </div>
            <div className="brand-subtitle">Civic Complaint Analyzer</div>
          </div>
        </Link>

        {/* Links */}
        <nav className="navbar-nav">
          <NavLink
            to="/submit"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            <FileText size={17} />
            <span>Submit Complaint</span>
          </NavLink>

          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            <LayoutDashboard size={17} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/history"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            <History size={17} />
            <span>History</span>
          </NavLink>

          {isAuthenticated && (
            <NavLink
              to="/profile"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              <User size={17} />
              <span>Profile</span>
            </NavLink>
          )}

          {isAdmin && (
            <NavLink
              to="/admin/dashboard"
              className="admin-portal-link"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "8px",
                backgroundColor: "#fef3c7",
                color: "#92400e",
                fontWeight: "700",
                fontSize: "0.85rem",
                textDecoration: "none",
                border: "1px solid #fde68a"
              }}
            >
              <ShieldAlert size={16} />
              <span>Admin Portal</span>
            </NavLink>
          )}
        </nav>

        {/* Right Auth controls */}
        <div className="navbar-actions">
          {isAuthenticated ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="user-greeting">
                <span className="user-name">{user?.name || "Citizen"}</span>
                <span className="user-role-badge">{user?.role}</span>
              </div>
              <button onClick={handleLogout} className="btn-logout" title="Sign Out">
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "8px" }}>
              <Link to="/login" className="btn-signin">
                <LogIn size={15} />
                <span>Sign In</span>
              </Link>
              <Link to="/register" className="btn-signup">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
