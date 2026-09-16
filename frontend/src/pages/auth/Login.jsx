import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Shield, ShieldAlert, Building2, User, Lock, Mail, AlertCircle } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'CLIENT' | 'ADMIN' | 'DEPARTMENT'
  const [loginMode, setLoginMode] = useState(() => {
    if (location.pathname.includes('admin')) return 'ADMIN';
    if (location.pathname.includes('dept')) return 'DEPARTMENT';
    return 'CLIENT';
  });
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let endpoint = '/auth/login';
      if (loginMode === 'ADMIN') endpoint = '/auth/admin/login';
      if (loginMode === 'DEPARTMENT') endpoint = '/auth/department/login';

      const user = await login(identifier, password, endpoint);

      // Route based on authenticated role
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'DEPARTMENT') {
        navigate('/department/dashboard');
      } else {
        navigate('/client/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-civic-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-civic-600 to-rose-600 shadow-xl shadow-civic-950/50 mb-3">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">CIVIC<span className="text-civic-400">AI</span></h2>
          <p className="text-xs text-slate-400 mt-1">
            Multilingual Citizen Complaint & Emergency Response System
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setLoginMode('CLIENT'); setError(null); }}
            className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition ${
              loginMode === 'CLIENT' ? 'bg-civic-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Citizen</span>
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode('ADMIN'); setError(null); }}
            className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition ${
              loginMode === 'ADMIN' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode('DEPARTMENT'); setError(null); }}
            className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition ${
              loginMode === 'DEPARTMENT' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Dept</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-900/60 flex items-center space-x-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              {loginMode === 'DEPARTMENT' ? 'Department Email or Username' : 'Email or Username'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={loginMode === 'ADMIN' ? 'superadmin / admin@civicai.gov' : 'user@example.com'}
                className="w-full bg-slate-950 text-slate-100 pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:border-civic-500 focus:ring-1 focus:ring-civic-500 outline-none text-sm transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 text-slate-100 pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:border-civic-500 focus:ring-1 focus:ring-civic-500 outline-none text-sm transition"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant={loginMode === 'ADMIN' ? 'danger' : (loginMode === 'DEPARTMENT' ? 'primary' : 'primary')}
            className="w-full py-2.5 text-sm font-semibold"
            loading={loading}
          >
            Sign In as {loginMode === 'CLIENT' ? 'Citizen' : (loginMode === 'ADMIN' ? 'Administrator' : 'Department Officer')}
          </Button>
        </form>

        {/* Register link for citizens */}
        {loginMode === 'CLIENT' && (
          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have a citizen account?{' '}
            <Link to="/register" className="text-civic-400 hover:text-civic-300 font-semibold underline">
              Register now
            </Link>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-[10px] text-slate-500">
          CivicAI Municipal Gov Platform &bull; Secured with JWT & bcrypt
        </div>
      </div>
    </div>
  );
};
