import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminAPI } from "../../services/api";
import { StatusBadge, PriorityBadge, SeverityBadge } from "../../components/Badges";
import {
  FileText,
  Clock,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Users,
  Calendar,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Flame
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
  LineChart,
  Line
} from "recharts";

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard()
      .then((res) => {
        if (res.data && res.data.success) {
          setData(res.data);
        }
      })
      .catch((err) => console.error("Failed to load admin dashboard:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const charts = data?.charts || {};
  const recent = data?.recent_complaints || [];

  const SEV_COLORS = {
    CRITICAL: "#ef4444",
    HIGH: "#f97316",
    MEDIUM: "#f59e0b",
    LOW: "#10b981"
  };

  const PRI_COLORS = {
    URGENT: "#f43f5e",
    HIGH: "#f97316",
    MEDIUM: "#3b82f6",
    LOW: "#64748b"
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Administrative Command Dashboard
            </h1>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
              Live DB
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time municipal complaints triage, AI classification metrics, and department routing
          </p>
        </div>

        <div className="flex space-x-3">
          <Link
            to="/admin/complaints"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            Manage Complaints
          </Link>
        </div>
      </div>

      {/* OVERDUE ALERT BANNER (If overdue > 0) */}
      {metrics.overdue > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                {metrics.overdue} Civic Complaints Exceeded Target Response Window
              </p>
              <p className="text-xs text-amber-700">
                Immediate department escalation required for overdue citizen reports.
              </p>
            </div>
          </div>
          <Link
            to="/admin/urgent"
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-colors"
          >
            Review Overdue &rarr;
          </Link>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Complaints</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{metrics.total_complaints || 0}</span>
            <span className="text-[11px] font-semibold text-emerald-600">
              {metrics.resolution_rate || 0}% resolved
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Action</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-amber-600">{metrics.pending || 0}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Critical Severity</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-rose-600">{metrics.critical || 0}</span>
            <Link to="/admin/critical" className="text-[10px] font-bold text-rose-600 hover:underline">
              View &rarr;
            </Link>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Urgent Priority</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-orange-600">{metrics.high_priority || 0}</span>
            <Link to="/admin/urgent" className="text-[10px] font-bold text-orange-600 hover:underline">
              View &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Complaints by Department */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>Workload by Department</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.by_department || []} margin={{ top: 10, right: 10, left: -20, bottom: 30 }}>
                <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Complaints Volume Trend (7 Days) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>Complaints Activity (Past 7 Days)</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.by_time || []} margin={{ top: 10, right: 20, left: -20, bottom: 10 }}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Severity & Priority Donut Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Severity Distribution</h3>
          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.by_severity || []}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {(charts.by_severity || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SEV_COLORS[entry.name] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center flex-wrap gap-4 text-xs">
            {(charts.by_severity || []).map((s) => (
              <div key={s.name} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SEV_COLORS[s.name] || "#94a3b8" }} />
                <span className="font-semibold text-slate-700">{s.name}: {s.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Priority Breakdown</h3>
          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.by_priority || []}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {(charts.by_priority || []).map((entry, index) => (
                    <Cell key={`cell-p-${index}`} fill={PRI_COLORS[entry.name] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center flex-wrap gap-4 text-xs">
            {(charts.by_priority || []).map((p) => (
              <div key={p.name} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PRI_COLORS[p.name] || "#94a3b8" }} />
                <span className="font-semibold text-slate-700">{p.name}: {p.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Incoming Complaints Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-900">Recent Complaints Queue</h3>
          <Link to="/admin/complaints" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 flex items-center">
            View All Complaints <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">Complaint ID</th>
                <th className="py-3 px-3">Citizen</th>
                <th className="py-3 px-3">Title</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent.map((comp) => {
                const ai = comp.ai_analysis || {};
                const adminDec = comp.admin_decision || {};
                const assigned = comp.assignment || {};
                const dept = assigned.department_name || adminDec.department || ai.department;
                const sev = adminDec.severity || ai.severity;
                const pri = adminDec.priority || ai.priority;

                return (
                  <tr key={comp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-700">{comp.complaint_id}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">{comp.citizen_name}</td>
                    <td className="py-3 px-3 font-medium text-slate-700 max-w-[200px] truncate">{comp.title}</td>
                    <td className="py-3 px-3 text-slate-600">{dept}</td>
                    <td className="py-3 px-3"><SeverityBadge severity={sev} /></td>
                    <td className="py-3 px-3"><PriorityBadge priority={pri} /></td>
                    <td className="py-3 px-3"><StatusBadge status={comp.status} /></td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/admin/complaints/${comp.complaint_id}`}
                        className="inline-flex items-center px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg transition-colors"
                      >
                        Review &rarr;
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
