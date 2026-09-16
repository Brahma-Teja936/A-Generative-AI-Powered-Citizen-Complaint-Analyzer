import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge, SeverityBadge, PriorityBadge, UrgencyBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Search, Filter, ArrowRight, RefreshCw, Eye, Trash2 } from 'lucide-react';

export const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [severity, setSeverity] = useState('ALL');
  const [priority, setPriority] = useState('ALL');
  const [department, setDepartment] = useState('ALL');
  const [departmentsList, setDepartmentsList] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Fetch departments for dropdown
    api.get('/admin/departments').then(res => setDepartmentsList(res.data || [])).catch(() => {});
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        page_size: 15,
        status,
        severity,
        priority,
        department,
        search
      });
      const res = await api.get(`/admin/complaints?${params.toString()}`);
      setComplaints(res.data.items || []);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComplaint = async (complaintId) => {
    if (!window.confirm(`Are you sure you want to permanently delete complaint ${complaintId}? This cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/admin/complaints/${complaintId}`);
      fetchComplaints();
      alert(`Complaint ${complaintId} deleted successfully.`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete complaint.');
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, status, severity, priority, department]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchComplaints();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Live Civic Complaints Directory</h2>
          <p className="text-xs text-slate-400 mt-1">
            Review incoming citizen reports, inspect AI classifications, and manage assignments
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchComplaints}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, keyword, citizen text, or address..."
              className="w-full bg-slate-950 text-slate-100 pl-9 pr-4 py-2 rounded-xl border border-slate-800 focus:border-civic-500 outline-none text-xs"
            />
          </div>
          <Button type="submit" variant="primary" size="sm">
            Search
          </Button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/60">
          <div>
            <label className="block text-slate-400 text-[11px] mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full bg-slate-950 text-slate-300 p-2 rounded-lg border border-slate-800 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1">Severity</label>
            <select
              value={severity}
              onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
              className="w-full bg-slate-950 text-slate-300 p-2 rounded-lg border border-slate-800 outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => { setPriority(e.target.value); setPage(1); }}
              className="w-full bg-slate-950 text-slate-300 p-2 rounded-lg border border-slate-800 outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="VERY HIGH">Very High</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
              className="w-full bg-slate-950 text-slate-300 p-2 rounded-lg border border-slate-800 outline-none"
            >
              <option value="ALL">All Departments</option>
              {departmentsList.map(d => (
                <option key={d.id || d._id} value={d.department_name}>{d.department_name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-xs">Loading complaint directory...</div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-xs">No live complaints found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="p-3.5">ID / Date</th>
                  <th className="p-3.5">Title & Summary</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Classification</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {complaints.map((c) => (
                  <tr key={c.complaint_id} className="hover:bg-slate-900/40 transition">
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-mono font-bold text-civic-400">{c.complaint_id}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}
                      </div>
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <div className="font-semibold text-white truncate" title={c.title}>{c.title}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {c.translated_text_en || c.original_text}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{c.location?.address}</div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-medium text-slate-200">{c.department || 'Unassigned'}</div>
                      <div className="text-[10px] text-slate-500">{c.category}</div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap space-y-1">
                      <div><SeverityBadge severity={c.severity} /></div>
                      <div><PriorityBadge priority={c.priority} /></div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-right space-x-1.5">
                      <Link to={`/admin/complaints/${c.complaint_id}`}>
                        <Button variant="secondary" size="sm">
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          <span>Review</span>
                        </Button>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteComplaint(c.complaint_id)}
                        className="p-1.5 rounded-lg border border-rose-900/60 bg-rose-950/30 text-rose-400 hover:bg-rose-950 transition inline-flex items-center"
                        title="Delete complaint"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
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
