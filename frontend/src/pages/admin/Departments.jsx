import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Building2, PlusCircle, CheckCircle2, XCircle, Key, Edit, RefreshCw, Eye, EyeOff, Copy, Check } from 'lucide-react';

export const AdminDepartments = () => {
  const { role } = useAuth();
  const [departments, setDepartments] = useState([]);
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
  const [password, setPassword] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Reset Password Modal
  const [pwModal, setPwModal] = useState(false);
  const [targetDept, setTargetDept] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchDepts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/departments');
      setDepartments(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/admin/departments', {
        department_name: name,
        department_email: email,
        username,
        password,
        description
      });
      setCreateModal(false);
      setName('');
      setEmail('');
      setUsername('');
      setPassword('');
      setDescription('');
      fetchDepts();
      alert('Department registered successfully.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create department');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (dept) => {
    const action = dept.active ? 'deactivate' : 'activate';
    try {
      await api.put(`/admin/departments/${dept.id || dept._id}/${action}`);
      fetchDepts();
    } catch (err) {
      alert('Failed to change status');
    }
  };

  const handleResetPw = async (e) => {
    e.preventDefault();
    if (!targetDept || !newPassword) return;
    try {
      await api.post(`/admin/departments/${targetDept.id || targetDept._id}/reset-password`, {
        password: newPassword
      });
      setPwModal(false);
      setNewPassword('');
      alert('Department password reset successfully.');
    } catch (err) {
      alert('Failed to reset password');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Department Operations Management</h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure municipal departments, manage emails, monitor active workloads, and control operational accounts
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="primary" size="sm" onClick={() => setCreateModal(true)}>
            <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
            Create Department
          </Button>
          <Button variant="secondary" size="sm" onClick={fetchDepts}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-xs">Loading departments directory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="p-3.5">Department Name</th>
                  <th className="p-3.5">Contact Email</th>
                  <th className="p-3.5">Username</th>
                  <th className="p-3.5">Active Workload</th>
                  <th className="p-3.5">Resolved</th>
                  <th className="p-3.5">Status</th>
                  {role === 'SUPER_ADMIN' && <th className="p-3.5">Department Password</th>}
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {departments.map((d) => (
                  <tr key={d.id || d._id} className="hover:bg-slate-900/40 transition">
                    <td className="p-3.5 font-semibold text-white">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-indigo-400" />
                        <span>{d.department_name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{d.description}</div>
                    </td>
                    <td className="p-3.5 text-slate-300 font-mono">{d.department_email}</td>
                    <td className="p-3.5 font-mono text-slate-400">{d.username}</td>
                    <td className="p-3.5 font-mono font-bold text-amber-400">{d.active_workload || 0}</td>
                    <td className="p-3.5 font-mono font-bold text-emerald-400">{d.resolved_count || 0}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.active ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {d.active ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>
                    </td>
                    {role === 'SUPER_ADMIN' && (
                      <td className="p-3.5">
                        <div className="flex items-center space-x-1.5 font-mono">
                          <span className="text-slate-200 bg-slate-950 px-2 py-1 rounded border border-slate-800 text-[11px] min-w-[90px] inline-block text-center">
                            {showPasswords[d.id || d._id] ? (d.latest_password_plain || 'Not recorded') : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleShowPassword(d.id || d._id)}
                            className="p-1 rounded text-slate-400 hover:text-white"
                            title={showPasswords[d.id || d._id] ? "Hide password" : "Show password"}
                          >
                            {showPasswords[d.id || d._id] ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          {d.latest_password_plain && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(d.latest_password_plain, d.id || d._id)}
                              className="p-1 rounded text-slate-400 hover:text-emerald-400"
                              title="Copy password"
                            >
                              {copied[d.id || d._id] ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                        {d.last_password_change && (
                          <div className="text-[9px] text-slate-500 mt-0.5">
                            Updated: {new Date(d.last_password_change).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </div>
                        )}
                      </td>
                    )}
                    <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(d)}
                        className={`p-1.5 rounded-lg border text-xs transition ${
                          d.active ? 'bg-rose-950/30 text-rose-400 border-rose-900/60 hover:bg-rose-950' : 'bg-emerald-950/30 text-emerald-400 border-emerald-900/60 hover:bg-emerald-950'
                        }`}
                        title={d.active ? 'Deactivate' : 'Activate'}
                      >
                        {d.active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => { setTargetDept(d); setPwModal(true); }}
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

      {/* Create Department Modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <span>Create New Department</span>
            </h3>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Water Supply & Sewerage"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Official Department Email (Dynamic)</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="water.support@civicai.gov"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Login Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="water_dept"
                    className="w-full bg-slate-950 text-slate-100 p-2 rounded-xl border border-slate-800 outline-none"
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
                    className="w-full bg-slate-950 text-slate-100 p-2 rounded-xl border border-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Description / Municipal Scope</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Pipeline leaks, drainage overflows, drinking water contamination..."
                  className="w-full bg-slate-950 text-slate-100 p-2 rounded-xl border border-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={creating}>
                  Create Department
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
              <span>Reset Password: {targetDept?.department_name}</span>
            </h3>

            <form onSubmit={handleResetPw} className="space-y-3">
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
