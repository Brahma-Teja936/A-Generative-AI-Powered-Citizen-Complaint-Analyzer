import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { SeverityBadge, PriorityBadge, StatusBadge } from "../components/Badges";
import { ConfidenceBar } from "../components/ConfidenceBar";
import { StatusTimeline } from "../components/StatusTimeline";
import {
  ArrowLeft,
  Building2,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck
} from "lucide-react";

export const AdminComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Editable Admin Control States
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedSev, setSelectedSev] = useState("");
  const [selectedPri, setSelectedPri] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

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

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get(`/api/admin/complaints/${id}`);
      if (res.data.success) {
        const c = res.data.complaint;
        setComplaint(c);
        setSelectedDept(c.department);
        setSelectedSev(c.severity);
        setSelectedPri(c.priority);
        setSelectedStatus(c.status);
      }
    } catch (err) {
      setError("Failed to load complaint details. Please check the ID.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // Handle Admin Save (Section 27)
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setError(null);

    try {
      setSaving(true);
      const payload = {
        department: selectedDept,
        severity: selectedSev,
        priority: selectedPri,
        status: selectedStatus
      };

      const res = await API.put(`/api/admin/complaints/${id}`, payload);
      if (res.data.success) {
        setComplaint(res.data.complaint);
        setSuccessMessage("Changes saved successfully to PostgreSQL database!");
        setTimeout(() => setSuccessMessage(""), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update complaint in database.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page-container" style={{ textAlign: "center", padding: "4rem 0" }}>
        <div className="spinner" style={{ margin: "0 auto 12px" }}></div>
        <p style={{ color: "#64748b" }}>Loading complaint record #{id}...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="admin-page-container" style={{ textAlign: "center", padding: "3rem 0" }}>
        <AlertCircle size={44} color="#ef4444" style={{ margin: "0 auto 12px" }} />
        <h3>Complaint Record Unavailable</h3>
        <p style={{ color: "#64748b" }}>{error || "Could not find complaint"}</p>
        <Link to="/admin/complaints" className="btn-secondary-action" style={{ display: "inline-flex", marginTop: "1rem" }}>
          <ArrowLeft size={16} />
          <span>Back to Complaints List</span>
        </Link>
      </div>
    );
  }

  const createdDate = complaint.created_at ? new Date(complaint.created_at).toLocaleString() : "N/A";
  const updatedDate = complaint.updated_at ? new Date(complaint.updated_at).toLocaleString() : "N/A";

  return (
    <div className="admin-page-container">
      {/* Top Breadcrumb & Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <Link
          to="/admin/complaints"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "#64748b",
            fontSize: "0.85rem",
            textDecoration: "none",
            fontWeight: "600",
            marginBottom: "0.75rem"
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Registry</span>
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                Manage Complaint #{complaint.id}
              </h1>
              <StatusBadge status={complaint.status} />
            </div>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.85rem" }}>
              Logged on {createdDate} | Last modified: {updatedDate}
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <SeverityBadge severity={complaint.severity} />
            <PriorityBadge priority={complaint.priority} />
          </div>
        </div>
      </div>

      {successMessage && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "#ecfdf5",
            border: "1px solid #a7f3d0",
            color: "#065f46",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "1.5rem"
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Grid: Info + Admin Controls */}
      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: "1.5rem" }}>
        {/* Left Column: Complaint & AI & Citizen */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Timeline */}
          <div className="dashboard-card">
            <h3 style={{ margin: "0 0 10px", fontSize: "0.95rem", color: "#0f172a", fontWeight: "700" }}>
              Complaint Status Tracking
            </h3>
            <StatusTimeline currentStatus={complaint.status} />
          </div>

          {/* Original Complaint Text & Image */}
          <div className="dashboard-card">
            <h3 style={{ margin: "0 0 12px", fontSize: "1.05rem", color: "#0f172a", fontWeight: "700" }}>
              Original Citizen Complaint
            </h3>
            <p style={{ margin: 0, color: "#334155", lineHeight: "1.7", fontSize: "0.95rem" }}>
              {complaint.description}
            </p>

            {complaint.image_path && (
              <div style={{ marginTop: "1.25rem", borderTop: "1px solid #f1f5f9", paddingTop: "1rem" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "8px" }}>
                  Attached Image Proof:
                </span>
                <img
                  src={complaint.image_path}
                  alt="Citizen visual upload"
                  style={{
                    maxHeight: "320px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    objectFit: "cover"
                  }}
                />
              </div>
            )}
          </div>

          {/* AI Analysis & Summary */}
          <div className="dashboard-card">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Sparkles size={20} color="#2563eb" />
              <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#0f172a", fontWeight: "700" }}>
                AI Analysis & Summary
              </h3>
            </div>

            <div
              style={{
                backgroundColor: "#eff6ff",
                border: "1px solid #dbeafe",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1.2rem"
              }}
            >
              <strong style={{ display: "block", fontSize: "0.85rem", color: "#1e40af", marginBottom: "4px" }}>
                AI Generated Executive Summary:
              </strong>
              <p style={{ margin: 0, color: "#1e3a8a", fontSize: "0.92rem", lineHeight: "1.6" }}>
                {complaint.summary || "Summary generation pending."}
              </p>
            </div>

            {/* Confidence bars */}
            <div style={{ marginTop: "1rem" }}>
              <h4 style={{ margin: "0 0 12px", fontSize: "0.85rem", color: "#64748b", fontWeight: "700" }}>
                Model Prediction Confidence Scores:
              </h4>
              <ConfidenceBar
                label="Department Matching"
                value={complaint.confidence_department || 0.85}
                color="auto"
              />
              <ConfidenceBar
                label="Severity Detection"
                value={complaint.confidence_severity || 0.80}
                color="auto"
              />
              <ConfidenceBar
                label="Priority Score"
                value={complaint.confidence_priority || 0.80}
                color="auto"
              />
            </div>
          </div>

          {/* Citizen Information Card (Section 27) */}
          <div className="dashboard-card">
            <h3 style={{ margin: "0 0 12px", fontSize: "1.05rem", color: "#0f172a", fontWeight: "700" }}>
              Citizen Information
            </h3>

            {complaint.citizen ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <User size={16} color="#64748b" />
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Full Name</span>
                    <strong style={{ color: "#0f172a", fontSize: "0.9rem" }}>{complaint.citizen.name}</strong>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <Mail size={16} color="#64748b" />
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Email</span>
                    <span style={{ color: "#0f172a", fontSize: "0.85rem" }}>{complaint.citizen.email}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <Phone size={16} color="#64748b" />
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Phone</span>
                    <span style={{ color: "#0f172a", fontSize: "0.85rem" }}>{complaint.citizen.phone || "N/A"}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <MapPin size={16} color="#64748b" />
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Registered Locality</span>
                    <span style={{ color: "#0f172a", fontSize: "0.85rem" }}>{complaint.citizen.location || "N/A"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, color: "#64748b" }}>Submitted anonymously or without citizen account.</p>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Admin Controls Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="dashboard-card" style={{ border: "2px solid #3b82f6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
              <ShieldCheck size={20} color="#2563eb" />
              <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a", fontWeight: "800" }}>
                Admin Triage Controls
              </h3>
            </div>
            <p style={{ margin: "0 0 1.25rem", fontSize: "0.82rem", color: "#64748b" }}>
              Modify classification or advance resolution status. Updates are instantly committed to PostgreSQL.
            </p>

            <form onSubmit={handleSaveChanges} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="form-group">
                <label className="form-label">Assigned Department</label>
                <select
                  className="filter-select"
                  style={{ width: "100%", padding: "8px 12px" }}
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Severity Level</label>
                <select
                  className="filter-select"
                  style={{ width: "100%", padding: "8px 12px" }}
                  value={selectedSev}
                  onChange={(e) => setSelectedSev(e.target.value)}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority Order</label>
                <select
                  className="filter-select"
                  style={{ width: "100%", padding: "8px 12px" }}
                  value={selectedPri}
                  onChange={(e) => setSelectedPri(e.target.value)}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Resolution Status</label>
                <select
                  className="filter-select"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontWeight: "700",
                    color: "#1e3a8a",
                    backgroundColor: "#eff6ff"
                  }}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn-primary-action"
                style={{ width: "100%", justifyContent: "center", padding: "10px", marginTop: "8px" }}
                disabled={saving}
              >
                {saving ? (
                  <span>Saving to Database...</span>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save & Commit Updates</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Email Notification Status Box */}
          <div className="dashboard-card">
            <h3 style={{ margin: "0 0 10px", fontSize: "0.95rem", color: "#0f172a", fontWeight: "700" }}>
              Automated Email Status
            </h3>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "8px",
                backgroundColor: complaint.email_status === "SENT" ? "#ecfdf5" : "#fef2f2",
                border: complaint.email_status === "SENT" ? "1px solid #a7f3d0" : "1px solid #fecaca",
                color: complaint.email_status === "SENT" ? "#047857" : "#b91c1c"
              }}
            >
              <Mail size={18} />
              <div>
                <strong style={{ fontSize: "0.85rem", display: "block" }}>
                  Status: {complaint.email_status || "NOT_SENT"}
                </strong>
                {complaint.email_log && complaint.email_log.recipient && (
                  <span style={{ fontSize: "0.75rem", display: "block", marginTop: "2px" }}>
                    Recipient: {complaint.email_log.recipient}
                  </span>
                )}
                {complaint.email_log && complaint.email_log.error_message && (
                  <span style={{ fontSize: "0.72rem", color: "#b91c1c", display: "block", marginTop: "2px" }}>
                    Log: {complaint.email_log.error_message}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
