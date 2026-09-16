import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminAPI } from "../../services/api";
import { Mail, RefreshCw, AlertCircle, CheckCircle2, RotateCcw, Search, ChevronLeft, ChevronRight } from "lucide-react";

export const AdminEmailHistory = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  const fetchLogs = () => {
    setLoading(true);
    adminAPI.getEmailHistory({ status: statusFilter, page, limit })
      .then((res) => {
        if (res.data && res.data.success) {
          setLogs(res.data.email_logs || []);
          setTotal(res.data.total || 0);
          setTotalPages(res.data.total_pages || 1);
        }
      })
      .catch((err) => console.error("Failed to load email logs:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [statusFilter, page]);

  const handleRetry = async (logId) => {
    try {
      const res = await adminAPI.retryEmail(logId);
      if (res.data && res.data.success) {
        setActionMsg("Email resent successfully!");
      } else {
        setActionMsg(`Email dispatch failed: ${res.data?.error || "Check SMTP configuration in .env"}`);
      }
      fetchLogs();
    } catch (e) {
      setActionMsg("Failed to retry email dispatch.");
    } finally {
      setTimeout(() => setActionMsg(""), 5000);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Email Dispatch Logs & Idempotency Audit
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Audit trail of all automated civic notifications and department alerts dispatched via SMTP
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Logs
        </button>
      </div>

      {actionMsg && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center justify-between shadow-md">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg("")} className="text-slate-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex space-x-1">
          {["ALL", "SENT", "FAILED"].map((st) => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {st} Emails
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Total: <strong>{total}</strong> logged dispatches
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <Mail className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No email logs found</h3>
            <p className="text-xs text-slate-400">Automated dispatches will appear here upon complaint submission and status updates.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Complaint ID</th>
                  <th className="py-3.5 px-4">Email Type</th>
                  <th className="py-3.5 px-4">Recipient</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Retries</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                      {log.complaint_id ? (
                        <Link to={`/admin/complaints/${log.complaint_id}`} className="hover:underline">
                          {log.complaint_id}
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{log.email_type}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">{log.recipient}</td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-[200px] truncate">{log.subject}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.status === "SENT" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}>
                        {log.status === "SENT" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {log.sent_at ? new Date(log.sent_at).toLocaleString() : new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-semibold">{log.retry_count || 0}</td>
                    <td className="py-3.5 px-4 text-right">
                      {log.status === "FAILED" && (
                        <button
                          onClick={() => handleRetry(log.id)}
                          className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition-colors"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" /> Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total logs)
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
