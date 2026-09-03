import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { ShieldAlert, ArrowRight, AlertCircle, KeyRound, Building2 } from "lucide-react";

export const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const res = await API.post("/api/auth/admin-login", { email, password });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate("/admin/dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid administrator credentials or unauthorized role."
      );
    } finally {
      setLoading(false);
    }
  };

  const autofillDemoAdmin = () => {
    setEmail("admin@civicai.gov");
    setPassword("admin123");
  };

  return (
    <div className="auth-page-wrapper" style={{ backgroundColor: "#0f172a" }}>
      <div className="auth-card" style={{ borderColor: "#334155" }}>
        <div className="auth-header">
          <div
            className="auth-logo-badge"
            style={{ backgroundColor: "#7f1d1d", color: "#f87171" }}
          >
            <ShieldAlert size={28} />
          </div>
          <h2 className="auth-title">Municipal Admin Portal</h2>
          <p className="auth-subtitle">Restricted to authorized municipal grievance officers</p>
        </div>

        {error && (
          <div className="auth-error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Admin Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="admin@civicai.gov"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary-auth"
            style={{ backgroundColor: "#1e3a8a" }}
            disabled={loading}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <KeyRound size={18} />
                <span>Sign In as Administrator</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="demo-credentials-box">
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <Building2 size={16} color="#2563eb" />
            <strong style={{ fontSize: "0.82rem", color: "#1e293b" }}>Admin Demo Credentials:</strong>
          </div>
          <p style={{ margin: "0 0 8px", fontSize: "0.78rem", color: "#64748b" }}>
            Pre-configured administrative account for evaluation:
          </p>
          <button type="button" onClick={autofillDemoAdmin} className="btn-autofill">
            Autofill Admin (admin@civicai.gov / admin123)
          </button>
        </div>

        <div className="auth-footer">
          <p>
            Are you a citizen?{" "}
            <Link to="/login" className="auth-link">
              Citizen Portal Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
