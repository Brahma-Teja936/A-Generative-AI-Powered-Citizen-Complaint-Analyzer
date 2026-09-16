import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  LayoutDashboard, Users2, ShieldAlert, AlertOctagon, 
  CheckCircle2, Clock, Building2, Flame, ArrowRight 
} from 'lucide-react';

const COLORS = ['#0c8fe9', '#a855f7', '#f59e0b', '#ef4444', '#10b981', '#6366f1', '#ec4899'];
const SEV_COLORS = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444' };

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-slate-400 text-xs">Loading admin intelligence dashboard...</div>;
  }

  const summary = data?.summary || {};
  const breakdowns = data?.breakdowns || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Civic Intelligence Command Dashboard</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time complaint telemetry, AI classification health, and emergency coordination
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/admin/emergency"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xl shadow-rose-950/50 animate-pulse border border-red-500/50"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Emergency Command Center</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Total Live</div>
          <div className="text-2xl font-extrabold text-white font-mono">{summary.total || 0}</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Pending</div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">{summary.pending || 0}</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Under Review</div>
          <div className="text-2xl font-extrabold text-blue-400 font-mono">{summary.under_review || 0}</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Assigned</div>
          <div className="text-2xl font-extrabold text-indigo-400 font-mono">{summary.assigned || 0}</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">In Progress</div>
          <div className="text-2xl font-extrabold text-purple-400 font-mono">{summary.in_progress || 0}</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">High Priority</div>
          <div className="text-2xl font-extrabold text-orange-400 font-mono">{summary.high_priority || 0}</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Critical</div>
          <div className="text-2xl font-extrabold text-rose-500 font-mono animate-pulse">{summary.critical || 0}</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Resolution</div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">{summary.resolution_rate || 0}%</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
            <span>Complaints by Department</span>
            <Building2 className="w-4 h-4 text-civic-400" />
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdowns.by_department || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="value" fill="#0c8fe9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
            <span>Severity Distribution</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdowns.by_severity || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(breakdowns.by_severity || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SEV_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Department Workload & Hotspot Table */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-4">Department Performance & Resolution Rates</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-slate-800">
              <tr>
                <th className="pb-3 font-semibold">Department</th>
                <th className="pb-3 font-semibold">Total Assigned</th>
                <th className="pb-3 font-semibold">Active Workload</th>
                <th className="pb-3 font-semibold">Resolved</th>
                <th className="pb-3 font-semibold">Resolution Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(breakdowns.department_performance || []).map((d) => (
                <tr key={d.department} className="hover:bg-slate-900/40">
                  <td className="py-3 font-semibold text-white">{d.department}</td>
                  <td className="py-3 font-mono">{d.total}</td>
                  <td className="py-3 font-mono text-amber-400">{d.active}</td>
                  <td className="py-3 font-mono text-emerald-400">{d.resolved}</td>
                  <td className="py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-civic-500 h-1.5 rounded-full" style={{ width: `${d.resolution_pct}%` }} />
                      </div>
                      <span className="font-mono text-[11px] text-slate-300">{d.resolution_pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
