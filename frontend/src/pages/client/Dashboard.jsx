import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { clientAPI } from "../../services/api";
import { StatusBadge, PriorityBadge } from "../../components/Badges";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  ArrowRight,
  Bell,
  MapPin,
  Calendar,
  Sparkles
} from "lucide-react";

export const CitizenDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientAPI.getDashboard()
      .then((res) => {
        if (res.data && res.data.success) {
          setData(res.data);
        }
      })
      .catch((err) => console.error("Failed to load dashboard:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const stats = data?.stats || { total: 0, pending: 0, in_progress: 0, resolved: 0 };
  const recent = data?.recent_complaints || [];
  const notifs = data?.notifications || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold backdrop-blur-md border border-indigo-400/20">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI-Driven Municipal Dispatch Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, {user?.name?.split(" ")[0] || "Citizen"}!
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Submit civic complaints naturally. Our TF-IDF and XGBoost AI models instantly analyze, triage, and route issues to municipal departments.
          </p>

          <div className="pt-3 flex flex-wrap gap-3">
            <Link
              to="/client/complaints/new"
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-md shadow-emerald-900/30 transition-all hover:scale-102"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Submit New Complaint
            </Link>
            <Link
              to="/client/complaints"
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold backdrop-blur-md border border-white/20 transition-all"
            >
              <FileText className="w-4 h-4 mr-2" />
              View My Complaints
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Complaints</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">{stats.total}</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Review</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-amber-600">{stats.pending}</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">In Progress</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-blue-600">{stats.in_progress}</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resolved</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-emerald-600">{stats.resolved}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Complaints + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Complaints (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Recent Complaints</h2>
            <Link to="/client/complaints" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 flex items-center">
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No complaints submitted yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Have an issue in your locality like a pothole, broken streetlight, or drainage overflow? Report it in seconds.
              </p>
              <Link
                to="/client/complaints/new"
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Submit Your First Complaint
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((comp) => {
                const dateStr = comp.created_at ? new Date(comp.created_at).toLocaleDateString() : "";
                const ai = comp.ai_analysis || {};

                return (
                  <Link
                    key={comp.id}
                    to={`/client/complaints/${comp.complaint_id || comp.id}`}
                    className="block glass-panel p-4 sm:p-5 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {comp.complaint_id}
                        </span>
                        <StatusBadge status={comp.status} />
                        <PriorityBadge priority={ai.priority} />
                      </div>
                      <div className="text-xs text-slate-400 flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        {dateStr}
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {comp.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {comp.description}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center truncate">
                        <MapPin className="w-3.5 h-3.5 mr-1 shrink-0 text-slate-400" />
                        <span className="truncate">{comp.location || "Location not specified"}</span>
                      </div>
                      <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center">
                        Track Progress <ArrowRight className="w-3 h-3 ml-1" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications & Latest Updates (1 Col) */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <Bell className="w-4 h-4 mr-2 text-indigo-600" /> Notifications
            </h2>
            <Link to="/client/notifications" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">
              View All
            </Link>
          </div>

          <div className="glass-panel p-4 rounded-2xl space-y-3 divide-y divide-slate-100">
            {notifs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No recent notifications</p>
            ) : (
              notifs.map((notif) => {
                const dateStr = notif.created_at ? new Date(notif.created_at).toLocaleDateString() : "";
                return (
                  <div key={notif.id} className="pt-3 first:pt-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-bold text-slate-900">{notif.title}</p>
                      <span className="text-[10px] text-slate-400">{dateStr}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                    {notif.complaint_id && (
                      <Link
                        to={`/client/complaints/${notif.complaint_id}`}
                        className="inline-block mt-1 text-[11px] font-semibold text-indigo-600 hover:underline"
                      >
                        View {notif.complaint_id} &rarr;
                      </Link>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
