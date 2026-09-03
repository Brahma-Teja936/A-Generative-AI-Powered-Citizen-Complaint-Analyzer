import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { LogIn, Sparkles, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in both email and password");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/api/auth/login", { email, password });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        if (res.data.user.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials or server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const autofillDemoCitizen = () => {
    setEmail("citizen@civicai.gov");
    setPassword("citizen123");
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo-badge">
            <Sparkles size={28} color="#2563eb" />
          </div>
          <h2 className="auth-title">Citizen Sign In</h2>
          <p className="auth-subtitle">Access your civic complaint portal and track resolutions</p>
        </div>

        {error && (
          <div className="auth-error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. citizen@civicai.gov"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label">Password</label>
            </div>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary-auth" disabled={loading}>
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In to CivicAI</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Demo Shortcut */}
        <div className="demo-credentials-box">
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <ShieldCheck size={16} color="#2563eb" />
            <strong style={{ fontSize: "0.82rem", color: "#1e293b" }}>Quick Demo Access:</strong>
          </div>
          <p style={{ margin: "0 0 8px", fontSize: "0.78rem", color: "#64748b" }}>
            Use the pre-configured demo citizen account to explore:
          </p>
          <button type="button" onClick={autofillDemoCitizen} className="btn-autofill">
            Autofill Demo Citizen (citizen@civicai.gov)
          </button>
        </div>

        {/* Footer Links */}
        <div className="auth-footer">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="auth-link">
              Register as Citizen
            </Link>
          </p>
          <p style={{ marginTop: "8px" }}>
            Municipal Administrator?{" "}
            <Link to="/admin/login" className="auth-link-admin">
              Admin Portal Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
