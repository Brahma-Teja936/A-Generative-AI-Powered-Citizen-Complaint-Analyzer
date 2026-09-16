import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge, SeverityBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PlusCircle, Clock, CheckCircle2, AlertCircle, FileText, ArrowRight } from 'lucide-react';

export const ClientDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/client/dashboard');
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
    return <div className="text-center py-16 text-slate-400">Loading citizen portal...</div>;
  }

  const stats = data?.stats || { total: 0, pending: 0, in_progress: 0, resolved: 0 };
  const recent = data?.recent_complaints || [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <span className="text-xs font-mono font-semibold text-civic-400 uppercase tracking-wider bg-civic-950/80 px-2.5 py-1 rounded-md border border-civic-800">
            Citizen Voice & Emergency Action
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
            Have a Civic Problem in Your Area?
          </h2>
          <p className="text-sm text-slate-300 mt-2">
            Submit complaints with voice in English, Telugu, or Hindi. Our AI automatically classifies the department, detects safety hazards, and coordinates rapid municipal response.
          </p>
        </div>
        <div className="relative z-10">
          <Link to="/client/new-complaint">
            <Button variant="primary" size="lg" className="shadow-xl shadow-civic-900/50">
              <PlusCircle className="w-5 h-5 mr-2" />
              File New Complaint
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Complaints</span>
            <FileText className="w-4 h-4 text-civic-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{stats.total}</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Review</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">{stats.pending}</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">In Progress</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 font-mono">{stats.in_progress}</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">{stats.resolved}</div>
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">My Recent Complaints</h3>
          <Link to="/client/complaints" className="text-xs font-semibold text-civic-400 hover:text-civic-300 flex items-center space-x-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            You haven't filed any complaints yet.{' '}
            <Link to="/client/new-complaint" className="text-civic-400 font-semibold underline">
              Submit your first complaint here.
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {recent.map((c) => (
              <div key={c.complaint_id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-civic-400">{c.complaint_id}</span>
                    <StatusBadge status={c.status} />
                    <SeverityBadge severity={c.severity} />
                  </div>
                  <h4 className="text-sm font-semibold text-white">{c.title}</h4>
                  <p className="text-xs text-slate-400 truncate max-w-xl">
                    {c.translated_text_en || c.original_text}
                  </p>
                </div>
                <Link to={`/client/complaints/${c.complaint_id}`}>
                  <Button variant="secondary" size="sm">
                    Track Progress
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
