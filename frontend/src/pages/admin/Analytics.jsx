import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { BarChart3, TrendingUp, MapPin, Building2, ShieldAlert } from 'lucide-react';

const COLORS = ['#0c8fe9', '#a855f7', '#f59e0b', '#ef4444', '#10b981', '#6366f1', '#ec4899', '#14b8a6'];

export const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/admin/analytics');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="text-center py-24 text-slate-400 text-xs">Aggregating live civic telemetry...</div>;
  }

  const breakdowns = data?.breakdowns || {};
  const summary = data?.summary || {};

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold text-white">System Analytics & City Trends</h2>
        <p className="text-xs text-slate-400 mt-1">
          Real-time MongoDB aggregation metrics strictly derived from verified live complaints
        </p>
      </div>

      {/* Top Telemetry */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Total Live Complaints</div>
          <div className="text-3xl font-extrabold text-white font-mono">{summary.total || 0}</div>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">System Resolution Rate</div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono">{summary.resolution_rate || 0}%</div>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Critical Incidents</div>
          <div className="text-3xl font-extrabold text-rose-500 font-mono">{summary.critical || 0}</div>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">High Priority Queue</div>
          <div className="text-3xl font-extrabold text-orange-400 font-mono">{summary.high_priority || 0}</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4">Complaints by Category</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdowns.by_category || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Bar dataKey="value" fill="#a855f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4">Priority Breakdown</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdowns.by_priority || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label
                >
                  {(breakdowns.by_priority || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Urgency Breakdown */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4">Urgency Service-Level-Agreement (SLA) Targets</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdowns.by_urgency || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Location Hotspots Table */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-rose-400" />
            <span>Top Incident Localities & Hotspots</span>
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {(breakdowns.location_hotspots || []).map((h, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[10px] text-slate-400">
                    {i + 1}
                  </span>
                  <span className="font-semibold text-white">{h.area}</span>
                  <span className="text-[10px] text-slate-500">({h.city})</span>
                </div>
                <div className="font-mono font-bold text-civic-400 text-sm">
                  {h.complaints} complaints
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
