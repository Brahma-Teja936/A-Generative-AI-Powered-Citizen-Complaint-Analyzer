import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { User, Mail, Phone, ShieldCheck, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

export const ClientProfile = () => {
  const { user } = useAuth();
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
      setErrorMsg(err.response?.data?.error || 'Failed to update password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-white">Citizen Profile & Security</h2>

      {/* Account Info Card */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 text-xs">
        <div className="flex items-center space-x-4 border-b border-slate-800 pb-4">
          <div className="w-14 h-14 rounded-2xl bg-civic-600/30 border border-civic-500/40 flex items-center justify-center text-civic-400">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{user?.name}</h3>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              Verified Citizen
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center space-x-2 text-slate-400">
              <Mail className="w-4 h-4" />
              <span>Email Address</span>
            </div>
            <div className="font-semibold text-slate-200">{user?.email}</div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center space-x-2 text-slate-400">
              <Phone className="w-4 h-4" />
              <span>Mobile Phone</span>
            </div>
            <div className="font-semibold text-slate-200">{user?.phone || 'Not provided'}</div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center space-x-2 text-slate-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Account Status</span>
            </div>
            <div className="font-semibold text-emerald-400">Active & Authorized</div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 text-xs">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <KeyRound className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Update Password</h3>
        </div>

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:border-civic-500 outline-none"
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
                placeholder="New password"
                className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:border-civic-500 outline-none"
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
                className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:border-civic-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" loading={loading} className="w-full sm:w-auto">
              Save New Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
