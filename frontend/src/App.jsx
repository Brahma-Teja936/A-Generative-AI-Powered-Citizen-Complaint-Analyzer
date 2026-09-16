import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import { AdminLayout } from './layouts/AdminLayout';
import { DepartmentLayout } from './layouts/DepartmentLayout';
import { ClientLayout } from './layouts/ClientLayout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Client Pages
import { ClientDashboard } from './pages/client/Dashboard';
import { NewComplaint } from './pages/client/NewComplaint';
import { MyComplaints } from './pages/client/MyComplaints';
import { CitizenComplaintDetail } from './pages/client/ComplaintDetail';
import { ClientNotifications } from './pages/client/Notifications';
import { ClientProfile } from './pages/client/Profile';

// Department Pages
import { DepartmentDashboard } from './pages/department/Dashboard';
import { DepartmentComplaints } from './pages/department/Complaints';
import { DepartmentComplaintDetail } from './pages/department/ComplaintDetail';
import { DepartmentNotifications } from './pages/department/Notifications';
import { DepartmentProfile } from './pages/department/Profile';

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminComplaints } from './pages/admin/Complaints';
import { AdminComplaintDetail } from './pages/admin/ComplaintDetail';
import { CriticalComplaints } from './pages/admin/Critical';
import { UrgentComplaints } from './pages/admin/Urgent';
import { EmergencyCommandCenter } from './pages/admin/Emergency';
import { AdminDepartments } from './pages/admin/Departments';
import { AdminManagement } from './pages/admin/Admins';
import { AdminUsers } from './pages/admin/Users';
import { AdminAnalytics } from './pages/admin/Analytics';
import { AdminAuditLogs } from './pages/admin/AuditLogs';
import { AdminProfile } from './pages/admin/Profile';

// Route Guards
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">Authenticating CivicAI session...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their respective authorized root
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'DEPARTMENT') return <Navigate to="/department/dashboard" replace />;
    return <Navigate to="/client/dashboard" replace />;
  }

  return children;
};

const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'DEPARTMENT') return <Navigate to="/department/dashboard" replace />;
  return <Navigate to="/client/dashboard" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/department/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Citizen Routes */}
          <Route
            path="/client"
            element={
              <ProtectedRoute allowedRoles={['CLIENT']}>
                <ClientLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="new-complaint" element={<NewComplaint />} />
            <Route path="complaints" element={<MyComplaints />} />
            <Route path="complaints/:id" element={<CitizenComplaintDetail />} />
            <Route path="notifications" element={<ClientNotifications />} />
            <Route path="profile" element={<ClientProfile />} />
          </Route>

          {/* Department Routes */}
          <Route
            path="/department"
            element={
              <ProtectedRoute allowedRoles={['DEPARTMENT']}>
                <DepartmentLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DepartmentDashboard />} />
            <Route path="complaints" element={<DepartmentComplaints />} />
            <Route path="complaints/:id" element={<DepartmentComplaintDetail />} />
            <Route path="notifications" element={<DepartmentNotifications />} />
            <Route path="profile" element={<DepartmentProfile />} />
          </Route>

          {/* Administrator Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="complaints" element={<AdminComplaints />} />
            <Route path="complaints/:id" element={<AdminComplaintDetail />} />
            <Route path="critical" element={<CriticalComplaints />} />
            <Route path="urgent" element={<UrgentComplaints />} />
            <Route path="emergency" element={<EmergencyCommandCenter />} />
            <Route path="emergency/:id" element={<EmergencyCommandCenter />} />
            <Route path="departments" element={<AdminDepartments />} />
            <Route path="admins" element={<AdminManagement />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>

          {/* Default Fallback */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
