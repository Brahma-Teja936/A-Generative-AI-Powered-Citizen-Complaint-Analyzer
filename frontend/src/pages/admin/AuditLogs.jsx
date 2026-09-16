import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { History, ShieldAlert, Clock, RefreshCw } from 'lucide-react';

export const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/audit-logs?page=${page}&page_size=25`);
      setLogs(res.data.items || []);
      setTotalPages(res.data.pages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white">System Security & Audit Trail</h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of all administrative actions, emergency declarations, logins, and overrides
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-xs">Loading audit ledger...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-xs">No audit logs recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Admin ID</th>
                  <th className="p-3.5">Target</th>
                  <th className="p-3.5">Audit Payload Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id || log._id} className="hover:bg-slate-900/40 transition">
                    <td className="p-3.5 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        log.action.includes('EMERGENCY') ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        log.action.includes('LOGIN') ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                        log.action.includes('DEACTIVATED') ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-slate-900 text-slate-300 border border-slate-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-300 truncate max-w-[120px]">{log.admin_id}</td>
                    <td className="p-3.5 text-civic-400 truncate max-w-[120px]">{log.target_id || 'N/A'}</td>
                    <td className="p-3.5 max-w-md text-slate-400 font-sans text-xs">
                      {log.new_value && (
                        <div className="truncate"><b>New:</b> {JSON.stringify(log.new_value)}</div>
                      )}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="truncate text-slate-500 text-[10px]"><b>Meta:</b> {JSON.stringify(log.metadata)}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 text-xs">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 font-mono text-slate-400">Page {page} of {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
