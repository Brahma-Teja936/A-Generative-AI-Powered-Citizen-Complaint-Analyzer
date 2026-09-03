import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { Mail, CheckCircle2, AlertTriangle, RefreshCw, ExternalLink } from "lucide-react";

export const AdminEmailLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get("/api/email-logs");
      if (res.data.success) {
        setLogs(res.data.email_logs || []);
      }
    } catch (err) {
      setError("Failed to fetch email logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="dashboard-hero">
        <div>
          <h1 className="dashboard-title">Automated Email Notification Logs</h1>
          <p className="dashboard-subtitle">
            Audit trail of SMTP email dispatches sent to municipal departments upon citizen complaint submission.
          </p>
        </div>
        <button onClick={fetchLogs} className="btn-secondary-action">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Table Card */}
      <div className="dashboard-card" style={{ marginTop: "1.5rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
            Total Recorded Dispatches: <strong>{logs.length}</strong>
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <div className="spinner" style={{ margin: "0 auto 12px" }}></div>
            <p>Loading email dispatch logs...</p>
          </div>
        ) : error ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#ef4444" }}>
            <p>{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <Mail size={44} color="#cbd5e1" />
            <h3>No email logs recorded yet</h3>
            <p>Emails will be logged whenever citizens submit complaints.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="civic-table">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Complaint</th>
                  <th>Recipient Email</th>
                  <th>Email Subject</th>
                  <th>Dispatch Status</th>
                  <th>Timestamp</th>
                  <th>Diagnostics / Error</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const sentDate = log.sent_at
                    ? new Date(log.sent_at).toLocaleString()
                    : "Recent";

                  return (
                    <tr key={log.id}>
                      <td style={{ fontWeight: "700", color: "#64748b" }}>#{log.id}</td>
                      <td>
                        {log.complaint_id ? (
                          <Link
                            to={`/admin/complaints/${log.complaint_id}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontWeight: "700",
                              color: "#2563eb",
                              textDecoration: "none"
                            }}
                          >
                            <span>#{log.complaint_id}</span>
                            <ExternalLink size={12} />
                          </Link>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>General</span>
                        )}
                      </td>
                      <td style={{ fontWeight: "600", color: "#1e293b", fontSize: "0.85rem" }}>
                        {log.recipient}
                      </td>
                      <td style={{ maxWidth: "260px", fontSize: "0.85rem", color: "#334155" }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={log.subject}>
                          {log.subject}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 9px",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
                            fontWeight: "700",
                            backgroundColor: log.status === "SENT" ? "#ecfdf5" : "#fef2f2",
                            color: log.status === "SENT" ? "#047857" : "#b91c1c",
                            border: log.status === "SENT" ? "1px solid #a7f3d0" : "1px solid #fecaca"
                          }}
                        >
                          {log.status === "SENT" ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                          {log.status}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.82rem", color: "#64748b" }}>{sentDate}</td>
                      <td style={{ maxWidth: "240px", fontSize: "0.78rem" }}>
                        {log.error_message ? (
                          <span style={{ color: "#b91c1c", wordBreak: "break-word" }}>
                            {log.error_message}
                          </span>
                        ) : (
                          <span style={{ color: "#059669" }}>Delivered cleanly</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
