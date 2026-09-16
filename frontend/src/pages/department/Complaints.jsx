import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge, SeverityBadge, UrgencyBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ArrowRight, Filter } from 'lucide-react';

export const DepartmentComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('ALL');
  const [severity, setSeverity] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/department/complaints?page=${page}&status=${status}&severity=${severity}`);
      setComplaints(res.data.items || []);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, status, severity]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Assigned Department Complaints</h2>
          <p className="text-xs text-slate-400 mt-1">
            Work orders assigned exclusively to your operations unit
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 text-xs">
        {['ALL', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED'].map((st) => (
          <button
            key={st}
            onClick={() => { setStatus(st); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              status === st
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}

        <select
          value={severity}
          onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
          className="bg-slate-900 text-slate-300 border border-slate-800 rounded-xl px-3 py-1.5 outline-none ml-auto"
        >
          <option value="ALL">All Severities</option>
          <option value="CRITICAL">Critical Only</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs">Loading assigned work orders...</div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            No complaints found matching filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {complaints.map((c) => (
              <div key={c.complaint_id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-900/40 transition">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-400">{c.complaint_id}</span>
                    <StatusBadge status={c.status} />
                    <SeverityBadge severity={c.severity} />
                    <UrgencyBadge urgency={c.urgency} />
                  </div>
                  <h3 className="text-base font-semibold text-white">{c.title}</h3>
                  <p className="text-xs text-slate-300 line-clamp-2 max-w-3xl">
                    {c.translated_text_en || c.original_text}
                  </p>
                  <div className="text-[11px] text-slate-500 flex flex-wrap gap-4 pt-1">
                    <span>Subcategory: {c.subcategory}</span>
                    <span>Location: {c.location?.address}</span>
                    <span>Assigned: {c.assigned_at ? new Date(c.assigned_at).toLocaleDateString() : 'Recent'}</span>
                  </div>
                </div>

                <Link to={`/department/complaints/${c.complaint_id}`}>
                  <Button variant="primary" size="sm" className="whitespace-nowrap">
                    <span>Manage Order</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 text-xs">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="px-3 py-2 text-slate-400 font-mono">Page {page} of {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
};
