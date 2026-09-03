import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { SeverityBadge, PriorityBadge, StatusBadge } from "../components/Badges";
import {
  FileText,
  Clock,
  Activity,
  CheckCircle2,
  PlusCircle,
  ArrowRight,
  RefreshCw,
  Search
} from "lucide-react";

export const CitizenDashboard = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get("/api/complaints");
      if (res.data.success) {
        setComplaints(res.data.complaints || []);
      }
    } catch (err) {
      setError("Failed to load your complaints. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Compute stat metrics
  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === "Pending").length;
  const inProgress = complaints.filter((c) => c.status === "In Progress" || c.status === "Assigned").length;
  const resolved = complaints.filter((c) => c.status === "Resolved").length;

  return (
    <div className="citizen-page-container">
      {/* Welcome Banner */}
      <div className="dashboard-hero">
        <div>
          <h1 className="dashboard-title">
            Welcome back, <span style={{ color: "#2563eb" }}>{user?.name || "Citizen"}</span>
          </h1>
          <p className="dashboard-subtitle">
            Municipal jurisdiction: {user?.location || "Central Metropolis"}. Submit issues and monitor resolution in real-time.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={fetchComplaints} className="btn-secondary-action" title="Refresh">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <Link to="/submit" className="btn-primary-action">
            <PlusCircle size={18} />
            <span>Submit New Complaint</span>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}>
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Complaints</div>
            <div className="stat-value">{total}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: "#fffbeb", color: "#d97706" }}>
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Pending Review</div>
            <div className="stat-value">{pending}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: "#f5f3ff", color: "#7c3aed" }}>
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">In Progress</div>
            <div className="stat-value">{inProgress}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: "#ecfdf5", color: "#059669" }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Resolved</div>
            <div className="stat-value">{resolved}</div>
          </div>
        </div>
      </div>

      {/* Recent Complaints Table Card */}
      <div className="dashboard-card" style={{ marginTop: "2rem" }}>
        <div className="dashboard-card-header">
          <div>
            <h2 className="card-heading">Recent Complaints</h2>
            <p className="card-subheading">Track the live progress of issues you have submitted</p>
          </div>
          <Link to="/history" className="view-all-link">
            <span>View All ({complaints.length})</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <div className="spinner" style={{ margin: "0 auto 12px" }}></div>
            <p>Loading complaints...</p>
          </div>
        ) : error ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#ef4444" }}>
            <p>{error}</p>
            <button onClick={fetchComplaints} className="btn-secondary-action" style={{ marginTop: "8px" }}>
              Try Again
            </button>
          </div>
        ) : complaints.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} color="#cbd5e1" />
            <h3>No complaints submitted yet</h3>
            <p>Report issues in your neighborhood like potholes, leaks, garbage, or power cuts.</p>
            <Link to="/submit" className="btn-primary-action" style={{ marginTop: "1rem" }}>
              <PlusCircle size={18} />
              <span>Submit Your First Complaint</span>
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="civic-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Description</th>
                  <th>Department</th>
                  <th>Severity</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Submitted Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.slice(0, 5).map((comp) => {
                  const dateStr = comp.created_at
                    ? new Date(comp.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })
                    : "Recent";

                  return (
                    <tr key={comp.id}>
                      <td style={{ fontWeight: "700", color: "#2563eb" }}>#{comp.id}</td>
                      <td style={{ maxWidth: "280px" }}>
                        <div
                          style={{
                            fontWeight: "500",
                            color: "#1e293b",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}
                          title={comp.description}
                        >
                          {comp.description}
                        </div>
                        {comp.summary && (
                          <div
                            style={{
                              fontSize: "0.78rem",
                              color: "#64748b",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {comp.summary}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontWeight: "600", fontSize: "0.85rem", color: "#334155" }}>
                          {comp.department}
                        </span>
                      </td>
                      <td>
                        <SeverityBadge severity={comp.severity} />
                      </td>
                      <td>
                        <PriorityBadge priority={comp.priority} />
                      </td>
                      <td>
                        <StatusBadge status={comp.status} />
                      </td>
                      <td style={{ fontSize: "0.85rem", color: "#64748b" }}>{dateStr}</td>
                      <td>
                        <Link to={`/complaints/${comp.id}`} className="btn-view-details">
                          View Details
                        </Link>
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
