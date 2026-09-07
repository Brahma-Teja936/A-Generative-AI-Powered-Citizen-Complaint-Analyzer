import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminAPI } from "../../services/api";
import { StatusBadge, PriorityBadge, SeverityBadge, UrgencyBadge } from "../../components/Badges";
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Building2,
  RefreshCw,
  AlertTriangle
} from "lucide-react";

export const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("ALL");
  const [severity, setSeverity] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [validity, setValidity] = useState("ALL");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  const [departmentsList, setDepartmentsList] = useState([]);

  useEffect(() => {
    adminAPI.getDepartments()
      .then((res) => {
        if (res.data && res.data.departments) {
          setDepartmentsList(res.data.departments);
        }
      })
      .catch(() => {});
  }, []);

  const fetchComplaints = () => {
    setLoading(true);
    adminAPI.getComplaints({
      search,
      department,
      severity,
      priority,
      status,
      validity,
      sort_by: sortBy,
      sort_order: sortOrder,
      page,
      limit
    })
      .then((res) => {
        if (res.data && res.data.success) {
          setComplaints(res.data.complaints || []);
          setTotal(res.data.total || 0);
          setTotalPages(res.data.total_pages || 1);
        }
      })
      .catch((err) => console.error("Failed to load complaints:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, department, severity, priority, status, validity, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchComplaints();
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Complaints Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Total records: <strong className="text-slate-800">{total}</strong> complaints stored in MongoDB
          </p>
        </div>
        <button
          onClick={() => { setPage(1); fetchComplaints(); }}
          className="inline-flex items-center px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh List
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Complaint ID, Citizen Name, Email, Keywords, Location..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs shrink-0"
          >
            Search
          </button>
        </form>

        {/* Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
              className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-xs"
            >
              <option value="ALL">All Departments</option>
              {departmentsList.map((d) => (
                <option key={d.id} value={d.department_name}>{d.department_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Severity</label>
            <select
              value={severity}
              onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
              className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-xs"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => { setPriority(e.target.value); setPage(1); }}
              className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-xs"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Validity</label>
            <select
              value={validity}
              onChange={(e) => { setValidity(e.target.value); setPage(1); }}
              className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-xs"
            >
              <option value="ALL">All Validity</option>
              <option value="VALID">Valid</option>
              <option value="UNCLEAR">Unclear</option>
              <option value="SPAM">Spam</option>
              <option value="NON-CIVIC">Non-Civic</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No matching complaints found</h3>
            <p className="text-xs text-slate-400">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">Citizen</th>
                  <th className="py-3.5 px-4">Category / Sub</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Urgency</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Confidence</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((comp) => {
                  const ai = comp.ai_analysis || {};
                  const adminDec = comp.admin_decision || {};
                  const assigned = comp.assignment || {};
                  const dept = assigned.department_name || adminDec.department || ai.department;
                  const cat = adminDec.category || ai.category;
                  const subcat = adminDec.subcategory || ai.subcategory;
                  const sev = adminDec.severity || ai.severity;
                  const pri = adminDec.priority || ai.priority;
                  const urg = adminDec.urgency || ai.urgency;
                  const conf = ai.confidence?.department || ai.confidence?.category || 0.85;

                  return (
                    <tr key={comp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                        {comp.complaint_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{comp.citizen_name}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{comp.citizen_email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{cat}</div>
                        <div className="text-[10px] text-slate-400">{subcat}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {dept}
                      </td>
                      <td className="py-3.5 px-4"><SeverityBadge severity={sev} /></td>
                      <td className="py-3.5 px-4"><PriorityBadge priority={pri} /></td>
                      <td className="py-3.5 px-4"><UrgencyBadge urgency={urg} /></td>
                      <td className="py-3.5 px-4"><StatusBadge status={comp.status} /></td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700">
                          {Math.round(conf * 100)}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/admin/complaints/${comp.complaint_id}`}
                          className="inline-flex items-center px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> View & Review
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total)
          </div>
          <div className="flex space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
