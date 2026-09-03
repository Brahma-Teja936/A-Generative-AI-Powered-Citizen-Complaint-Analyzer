import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { SeverityBadge, PriorityBadge, StatusBadge } from "../components/Badges";
import { FileText, Search, Filter, PlusCircle, ArrowRight, RefreshCw } from "lucide-react";

export const ComplaintHistory = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get("/api/complaints");
      if (res.data.success) {
        setComplaints(res.data.complaints || []);
      }
    } catch (err) {
      setError("Failed to load complaint history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Filter complaints
  const filtered = complaints.filter((c) => {
    const matchesSearch =
      search === "" ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.department.toLowerCase().includes(search.toLowerCase()) ||
      (c.summary && c.summary.toLowerCase().includes(search.toLowerCase())) ||
      String(c.id).includes(search);

    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    const matchesDept = deptFilter === "ALL" || c.department === deptFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  const uniqueDepartments = Array.from(new Set(complaints.map((c) => c.department))).filter(Boolean);

  return (
    <div className="citizen-page-container">
      {/* Header */}
      <div className="dashboard-hero">
        <div>
          <h1 className="dashboard-title">Complaint History</h1>
          <p className="dashboard-subtitle">
            Track all your civic grievances and view updates from city departments
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={fetchHistory} className="btn-secondary-action">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <Link to="/submit" className="btn-primary-action">
            <PlusCircle size={18} />
            <span>Submit Complaint</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-card">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <div className="search-input-wrapper">
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by ID, keyword, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <Filter size={16} color="#64748b" />
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>

            <select
              className="filter-select"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="ALL">All Departments</option>
              {uniqueDepartments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="dashboard-card" style={{ marginTop: "1.5rem" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <div className="spinner" style={{ margin: "0 auto 12px" }}></div>
            <p>Loading history records...</p>
          </div>
        ) : error ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#ef4444" }}>
            <p>{error}</p>
            <button onClick={fetchHistory} className="btn-secondary-action" style={{ marginTop: "8px" }}>
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} color="#cbd5e1" />
            <h3>No complaints match your criteria</h3>
            <p>Try clearing filters or search keywords.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="civic-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Complaint Description</th>
                  <th>Department</th>
                  <th>Severity</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const dateStr = c.created_at
                    ? new Date(c.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })
                    : "Recent";

                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: "700", color: "#2563eb" }}>#{c.id}</td>
                      <td style={{ maxWidth: "300px" }}>
                        <div
                          style={{
                            fontWeight: "500",
                            color: "#1e293b",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {c.description}
                        </div>
                        {c.summary && (
                          <div
                            style={{
                              fontSize: "0.78rem",
                              color: "#64748b",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {c.summary}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontWeight: "600", fontSize: "0.85rem", color: "#334155" }}>
                          {c.department}
                        </span>
                      </td>
                      <td>
                        <SeverityBadge severity={c.severity} />
                      </td>
                      <td>
                        <PriorityBadge priority={c.priority} />
                      </td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                      <td style={{ fontSize: "0.85rem", color: "#64748b" }}>{dateStr}</td>
                      <td>
                        <Link to={`/complaints/${c.id}`} className="btn-view-details">
                          View
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
