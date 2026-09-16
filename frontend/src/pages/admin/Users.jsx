import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users2, Mail, Phone, Calendar, RefreshCw } from 'lucide-react';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Registered Citizens Directory</h2>
          <p className="text-xs text-slate-400 mt-1">Directory of registered citizens submitting municipal complaints</p>
        </div>
        <button
          onClick={fetchUsers}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-xs">Loading citizens list...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-xs">No registered citizens yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="p-3.5">Citizen Name</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Username</th>
                  <th className="p-3.5">Mobile Phone</th>
                  <th className="p-3.5">Registration Date</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.id || u._id} className="hover:bg-slate-900/40 transition">
                    <td className="p-3.5 font-semibold text-white">{u.name}</td>
                    <td className="p-3.5 text-slate-300 font-mono">{u.email}</td>
                    <td className="p-3.5 text-slate-400 font-mono">{u.username}</td>
                    <td className="p-3.5 text-slate-400">{u.phone || 'N/A'}</td>
                    <td className="p-3.5 text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.active ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {u.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
