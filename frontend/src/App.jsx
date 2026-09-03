import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";
import { Navbar } from "./components/Navbar";
import { AdminNavbar } from "./components/AdminNavbar";

// Citizen Pages
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { CitizenDashboard } from "./pages/CitizenDashboard";
import { SubmitComplaint } from "./pages/SubmitComplaint";
import { ComplaintHistory } from "./pages/ComplaintHistory";
import { ComplaintDetails } from "./pages/ComplaintDetails";
import { Profile } from "./pages/Profile";

// Admin Pages
import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminComplaints } from "./pages/AdminComplaints";
import { AdminComplaintDetail } from "./pages/AdminComplaintDetail";
import { AdminAnalytics } from "./pages/AdminAnalytics";
import { AdminEmailLogs } from "./pages/AdminEmailLogs";
import { AdminDepartments } from "./pages/AdminDepartments";

import "./App.css";

// Layout wrapper to toggle Citizen Navbar vs Admin Navbar
const Layout = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin") && !location.pathname.startsWith("/admin/login");

  return (
    <div className="app-layout">
      {isAdminRoute ? <AdminNavbar /> : !location.pathname.includes("/login") && !location.pathname.includes("/register") && <Navbar />}
      <main className="main-viewport">{children}</main>
      <footer style={{ borderTop: "1px solid #e2e8f0", backgroundColor: "#ffffff", padding: "1.5rem 0", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
        <p style={{ margin: "0 0 4px" }}>
          © 2026 CivicAI — Intelligent Automated Civic Complaint Management & Field Dispatch
        </p>
        <p style={{ margin: 0, fontSize: "0.78rem" }}>
          Trained on real civic municipal records • End-to-end TF-IDF + XGBoost classification
        </p>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            {/* Public Authentication */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Citizen Routes */}
            <Route path="/" element={<CitizenDashboard />} />
            <Route path="/dashboard" element={<CitizenDashboard />} />
            <Route path="/submit" element={<SubmitComplaint />} />
            <Route path="/history" element={<ComplaintHistory />} />
            <Route path="/complaints/:id" element={<ComplaintDetails />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Admin Protected Routes */}
            <Route
              path="/admin"
              element={<Navigate to="/admin/dashboard" replace />}
            />
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/complaints"
              element={
                <AdminRoute>
                  <AdminComplaints />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/complaints/:id"
              element={
                <AdminRoute>
                  <AdminComplaintDetail />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <AdminRoute>
                  <AdminAnalytics />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/email-logs"
              element={
                <AdminRoute>
                  <AdminEmailLogs />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/departments"
              element={
                <AdminRoute>
                  <AdminDepartments />
                </AdminRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}