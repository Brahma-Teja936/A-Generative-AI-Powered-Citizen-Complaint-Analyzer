import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge, SeverityBadge, UrgencyBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PlusCircle, Search, Filter, ArrowRight, Trash2 } from 'lucide-react';

export const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/client/complaints?page=${page}&status=${filterStatus}`);
      setComplaints(res.data.items || []);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComplaint = async (complaintId) => {
    if (!window.confirm(`Are you sure you want to delete complaint ${complaintId}?`)) {
      return;
    }
    try {
      await api.delete(`/client/complaints/${complaintId}`);
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete complaint');
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, filterStatus]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">My Submitted Complaints</h2>
          <p className="text-xs text-slate-400 mt-1">Track status, assigned department, and live resolution timelines</p>
        </div>
        <Link to="/client/new-complaint">
          <Button variant="primary" size="sm">
            <PlusCircle className="w-4 h-4 mr-1.5" />
            File Complaint
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs">
        {['ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED'].map((st) => (
          <button
            key={st}
            onClick={() => { setFilterStatus(st); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              filterStatus === st
                ? 'bg-civic-600 text-white font-semibold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Table / List */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs">Loading your complaints...</div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            No complaints found under filter '{filterStatus}'.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {complaints.map((c) => (
              <div key={c.complaint_id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-900/40 transition">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-civic-400">{c.complaint_id}</span>
                    <StatusBadge status={c.status} />
                    <SeverityBadge severity={c.severity} />
                    <UrgencyBadge urgency={c.urgency} />
                  </div>
                  <h3 className="text-base font-semibold text-white">{c.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 max-w-2xl">
                    {c.translated_text_en || c.original_text}
                  </p>
                  <div className="text-[11px] text-slate-500 flex flex-wrap gap-4 pt-1">
                    <span>Department: <b className="text-slate-300">{c.department || 'Under AI Review'}</b></span>
                    <span>Location: {c.location?.address || 'GPS Logged'}</span>
                    <span>Submitted: {c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Link to={`/client/complaints/${c.complaint_id}`}>
                    <Button variant="secondary" size="sm" className="whitespace-nowrap">
                      <span>View Status</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                  <button
                    onClick={() => handleDeleteComplaint(c.complaint_id)}
                    title="Delete Complaint"
                    className="p-2 rounded-xl bg-slate-900/80 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 text-xs">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="px-3 py-2 text-slate-400 font-mono">Page {page} of {totalPages}</span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};
