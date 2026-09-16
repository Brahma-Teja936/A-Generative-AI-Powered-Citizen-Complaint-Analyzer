import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  LayoutDashboard, AlertOctagon, Flame, ShieldAlert, Building2, 
  Users2, UserCheck, BarChart3, History, Settings, LogOut, Menu, X, Bell 
} from 'lucide-react';

export const AdminLayout = () => {
  const { user, logout, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [criticalCount, setCriticalCount] = useState(0);

  useEffect(() => {
    // Fetch live critical count
    const fetchCounters = async () => {
      try {
        const res = await api.get('/admin/complaints/critical?page_size=1');
        setCriticalCount(res.data.total || 0);
      } catch (e) {}
    };
    fetchCounters();
    const interval = setInterval(fetchCounters, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Complaints', path: '/admin/complaints', icon: Users2 },
    { label: 'Critical Incidents', path: '/admin/critical', icon: AlertOctagon, badge: criticalCount > 0 ? criticalCount : null, badgeColor: 'bg-rose-600' },
    { label: 'Urgent Cases', path: '/admin/urgent', icon: Flame },
    { label: 'Emergency Center', path: '/admin/emergency', icon: ShieldAlert, highlight: true },
    { label: 'Departments', path: '/admin/departments', icon: Building2 },
    ...(role === 'SUPER_ADMIN' ? [{ label: 'Administrators', path: '/admin/admins', icon: UserCheck }] : []),
    { label: 'Registered Citizens', path: '/admin/users', icon: Users2 },
    { label: 'System Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: History },
    { label: 'Profile & Settings', path: '/admin/profile', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row text-slate-100">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-6 h-6 text-rose-500" />
          <span className="font-bold text-lg tracking-tight">CivicAI Admin</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded-lg text-slate-400 hover:text-white">
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col transition-transform duration-300 md:static md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-civic-600 to-rose-600 flex items-center justify-center shadow-lg shadow-civic-950/50">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white">CIVIC<span className="text-civic-400">AI</span></h1>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-civic-950 text-civic-400 border border-civic-800">
                {role || 'ADMIN'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  item.highlight && !active
                    ? 'text-rose-400 hover:bg-rose-950/40 hover:text-rose-300'
                    : active
                    ? 'bg-civic-600 text-white shadow-lg shadow-civic-900/40 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${item.highlight && !active ? 'text-rose-500 animate-pulse' : ''}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${item.badgeColor || 'bg-slate-800'} animate-pulse`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="truncate mr-2">
              <div className="text-xs font-semibold text-white truncate">{user?.name || 'Admin'}</div>
              <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {criticalCount > 0 && (
          <div className="bg-rose-900/60 border-b border-rose-800 px-4 py-2 text-xs text-rose-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="animate-ping w-2 h-2 rounded-full bg-rose-400" />
              <span className="font-bold">CRITICAL INCIDENT ALERT:</span>
              <span>{criticalCount} active critical or emergency civic complaint(s) require review.</span>
            </div>
            <Link to="/admin/emergency" className="font-bold underline text-white hover:text-rose-200 ml-4">
              Open Command Center &rarr;
            </Link>
          </div>
        )}

        <div className="p-6 md:p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
