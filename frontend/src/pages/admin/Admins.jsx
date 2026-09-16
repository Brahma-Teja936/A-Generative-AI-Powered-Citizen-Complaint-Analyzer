import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { UserCheck, PlusCircle, Shield, CheckCircle2, XCircle, Key, Lock, AlertCircle, RefreshCw, Eye, EyeOff, Copy, Check } from 'lucide-react';

const AVAILABLE_PERMISSIONS = [
  { id: 'VIEW_COMPLAINTS', label: 'View Complaints' },
  { id: 'REVIEW_AI', label: 'Review & Verify AI' },
  { id: 'OVERRIDE_AI', label: 'Override AI Classification' },
  { id: 'ASSIGN_DEPARTMENT', label: 'Assign Department' },
  { id: 'REASSIGN_DEPARTMENT', label: 'Reassign Department' },
  { id: 'MANAGE_PROGRESS', label: 'Manage Progress Updates' },
  { id: 'RESOLVE_COMPLAINT', label: 'Resolve Complaints' },
  { id: 'VIEW_ANALYTICS', label: 'View Analytics & Trends' },
  { id: 'VIEW_MAP', label: 'View Map Hotspots' },
  { id: 'VIEW_CRITICAL', label: 'View Critical Incidents' },
  { id: 'VIEW_URGENT', label: 'View Urgent Cases' },
  { id: 'EMERGENCY_RESPONSE', label: 'Emergency Command Dispatch' },
  { id: 'MANAGE_DEPARTMENTS', label: 'Manage Departments' },
  { id: 'MANAGE_EMERGENCY_SERVICES', label: 'Manage Emergency Services' },
  { id: 'VIEW_AUDIT_LOGS', label: 'View Audit Logs' },
  { id: 'MANAGE_USERS', label: 'Manage Citizen Users' },
];

export const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPasswords, setShowPasswords] = useState({});
  const [copied, setCopied] = useState({});

  const toggleShowPassword = (id) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopied(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  // Create Modal
  const [createModal, setCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState(AVAILABLE_PERMISSIONS.map(p => p.id));
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  // Reset Password Modal
  const [pwModal, setPwModal] = useState(false);
  const [targetAdmin, setTargetAdmin] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/admins');
      setAdmins(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setCreating(true);
    try {
      await api.post('/admin/admins', {
        name,
        email,
        username,
        phone,
        password,
        permissions: selectedPermissions
      });
      setCreateModal(false);
      setName('');
      setEmail('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      fetchAdmins();
      alert('Administrator created successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create administrator');
    } finally {
      setCreating(false);
    }
  };

  const handleTogglePermission = (permId) => {
    if (selectedPermissions.includes(permId)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permId));
    } else {
      setSelectedPermissions([...selectedPermissions, permId]);
    }
  };

  const handleToggleActive = async (admin) => {
    const action = admin.active ? 'deactivate' : 'activate';
    try {
      await api.put(`/admin/admins/${admin.id || admin._id}/${action}`);
      fetchAdmins();
    } catch (err) {
      alert('Failed to update admin status');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!targetAdmin || !newPassword) return;
    try {
      await api.post(`/admin/admins/${targetAdmin.id || targetAdmin._id}/reset-password`, {
        password: newPassword
      });
      setPwModal(false);
      setNewPassword('');
      alert('Administrator password reset successfully.');
    } catch (err) {
      alert('Failed to reset password');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Administrator Accounts Management</h2>
          <p className="text-xs text-slate-400 mt-1">
            Authorized SUPER_ADMIN console: create admins, allocate granular permissions, soft-deactivate, and audit
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="primary" size="sm" onClick={() => setCreateModal(true)}>
            <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
            Create Administrator
          </Button>
          <Button variant="secondary" size="sm" onClick={fetchAdmins}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-xs">Loading admin directory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="p-3.5">Admin Name & Email</th>
                  <th className="p-3.5">Username</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Permissions</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Assigned Password</th>
                  <th className="p-3.5">Last Login</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {admins.map((a) => (
                  <tr key={a.id || a._id} className="hover:bg-slate-900/40 transition">
                    <td className="p-3.5">
                      <div className="font-semibold text-white">{a.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{a.email}</div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">{a.username}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-civic-950 text-civic-300 border border-civic-800">
                        {a.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {Array.isArray(a.permissions) ? `${a.permissions.length} active permissions` : 'All'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.active ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {a.active ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center space-x-1.5 font-mono">
                        <span className="text-slate-200 bg-slate-950 px-2 py-1 rounded border border-slate-800 text-[11px] min-w-[85px] inline-block text-center">
                          {showPasswords[a.id || a._id] ? (a.latest_password_plain || 'Not recorded') : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleShowPassword(a.id || a._id)}
                          className="p-1 rounded text-slate-400 hover:text-white"
                          title={showPasswords[a.id || a._id] ? "Hide password" : "Show password"}
                        >
                          {showPasswords[a.id || a._id] ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        {a.latest_password_plain && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(a.latest_password_plain, a.id || a._id)}
                            className="p-1 rounded text-slate-400 hover:text-emerald-400"
                            title="Copy password"
                          >
                            {copied[a.id || a._id] ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                      {a.last_password_change && (
                        <div className="text-[9px] text-slate-500 mt-0.5">
                          Updated: {new Date(a.last_password_change).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                      {a.last_login ? new Date(a.last_login).toLocaleString() : 'Never'}
                    </td>
                    <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(a)}
                        className={`p-1.5 rounded-lg border text-xs transition ${
                          a.active ? 'bg-rose-950/30 text-rose-400 border-rose-900/60 hover:bg-rose-950' : 'bg-emerald-950/30 text-emerald-400 border-emerald-900/60 hover:bg-emerald-950'
                        }`}
                        title={a.active ? 'Deactivate Admin' : 'Activate Admin'}
                      >
                        {a.active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => { setTargetAdmin(a); setPwModal(true); }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                        title="Reset Password"
                      >
                        <Key className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-civic-400" />
              <span>Create Normal Administrator</span>
            </h3>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900 text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="priya.sharma@civicai.gov"
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Login Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="priya_admin"
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 outline-none"
                  />
                </div>
              </div>

              {/* Granular Permissions Selection */}
              <div>
                <label className="block text-slate-300 font-semibold mb-2">Allocated Administrative Permissions</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800 max-h-48 overflow-y-auto">
                  {AVAILABLE_PERMISSIONS.map((perm) => (
                    <label key={perm.id} className="flex items-center space-x-2 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={() => handleTogglePermission(perm.id)}
                        className="rounded border-slate-700 text-civic-600 focus:ring-0"
                      />
                      <span>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={creating}>
                  Create Administrator
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {pwModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Key className="w-5 h-5 text-amber-400" />
              <span>Reset Password: {targetAdmin?.name}</span>
            </h3>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1">New Password (min 6 chars)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setPwModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save New Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
