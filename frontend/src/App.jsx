import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ClientRoute, AdminRoute } from "./components/ProtectedRoute";
import { Navbar } from "./components/Navbar";
import { AdminNavbar } from "./components/AdminNavbar";

// Client Pages
import { Login } from "./pages/client/Login";
import { Register } from "./pages/client/Register";
import { CitizenDashboard } from "./pages/client/Dashboard";
import { CitizenComplaints } from "./pages/client/Complaints";
import { NewComplaint } from "./pages/client/NewComplaint";
import { CitizenComplaintDetail } from "./pages/client/ComplaintDetail";
import { CitizenNotifications } from "./pages/client/Notifications";
import { CitizenProfile } from "./pages/client/Profile";

// Admin Pages
import { AdminLogin } from "./pages/admin/Login";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminComplaints } from "./pages/admin/Complaints";
import { AdminComplaintDetail } from "./pages/admin/ComplaintDetail";
import { CriticalComplaints } from "./pages/admin/CriticalComplaints";
import { UrgentComplaints } from "./pages/admin/UrgentComplaints";
import { AdminDepartments } from "./pages/admin/Departments";
import { AdminAnalytics } from "./pages/admin/Analytics";
import { AdminEmailHistory } from "./pages/admin/EmailHistory";
import { AdminNotifications } from "./pages/admin/Notifications";
import { AdminAuditLogs } from "./pages/admin/AuditLogs";

const Layout = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin") && location.pathname !== "/admin/login";
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/admin/login";

  if (isAuthPage) {
    return <main className="min-h-screen bg-slate-50">{children}</main>;
  }

  if (isAdminRoute) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <AdminNavbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 pb-16">{children}</main>
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700 mb-1">
          CivicAI — Production-Ready AI-Powered Civic Complaint Management System
        </p>
        <p className="text-[11px] text-slate-400">
          Powered by React, Vite, Tailwind CSS, Python Flask, MongoDB, and XGBoost Machine Learning
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

            {/* Root Navigation */}
            <Route path="/" element={<Navigate to="/client/dashboard" replace />} />
            <Route path="/dashboard" element={<Navigate to="/client/dashboard" replace />} />

            {/* Client Portal (Protected: role = client) */}
            <Route
              path="/client/dashboard"
              element={
                <ClientRoute>
                  <CitizenDashboard />
                </ClientRoute>
              }
            />
            <Route
              path="/client/complaints"
              element={
                <ClientRoute>
                  <CitizenComplaints />
                </ClientRoute>
              }
            />
            <Route
              path="/client/complaints/new"
              element={
                <ClientRoute>
                  <NewComplaint />
                </ClientRoute>
              }
            />
            <Route
              path="/client/complaints/:id"
              element={
                <ClientRoute>
                  <CitizenComplaintDetail />
                </ClientRoute>
              }
            />
            <Route
              path="/client/notifications"
              element={
                <ClientRoute>
                  <CitizenNotifications />
                </ClientRoute>
              }
            />
            <Route
              path="/client/profile"
              element={
                <ClientRoute>
                  <CitizenProfile />
                </ClientRoute>
              }
            />

            {/* Admin Portal (Protected: role = admin) */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
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
              path="/admin/critical"
              element={
                <AdminRoute>
                  <CriticalComplaints />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/urgent"
              element={
                <AdminRoute>
                  <UrgentComplaints />
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
            <Route
              path="/admin/analytics"
              element={
                <AdminRoute>
                  <AdminAnalytics />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/email-history"
              element={
                <AdminRoute>
                  <AdminEmailHistory />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <AdminRoute>
                  <AdminNotifications />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <AdminRoute>
                  <AdminAuditLogs />
                </AdminRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/client/dashboard" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}