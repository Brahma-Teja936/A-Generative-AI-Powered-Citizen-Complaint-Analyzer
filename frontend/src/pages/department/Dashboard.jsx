import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge, SeverityBadge, UrgencyBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  Building2, ClipboardList, CheckCircle2, Clock, 
  AlertTriangle, PauseCircle, ArrowRight 
} from 'lucide-react';

export const DepartmentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/department/dashboard');
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
    return <div className="text-center py-20 text-slate-400 text-xs">Loading department workspace...</div>;
  }

  const stats = data?.stats || {};
  const recent = data?.recent_complaints || [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold text-white">Department Operations Console</h2>
        <p className="text-xs text-slate-400 mt-1">
          Review newly assigned civic complaints, schedule crew dispatches, update work progress, and resolve issues
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">New Assigned</div>
          <div className="text-2xl font-extrabold text-indigo-400 font-mono">{stats.assigned || 0}</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Accepted</div>
          <div className="text-2xl font-extrabold text-cyan-400 font-mono">{stats.accepted || 0}</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">In Progress</div>
          <div className="text-2xl font-extrabold text-purple-400 font-mono">{stats.in_progress || 0}</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">On Hold</div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">{stats.on_hold || 0}</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Critical</div>
          <div className="text-2xl font-extrabold text-rose-500 font-mono animate-pulse">{stats.critical || 0}</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Resolved</div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">{stats.resolved || 0}</div>
        </div>
      </div>

      {/* Recent Assigned Complaints */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <ClipboardList className="w-4 h-4 text-indigo-400" />
            <span>Active Department Work Orders</span>
          </h3>
          <Link to="/department/complaints" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1">
            <span>View All Assigned</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No active work orders currently assigned to your department.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {recent.map((c) => (
              <div key={c.complaint_id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-400">{c.complaint_id}</span>
                    <StatusBadge status={c.status} />
                    <SeverityBadge severity={c.severity} />
                    <UrgencyBadge urgency={c.urgency} />
                  </div>
                  <h4 className="text-sm font-semibold text-white">{c.title}</h4>
                  <div className="text-[11px] text-slate-400">
                    Location: {c.location?.address || 'GPS Logged'} | Subcategory: {c.subcategory}
                  </div>
                </div>

                <Link to={`/department/complaints/${c.complaint_id}`}>
                  <Button variant="primary" size="sm">
                    Manage Work Order
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
