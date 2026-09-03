import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import {
  FileText,
  Clock,
  Activity,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Bell,
  ArrowRight,
  TrendingUp,
  Building2
} from "lucide-react";

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashRes, complaintsRes] = await Promise.all([
        API.get("/api/admin/dashboard"),
        API.get("/api/admin/complaints?per_page=5&sort_by=created_at&sort_order=desc")
      ]);

      if (dashRes.data.success) {
        setData(dashRes.data);
      }
      if (complaintsRes.data.success) {
        setRecentComplaints(complaintsRes.data.complaints || []);
      }
    } catch (err) {
      setError("Failed to load admin dashboard analytics. Ensure backend is active.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="admin-page-container" style={{ textAlign: "center", padding: "4rem 0" }}>
        <div className="spinner" style={{ margin: "0 auto 12px" }}></div>
        <p style={{ color: "#64748b" }}>Loading real-time municipal dashboard metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="admin-page-container" style={{ textAlign: "center", padding: "3rem 0" }}>
        <AlertTriangle size={40} color="#ef4444" style={{ margin: "0 auto 12px" }} />
        <h3>Dashboard Error</h3>
        <p style={{ color: "#64748b" }}>{error}</p>
        <button onClick={fetchDashboardData} className="btn-secondary-action" style={{ marginTop: "1rem" }}>
          Retry
        </button>
      </div>
    );
  }

  const { metrics, charts } = data;

  // Chart Colors
  const SEVERITY_COLORS = {
    LOW: "#94a3b8",
    MEDIUM: "#f59e0b",
    HIGH: "#f97316",
    CRITICAL: "#ef4444"
  };

  const STATUS_COLORS = {
    Pending: "#f59e0b",
    Assigned: "#3b82f6",
    "In Progress": "#8b5cf6",
    Resolved: "#10b981",
    Rejected: "#ef4444"
  };

  const PIE_PALETTE = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

  return (
    <div className="admin-page-container">
      {/* Top Banner */}
      <div className="dashboard-hero">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: "700",
                textTransform: "uppercase",
                padding: "2px 8px",
                borderRadius: "4px",
                backgroundColor: "#1e293b",
                color: "#94a3b8"
              }}
            >
              MUNICIPAL OVERVIEW
            </span>
            <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
              Live PostgreSQL Analytics
            </span>
          </div>
          <h1 className="dashboard-title">City Grievance Control Center</h1>
          <p className="dashboard-subtitle">
            Real-time complaint inflow, AI automated classification, and inter-departmental workflows.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={fetchDashboardData} className="btn-secondary-action">
            <RefreshCw size={16} />
            <span>Refresh Data</span>
          </button>
          <Link to="/admin/complaints" className="btn-primary-action">
            <span>Manage All Complaints</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Notifications Alert Bar (Section 30) */}
      {recentComplaints.length > 0 && (
        <div
          style={{
            backgroundColor: "#fffbeb",
            border: "1px solid #fef3c7",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "#fef3c7",
                color: "#d97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Bell size={18} />
            </div>
            <div>
              <strong style={{ fontSize: "0.88rem", color: "#92400e" }}>
                Latest Complaint #{recentComplaints[0].id}: {recentComplaints[0].department}
              </strong>
              <span style={{ display: "block", fontSize: "0.8rem", color: "#78350f" }}>
                Priority: {recentComplaints[0].priority} | Severity: {recentComplaints[0].severity} — Click to inspect and assign.
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate(`/admin/complaints/${recentComplaints[0].id}`)}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              backgroundColor: "#d97706",
              color: "#ffffff",
              fontSize: "0.8rem",
              fontWeight: "600",
              border: "none",
              cursor: "pointer"
            }}
          >
            Review Complaint #{recentComplaints[0].id}
          </button>
        </div>
      )}

      {/* 6 Top Metric Cards (Section 25) */}
      <div className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}>
            <FileText size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Complaints</div>
            <div className="stat-value">{metrics.total_complaints}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: "#fffbeb", color: "#d97706" }}>
            <Clock size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Pending Review</div>
            <div className="stat-value">{metrics.pending}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: "#f5f3ff", color: "#7c3aed" }}>
            <Activity size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">In Progress</div>
            <div className="stat-value">{metrics.in_progress}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: "#ffedd5", color: "#c2410c" }}>
            <AlertTriangle size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">High Priority</div>
            <div className="stat-value">{metrics.high_priority}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: "#fee2e2", color: "#b91c1c" }}>
            <ShieldAlert size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Critical Severity</div>
            <div className="stat-value">{metrics.critical}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: "#ecfdf5", color: "#059669" }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Resolved</div>
            <div className="stat-value">{metrics.resolved}</div>
          </div>
        </div>
      </div>

      {/* 5 Recharts Visualizations Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "1.5rem", marginTop: "2rem" }}>
        {/* Chart 1: Complaints by Department */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h3 className="card-heading">1. Complaints by Department</h3>
              <p className="card-subheading">Breakdown across 12 municipal branches</p>
            </div>
          </div>
          <div style={{ width: "100%", height: "280px" }}>
            <ResponsiveContainer>
              <BarChart data={charts.by_department} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                <XAxis
                  dataKey="name"
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", color: "#fff", borderRadius: "8px" }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Complaints by Severity */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h3 className="card-heading">2. Complaints by Severity</h3>
              <p className="card-subheading">LOW, MEDIUM, HIGH, CRITICAL distribution</p>
            </div>
          </div>
          <div style={{ width: "100%", height: "280px" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={charts.by_severity}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  innerRadius={50}
                  paddingAngle={4}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {charts.by_severity.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={SEVERITY_COLORS[entry.name] || "#3b82f6"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", color: "#fff", borderRadius: "8px" }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Complaints by Priority */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h3 className="card-heading">3. Complaints by Priority</h3>
              <p className="card-subheading">Urgency hierarchy for field response</p>
            </div>
          </div>
          <div style={{ width: "100%", height: "280px" }}>
            <ResponsiveContainer>
              <BarChart data={charts.by_priority} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", color: "#fff", borderRadius: "8px" }}
                />
                <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Complaints Over Time */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h3 className="card-heading">4. Complaints Over Time</h3>
              <p className="card-subheading">Daily complaint submissions (past 7 days)</p>
            </div>
          </div>
          <div style={{ width: "100%", height: "280px" }}>
            <ResponsiveContainer>
              <AreaChart data={charts.by_time} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <defs>
                  <linearGradient id="timeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", color: "#fff", borderRadius: "8px" }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#timeGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Complaint Status Distribution */}
        <div className="dashboard-card" style={{ gridColumn: "span 2" }}>
          <div className="dashboard-card-header">
            <div>
              <h3 className="card-heading">5. Complaint Status Distribution</h3>
              <p className="card-subheading">Pending, Assigned, In Progress, Resolved, Rejected</p>
            </div>
          </div>
          <div style={{ width: "100%", height: "260px" }}>
            <ResponsiveContainer>
              <BarChart
                layout="vertical"
                data={charts.by_status}
                margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
              >
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#475569" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", color: "#fff", borderRadius: "8px" }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {charts.by_status.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#3b82f6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
