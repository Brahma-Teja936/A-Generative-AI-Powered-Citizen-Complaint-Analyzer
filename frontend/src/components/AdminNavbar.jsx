import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminAPI } from "../services/api";
import {
  LayoutDashboard,
  FileSpreadsheet,
  AlertOctagon,
  Clock,
  Building2,
  BarChart3,
  Mail,
  Bell,
  ScrollText,
  LogOut,
  ShieldAlert,
  ChevronRight
} from "lucide-react";

export const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    adminAPI.getNotifications()
      .then((res) => {
        if (res.data) {
          setUnreadNotifs(res.data.unread_count || 0);
        }
      })
      .catch(() => {});
  }, [location.pathname]);

  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Complaints", path: "/admin/complaints", icon: FileSpreadsheet },
    { name: "Critical Complaints", path: "/admin/critical", icon: AlertOctagon, highlight: "text-rose-600" },
    { name: "Urgent Complaints", path: "/admin/urgent", icon: Clock, highlight: "text-amber-600" },
    { name: "Departments", path: "/admin/departments", icon: Building2 },
    { name: "Analytics", path: "/admin/analytics", icon: BarChart3 },
    { name: "Email History", path: "/admin/email-history", icon: Mail },
    { 
      name: "Notifications", 
      path: "/admin/notifications", 
      icon: Bell,
      badge: unreadNotifs > 0 ? unreadNotifs : null 
    },
    { name: "Audit Logs", path: "/admin/audit-logs", icon: ScrollText }
  ];

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 min-h-screen flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/40">
        <Link to="/admin/dashboard" className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-white flex items-center">
              Civic<span className="text-rose-400">AI</span>
              <span className="ml-2 text-[10px] bg-rose-500/20 text-rose-300 font-semibold px-1.5 py-0.5 rounded border border-rose-500/30">
                ADMIN
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Dispatch & Control System</p>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Management
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== "/admin/dashboard" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? "bg-indigo-600/20 text-white border border-indigo-500/30 font-semibold shadow-xs"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${item.highlight || (isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200")}`} />
                <span>{item.name}</span>
              </div>
              {item.badge ? (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                  {item.badge}
                </span>
              ) : isActive ? (
                <ChevronRight className="w-3.5 h-3.5 text-indigo-400 opacity-60" />
              ) : null}
            </Link>
          );
        })}
      </div>

      {/* Footer / User Profile */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/30">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-800">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || "Administrator"}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
