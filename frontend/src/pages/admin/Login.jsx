import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ShieldAlert, ArrowRight, Lock, Mail, AlertCircle, ShieldCheck } from "lucide-react";

export const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Administrator email and password are required.");
      return;
    }

    setSubmitting(true);
    const res = await login(email, password, true);
    setSubmitting(false);

    if (res.success) {
      navigate("/admin/dashboard");
    } else {
      setError(res.message || "Invalid administrator credentials or unauthorized role.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 via-indigo-600 to-indigo-500 items-center justify-center text-white shadow-xl shadow-rose-950/50 mb-4 border border-rose-500/30">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center">
          Civic<span className="text-rose-500">AI</span>
          <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
            ADMIN
          </span>
        </h2>
        <p className="mt-1 text-xs font-medium text-slate-400">
          Administrative Command & Dispatch Operations Console
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/90 backdrop-blur-md py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-800">
          <div className="mb-6">
            <h3 className="text-base font-bold text-white flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-400" />
              Secure Staff Authentication
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Restricted to authorized municipal department administrators and dispatch engineers.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2 text-xs text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Admin Email
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@civicai.gov"
                  className="block w-full pl-10 pr-3 py-2.5 text-sm bg-slate-800/80 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Security Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 text-sm bg-slate-800/80 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 placeholder-slate-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center items-center py-2.5 px-4 rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Access Command Console <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials Box */}
          <div className="mt-6 p-3 bg-slate-800/60 rounded-xl border border-slate-700/80 text-[11px] text-slate-300 space-y-1">
            <p className="font-semibold text-slate-200">Default Admin Credentials:</p>
            <p className="font-mono text-rose-400">admin@civicai.gov / adminPassword123!</p>
          </div>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-xs text-slate-400 hover:text-slate-200 underline">
              &larr; Switch to Citizen Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
