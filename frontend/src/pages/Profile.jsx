import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { User, Mail, Phone, MapPin, Calendar, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";

export const Profile = () => {
  const { user } = useAuth();
  const [complaintStats, setComplaintStats] = useState({ total: 0, resolved: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get("/api/complaints");
        if (res.data.success && res.data.complaints) {
          const list = res.data.complaints;
          setComplaintStats({
            total: list.length,
            resolved: list.filter((c) => c.status === "Resolved").length
          });
        }
      } catch (e) {
        // silent fallback
      }
    };
    fetchStats();
  }, []);

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric"
      })
    : "2026";

  return (
    <div className="citizen-page-container">
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        <div className="dashboard-hero" style={{ marginBottom: "1.5rem" }}>
          <div>
            <h1 className="dashboard-title">Citizen Profile</h1>
            <p className="dashboard-subtitle">Manage your registered municipal citizen identity</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.5rem" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                backgroundColor: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                fontWeight: "700"
              }}
            >
              {user?.name ? user.name[0].toUpperCase() : "C"}
            </div>
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: "1.35rem", color: "#0f172a" }}>{user?.name}</h2>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    backgroundColor: "#e0f2fe",
                    color: "#0369a1",
                    textTransform: "uppercase"
                  }}
                >
                  {user?.role || "Citizen"}
                </span>
                <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Member since {memberSince}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div className="profile-detail-box">
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", marginBottom: "4px" }}>
                <Mail size={16} />
                <span style={{ fontSize: "0.8rem", fontWeight: "600" }}>Email Address</span>
              </div>
              <span style={{ fontWeight: "600", color: "#0f172a" }}>{user?.email}</span>
            </div>

            <div className="profile-detail-box">
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", marginBottom: "4px" }}>
                <Phone size={16} />
                <span style={{ fontSize: "0.8rem", fontWeight: "600" }}>Phone Number</span>
              </div>
              <span style={{ fontWeight: "600", color: "#0f172a" }}>{user?.phone || "Not provided"}</span>
            </div>

            <div className="profile-detail-box" style={{ gridColumn: "span 2" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", marginBottom: "4px" }}>
                <MapPin size={16} />
                <span style={{ fontSize: "0.8rem", fontWeight: "600" }}>Locality / Address</span>
              </div>
              <span style={{ fontWeight: "600", color: "#0f172a" }}>{user?.location || "Not provided"}</span>
            </div>
          </div>

          {/* Activity summary */}
          <div style={{ marginTop: "2rem", borderTop: "1px solid #f1f5f9", paddingTop: "1.5rem" }}>
            <h3 style={{ fontSize: "1rem", color: "#0f172a", marginBottom: "1rem", fontWeight: "700" }}>
              Civic Participation
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ padding: "1rem", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "4px" }}>Complaints Submitted</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#2563eb" }}>{complaintStats.total}</div>
              </div>

              <div style={{ padding: "1rem", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "4px" }}>Resolved Issues</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#059669" }}>{complaintStats.resolved}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
