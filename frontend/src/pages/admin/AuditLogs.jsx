import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminAPI } from "../../services/api";
import {
  ScrollText,
  ShieldCheck,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  User,
  Clock
} from "lucide-react";

export const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const actionsList = [
    "ALL",
    "Admin Login",
    "Complaint Viewed",
    "Complaint Reviewed",
    "AI Override",
    "Department Assignment",
    "Status Change",
    "Complaint Resolved",
    "Email Retried",
    "Department Created"
  ];

  const fetchLogs = () => {
    setLoading(true);
    adminAPI.getAuditLogs({ action: actionFilter, page, limit })
      .then((res) => {
        if (res.data && res.data.success) {
          setLogs(res.data.audit_logs || []);
          setTotal(res.data.total || 0);
          setTotalPages(res.data.total_pages || 1);
        }
      })
      .catch((err) => console.error("Failed to load audit logs:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, page]);

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Administrative Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Immutable system audit logs tracking logins, AI overrides, status changes, and department assignments
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Audit Trail
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex space-x-1">
            {actionsList.map((act) => (
              <button
                key={act}
                onClick={() => { setActionFilter(act); setPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  actionFilter === act
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {act}
              </button>
            ))}
          </div>
        </div>
        <span className="text-xs text-slate-400 shrink-0">
          Total Logs: <strong>{total}</strong>
        </span>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <ScrollText className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No audit logs found</h3>
            <p className="text-xs text-slate-400">Administrative activities will be logged here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Admin</th>
                  <th className="py-3.5 px-4">Complaint ID</th>
                  <th className="py-3.5 px-4">Audit Details & Modification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const dt = log.timestamp ? new Date(log.timestamp) : null;
                  const dateStr = dt ? dt.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
                  const timeStr = dt ? dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        <span className="font-semibold text-slate-700">{dateStr}</span>
                        <span className="text-[10px] text-slate-400 block">{timeStr}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          log.action === "AI Override"
                            ? "bg-purple-100 text-purple-800"
                            : log.action === "Complaint Resolved"
                            ? "bg-emerald-100 text-emerald-800"
                            : log.action === "Admin Login"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {log.admin_email}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                        {log.complaint_id ? (
                          <Link to={`/admin/complaints/${log.complaint_id}`} className="hover:underline">
                            {log.complaint_id}
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-sm">
                        {log.new_value && typeof log.new_value === "object" ? (
                          <pre className="text-[10px] bg-slate-50 p-1.5 rounded border border-slate-200 overflow-x-auto">
                            {JSON.stringify(log.new_value, null, 1)}
                          </pre>
                        ) : (
                          <span>{log.new_value || log.metadata?.description || "—"}</span>
                        )}
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
