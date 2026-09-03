import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../services/api";
import { SeverityBadge, PriorityBadge, StatusBadge } from "../components/Badges";
import { StatusTimeline } from "../components/StatusTimeline";
import { ConfidenceBar } from "../components/ConfidenceBar";
import {
  FileText,
  ArrowLeft,
  Calendar,
  Building2,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  MapPin,
  User
} from "lucide-react";

export const ComplaintDetails = () => {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/api/complaints/${id}`);
        if (res.data.success) {
          setComplaint(res.data.complaint);
        }
      } catch (err) {
        setError("Failed to load complaint details. It may not exist or backend is unreachable.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="citizen-page-container" style={{ textAlign: "center", padding: "4rem 0" }}>
        <div className="spinner" style={{ margin: "0 auto 12px" }}></div>
        <p style={{ color: "#64748b" }}>Loading complaint #{id}...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="citizen-page-container" style={{ textAlign: "center", padding: "3rem 0" }}>
        <AlertCircle size={44} color="#ef4444" style={{ margin: "0 auto 12px" }} />
        <h3 style={{ color: "#0f172a" }}>Complaint Not Found</h3>
        <p style={{ color: "#64748b" }}>{error || "Could not retrieve the requested record."}</p>
        <Link to="/history" className="btn-secondary-action" style={{ display: "inline-flex", marginTop: "1rem" }}>
          <ArrowLeft size={16} />
          <span>Back to Complaints</span>
        </Link>
      </div>
    );
  }

  const createdDate = complaint.created_at ? new Date(complaint.created_at).toLocaleString() : "N/A";
  const updatedDate = complaint.updated_at ? new Date(complaint.updated_at).toLocaleString() : "N/A";

  return (
    <div className="citizen-page-container">
      {/* Back button & Title */}
      <div style={{ marginBottom: "1.5rem" }}>
        <Link
          to="/history"
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
          <span>Back to Complaint History</span>
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                Complaint #{complaint.id}
              </h1>
              <StatusBadge status={complaint.status} />
            </div>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.88rem" }}>
              Logged on {createdDate}
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <SeverityBadge severity={complaint.severity} />
            <PriorityBadge priority={complaint.priority} />
          </div>
        </div>
      </div>

      {/* Visual Status Tracking Timeline (Section 28) */}
      <div className="dashboard-card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: "1rem", color: "#0f172a", fontWeight: "700" }}>
          Resolution Lifecycle
        </h3>
        <StatusTimeline currentStatus={complaint.status} />
      </div>

      {/* Details Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
        {/* Left Column: Complaint & AI Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Card: Original Text */}
          <div className="dashboard-card">
            <h3 style={{ margin: "0 0 12px", fontSize: "1.05rem", color: "#0f172a", fontWeight: "700" }}>
              Complaint Description
            </h3>
            <p style={{ margin: 0, color: "#334155", lineHeight: "1.7", fontSize: "0.95rem" }}>
              {complaint.description}
            </p>

            {complaint.image_path && (
              <div style={{ marginTop: "1.25rem", borderTop: "1px solid #f1f5f9", paddingTop: "1rem" }}>
                <h4 style={{ margin: "0 0 8px", fontSize: "0.88rem", color: "#64748b" }}>
                  Attached Photo Evidence
                </h4>
                <img
                  src={complaint.image_path}
                  alt="Complaint visual proof"
                  style={{
                    maxHeight: "260px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    objectFit: "cover"
                  }}
                />
              </div>
            )}
          </div>

          {/* Card: AI Summary & Classification */}
          <div className="dashboard-card">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Sparkles size={20} color="#2563eb" />
              <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#0f172a", fontWeight: "700" }}>
                CivicAI Synthesis & Dispatch
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

            {/* Model Confidence Progress Bars */}
            <div style={{ marginTop: "1rem" }}>
              <h4 style={{ margin: "0 0 12px", fontSize: "0.85rem", color: "#64748b", fontWeight: "700" }}>
                AI Model Confidence Scores
              </h4>
              <ConfidenceBar
                label="Department Matching"
                value={complaint.confidence_department || 0.85}
                color="auto"
              />
              <ConfidenceBar
                label="Severity Classification"
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
        </div>

        {/* Right Column: Meta Info & Email Status */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Metadata Card */}
          <div className="dashboard-card">
            <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", color: "#0f172a", fontWeight: "700" }}>
              Department Assignment
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <Building2 size={18} color="#2563eb" style={{ marginTop: "2px" }} />
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#64748b", display: "block" }}>
                    Responsible Unit
                  </span>
                  <span style={{ fontWeight: "700", color: "#0f172a" }}>{complaint.department}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <Calendar size={18} color="#64748b" style={{ marginTop: "2px" }} />
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#64748b", display: "block" }}>
                    Last Update Timestamp
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "#1e293b" }}>{updatedDate}</span>
                </div>
              </div>

              {complaint.citizen && (
                <>
                  <div style={{ borderTop: "1px solid #f1f5f9", margin: "4px 0" }} />
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <User size={18} color="#64748b" style={{ marginTop: "2px" }} />
                    <div>
                      <span style={{ fontSize: "0.78rem", color: "#64748b", display: "block" }}>
                        Submitted By
                      </span>
                      <span style={{ fontWeight: "600", fontSize: "0.85rem", color: "#1e293b" }}>
                        {complaint.citizen.name}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <MapPin size={18} color="#64748b" style={{ marginTop: "2px" }} />
                    <div>
                      <span style={{ fontSize: "0.78rem", color: "#64748b", display: "block" }}>
                        Citizen Locality
                      </span>
                      <span style={{ fontSize: "0.85rem", color: "#1e293b" }}>
                        {complaint.citizen.location || "Not specified"}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Email Notification Status Card */}
          <div className="dashboard-card">
            <h3 style={{ margin: "0 0 10px", fontSize: "1rem", color: "#0f172a", fontWeight: "700" }}>
              Automated Email Dispatch
            </h3>
            <p style={{ margin: "0 0 12px", fontSize: "0.82rem", color: "#64748b" }}>
              CivicAI automatically alerts the relevant municipal engineers upon complaint registration.
            </p>

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
                  {complaint.email_status === "SENT" ? "Email Delivered to Department" : "Email Dispatch Logged"}
                </strong>
                <span style={{ fontSize: "0.75rem" }}>
                  Status: {complaint.email_status || "PENDING"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
