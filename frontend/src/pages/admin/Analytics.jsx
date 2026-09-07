import React, { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  RefreshCw
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

export const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = () => {
    setLoading(true);
    adminAPI.getAnalytics()
      .then((res) => {
        if (res.data && res.data.success) {
          setData(res.data);
        }
      })
      .catch((err) => console.error("Failed to load analytics:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const byDept = data?.by_department || [];
  const byCategory = data?.by_category || [];
  const bySeverity = data?.by_severity || [];
  const byPriority = data?.by_priority || [];
  const byStatus = data?.by_status || [];

  const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#64748b"];

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Municipal Operational Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Aggregated metrics directly computed via MongoDB multi-stage aggregation pipelines
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Aggregations
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Resolution Rate</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-emerald-600">{summary.resolution_rate || 0}%</span>
            <span className="text-xs text-slate-500 font-medium">{summary.resolved || 0} resolved</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Resolution Time</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-indigo-600">{summary.avg_resolution_days || 0}</span>
            <span className="text-xs text-slate-500 font-medium">days / case</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Pending Backlog</span>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-amber-600">{summary.pending || 0}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Critical Public Hazards</span>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-rose-600">{summary.critical || 0}</span>
          </div>
        </div>
      </div>

      {/* Primary Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload by Department */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>Total vs. Resolved by Department</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDept} margin={{ top: 10, right: 10, left: -15, bottom: 40 }}>
                <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 10, fontSize: 11 }} />
                <Bar dataKey="total" fill="#4f46e5" name="Total Logged" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" fill="#10b981" name="Resolved" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Complaints by Category */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>Complaints by Category</span>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory} margin={{ top: 10, right: 10, left: -15, bottom: 40 }}>
                <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#06b6d4" name="Complaints" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Donut Distribution Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Severity */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase">Severity Distribution</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={bySeverity} dataKey="count" nameKey="name" innerRadius={40} outerRadius={65}>
                  {bySeverity.map((entry, idx) => (
                    <Cell key={`sev-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1 text-xs">
            {bySeverity.map((s, idx) => (
              <div key={s.name} className="flex justify-between text-slate-600">
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  {s.name}
                </span>
                <span className="font-semibold">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase">Priority Distribution</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byPriority} dataKey="count" nameKey="name" innerRadius={40} outerRadius={65}>
                  {byPriority.map((entry, idx) => (
                    <Cell key={`pri-${idx}`} fill={COLORS[(idx + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1 text-xs">
            {byPriority.map((p, idx) => (
              <div key={p.name} className="flex justify-between text-slate-600">
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: COLORS[(idx + 2) % COLORS.length] }} />
                  {p.name}
                </span>
                <span className="font-semibold">{p.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase">Current Workflow Status</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStatus} dataKey="count" nameKey="name" innerRadius={40} outerRadius={65}>
                  {byStatus.map((entry, idx) => (
                    <Cell key={`st-${idx}`} fill={COLORS[(idx + 4) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1 text-xs">
            {byStatus.map((st, idx) => (
              <div key={st.name} className="flex justify-between text-slate-600">
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: COLORS[(idx + 4) % COLORS.length] }} />
                  {st.name}
                </span>
                <span className="font-semibold">{st.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
