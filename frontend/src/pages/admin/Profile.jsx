import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { ShieldCheck, User, Mail, Phone, Lock, KeyRound, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

export const AdminProfile = () => {
  const { user, role } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      setSuccessMsg(res.data.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to update password. Verify your current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
          <ShieldCheck className="w-7 h-7 text-indigo-400" />
          <span>Administrator Profile & Security Settings</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Manage your administrative credentials, security access keys, and view granted governance permissions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Account Details */}
        <div className="md:col-span-1 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex flex-col items-center text-center p-4 border-b border-slate-800/80">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-rose-600 flex items-center justify-center text-white shadow-xl shadow-indigo-950/50 mb-3">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <h3 className="text-base font-bold text-white">{user?.name || 'Administrator'}</h3>
            <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full mt-1 border font-bold ${
              role === 'SUPER_ADMIN' 
                ? 'bg-amber-950/60 text-amber-300 border-amber-800' 
                : 'bg-indigo-950/60 text-indigo-300 border-indigo-800'
            }`}>
              {role === 'SUPER_ADMIN' ? 'Super Administrator' : 'Sub-Administrator'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Username</span>
              <div className="font-mono text-slate-200 mt-0.5">{user?.username || 'admin'}</div>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Email Address</span>
              <div className="font-mono text-slate-200 mt-0.5">{user?.email}</div>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Account Role</span>
              <div className="font-semibold text-slate-200 mt-0.5">{user?.role}</div>
            </div>
          </div>
        </div>

        {/* Right Column: Password Change & Permissions */}
        <div className="md:col-span-2 space-y-6">
          {/* Password Change Card */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <KeyRound className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Update Password</h3>
            </div>

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">New Password (min 6 chars)</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" loading={loading} className="w-full sm:w-auto px-6">
                  Update Administrator Password
                </Button>
              </div>
            </form>
          </div>

          {/* Permissions Overview Card */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Assigned Governance Permissions</span>
            </h4>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(user?.permissions || ['FULL_SYSTEM_ACCESS']).map((p) => (
                <span
                  key={p}
                  className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
