import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { SeverityBadge, PriorityBadge, UrgencyBadge, StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { AlertOctagon, ArrowRight, ShieldAlert, RefreshCw } from 'lucide-react';

export const CriticalComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCritical = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/complaints/critical?page_size=50');
      setComplaints(res.data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCritical();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-rose-950/60 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-xl shadow-rose-950/80 animate-pulse">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Critical Incidents Queue</h2>
            <p className="text-xs text-slate-400">
              Complaints classified as CRITICAL or exhibiting urgent life/infrastructure safety risks
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link to="/admin/emergency">
            <Button variant="emergency" size="sm">
              <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
              Open Command Center
            </Button>
          </Link>
          <Button variant="secondary" size="sm" onClick={fetchCritical}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-rose-950/60 overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-xs">Scanning critical queue...</div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-xs">No active critical complaints found.</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {complaints.map((c) => (
              <div key={c.complaint_id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-rose-950/10 transition">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-rose-400">{c.complaint_id}</span>
                    <SeverityBadge severity={c.severity} />
                    <PriorityBadge priority={c.priority} />
                    <UrgencyBadge urgency={c.urgency} />
                    <StatusBadge status={c.status} />
                  </div>
                  <h3 className="text-base font-semibold text-white">{c.title}</h3>
                  <p className="text-xs text-slate-300 line-clamp-2 max-w-3xl">
                    {c.translated_text_en || c.original_text}
                  </p>
                  <div className="text-[11px] text-slate-500 flex flex-wrap gap-4 pt-1">
                    <span>Department: <b className="text-slate-300">{c.department || 'Awaiting Assignment'}</b></span>
                    <span>Location: {c.location?.address}</span>
                    <span>Reported: {new Date(c.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Link to={`/admin/emergency/${c.complaint_id}`}>
                    <Button variant="emergency" size="sm">
                      Dispatch EMS
                    </Button>
                  </Link>
                  <Link to={`/admin/complaints/${c.complaint_id}`}>
                    <Button variant="secondary" size="sm">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
