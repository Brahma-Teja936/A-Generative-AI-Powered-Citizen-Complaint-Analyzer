import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { SeverityBadge, PriorityBadge, StatusBadge } from "../components/Badges";
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Mail,
  AlertCircle
} from "lucide-react";

export const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Pagination States
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("ALL");
  const [severity, setSeverity] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page,
        per_page: 10,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...(search && { search }),
        ...(department !== "ALL" && { department }),
        ...(severity !== "ALL" && { severity }),
        ...(priority !== "ALL" && { priority }),
        ...(status !== "ALL" && { status })
      });

      const res = await API.get(`/api/admin/complaints?${params.toString()}`);
      if (res.data.success) {
        setComplaints(res.data.complaints || []);
        setTotalPages(res.data.total_pages || 1);
        setTotalRecords(res.data.total || 0);
      }
    } catch (err) {
      setError("Failed to fetch complaints list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, department, severity, priority, status, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchComplaints();
  };

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const DEPARTMENTS = [
    "Roads & Infrastructure",
    "Water Supply",
    "Electricity",
    "Sanitation",
    "Waste Management",
    "Drainage",
    "Public Safety",
    "Street Lighting",
    "Traffic",
    "Public Health",
    "Parks & Environment",
    "Other"
  ];

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="dashboard-hero">
        <div>
          <h1 className="dashboard-title">Municipal Grievances Registry</h1>
          <p className="dashboard-subtitle">
            Manage, filter, triage, and update citizen reports across all city departments
          </p>
        </div>
        <button onClick={fetchComplaints} className="btn-secondary-action">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Multi-Filter Bar */}
      <div className="filter-card">
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "10px", width: "100%" }}>
          <div className="search-input-wrapper" style={{ minWidth: "260px", flex: "1" }}>
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              className="search-input"
              placeholder="Search description, citizen, keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={severity}
            onChange={(e) => {
              setSeverity(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All Severities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>

          <select
            className="filter-select"
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>

          <select
            className="filter-select"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <button type="submit" className="btn-secondary-action">
            Search
          </button>
        </form>
      </div>

      {/* Complaints Table (Section 26) */}
      <div className="dashboard-card" style={{ marginTop: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
            Showing <strong>{complaints.length}</strong> of <strong>{totalRecords}</strong> total complaints
          </span>
          <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
            Sorted by: <strong>{sortBy}</strong> ({sortOrder.toUpperCase()})
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <div className="spinner" style={{ margin: "0 auto 12px" }}></div>
            <p>Fetching complaints from PostgreSQL database...</p>
          </div>
        ) : error ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#ef4444" }}>
            <p>{error}</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={44} color="#94a3b8" />
            <h3>No complaints found</h3>
            <p>Try clearing filter constraints or search keywords.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="civic-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort("id")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span>ID</span>
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th>Complaint & Summary</th>
                  <th onClick={() => toggleSort("department")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span>Department</span>
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th>Severity</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th onClick={() => toggleSort("created_at")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span>Submitted Date</span>
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th>Email Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => {
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
                      <td style={{ maxWidth: "280px" }}>
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
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "0.75rem",
                            fontWeight: "700",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            backgroundColor: c.email_status === "SENT" ? "#ecfdf5" : "#fef2f2",
                            color: c.email_status === "SENT" ? "#047857" : "#b91c1c"
                          }}
                        >
                          <Mail size={12} />
                          {c.email_status || "NOT_SENT"}
                        </span>
                      </td>
                      <td>
                        <Link to={`/admin/complaints/${c.id}`} className="btn-view-details">
                          Inspect & Triage
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem", borderTop: "1px solid #f1f5f9", paddingTop: "1rem" }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="btn-secondary-action"
            style={{ opacity: page <= 1 ? 0.5 : 1 }}
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>

          <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="btn-secondary-action"
            style={{ opacity: page >= totalPages ? 0.5 : 1 }}
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
