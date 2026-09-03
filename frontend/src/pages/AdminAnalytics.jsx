import React, { useState, useEffect } from "react";
import API from "../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  RefreshCw
} from "lucide-react";

export const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get("/api/admin/dashboard");
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      setError("Failed to load analytics metrics from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="admin-page-container" style={{ textAlign: "center", padding: "4rem 0" }}>
        <div className="spinner" style={{ margin: "0 auto 12px" }}></div>
        <p style={{ color: "#64748b" }}>Aggregating civic analytics from database...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="admin-page-container" style={{ textAlign: "center", padding: "3rem 0" }}>
        <p style={{ color: "#ef4444" }}>{error}</p>
        <button onClick={fetchAnalytics} className="btn-secondary-action">
          Retry
        </button>
      </div>
    );
  }

  const { metrics, workload } = data;

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="dashboard-hero">
        <div>
          <h1 className="dashboard-title">Municipal Performance Analytics</h1>
          <p className="dashboard-subtitle">
            Comprehensive breakdown of resolution velocities, departmental workloads, and civic SLA metrics.
          </p>
        </div>
        <button onClick={fetchAnalytics} className="btn-secondary-action">
          <RefreshCw size={16} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* KPI Cards (Section 29) */}
      <div className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}>
            <TrendingUp size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Resolution Rate</div>
            <div className="stat-value">{metrics.resolution_rate}%</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: "#ecfdf5", color: "#059669" }}>
            <Clock size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Avg Resolution Time</div>
            <div className="stat-value">{metrics.avg_resolution_days} days</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: "#fffbeb", color: "#d97706" }}>
            <BarChart3 size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Complaints This Week</div>
            <div className="stat-value">{metrics.complaints_this_week}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: "#f5f3ff", color: "#7c3aed" }}>
            <Building2 size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Complaints This Month</div>
            <div className="stat-value">{metrics.complaints_this_month}</div>
          </div>
        </div>
      </div>

      {/* Department Workload Table (Section 29) */}
      <div className="dashboard-card" style={{ marginTop: "2rem" }}>
        <div className="dashboard-card-header">
          <div>
            <h3 className="card-heading">Department Workload & SLA Allocation</h3>
            <p className="card-subheading">Active vs total resolved complaints across municipal departments</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="civic-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Official Email</th>
                <th>Total Assigned</th>
                <th>Active (Pending / In Progress)</th>
                <th>Workload Ratio</th>
              </tr>
            </thead>
            <tbody>
              {workload &&
                workload.map((w) => {
                  const percent = metrics.total_complaints > 0 ? Math.round((w.total / metrics.total_complaints) * 100) : 0;
                  return (
                    <tr key={w.department}>
                      <td>
                        <strong style={{ color: "#0f172a" }}>{w.department}</strong>
                      </td>
                      <td style={{ color: "#64748b", fontSize: "0.85rem" }}>{w.email}</td>
                      <td>
                        <span style={{ fontWeight: "700", color: "#2563eb" }}>{w.total}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: "700",
                            color: w.active > 0 ? "#d97706" : "#059669"
                          }}
                        >
                          {w.active}
                        </span>
                      </td>
                      <td style={{ minWidth: "160px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div
                            style={{
                              flex: 1,
                              height: "6px",
                              backgroundColor: "#e2e8f0",
                              borderRadius: "9999px",
                              overflow: "hidden"
                            }}
                          >
                            <div
                              style={{
                                width: `${percent}%`,
                                height: "100%",
                                backgroundColor: percent > 25 ? "#ef4444" : "#2563eb",
                                borderRadius: "9999px"
                              }}
                            />
                          </div>
                          <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#64748b" }}>
                            {percent}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
