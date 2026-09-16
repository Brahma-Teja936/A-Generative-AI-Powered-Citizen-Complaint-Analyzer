import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Bell, Check, Clock, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const ClientNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const fetchNotifs = async () => {
    try {
      const res = await api.get('/client/notifications');
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/client/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => (n.id === id || n._id === id) ? { ...n, is_read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/client/notifications/${id}`);
      setNotifications(prev => prev.filter(n => (n.id !== id && n._id !== id)));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete notification');
    }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) {
      return;
    }
    setClearing(true);
    try {
      await api.delete('/client/notifications');
      setNotifications([]);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to clear notifications');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-civic-400" />
          <h2 className="text-xl font-bold text-white">My Notifications</h2>
        </div>
        {notifications.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={clearAllNotifications}
            disabled={clearing}
            className="text-rose-400 hover:text-rose-300 border-rose-900/50 hover:bg-rose-950/40"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            <span>{clearing ? 'Clearing...' : 'Clear All'}</span>
          </Button>
        )}
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 divide-y divide-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No notifications found.</div>
        ) : (
          notifications.map((n) => {
            const notifId = n.id || n._id;
            return (
              <div
                key={notifId}
                className={`p-4 flex items-start justify-between gap-3 text-xs transition ${
                  n.is_read ? 'opacity-75 hover:opacity-100 hover:bg-slate-900/40' : 'bg-civic-950/20 hover:bg-civic-950/40'
                }`}
              >
                <div className="space-y-1 flex-1 pr-2">
                  <div className="font-semibold text-white flex items-center gap-2">
                    {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-civic-400 shrink-0" />}
                    <span>{n.title}</span>
                  </div>
                  <div className="text-slate-300 leading-relaxed">{n.message}</div>
                  <div className="text-[10px] text-slate-500 flex items-center space-x-1 pt-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0 pt-0.5">
                  {!n.is_read && (
                    <button
                      onClick={() => markRead(notifId)}
                      title="Mark as read"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notifId)}
                    title="Delete notification"
                    className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-rose-950/80 hover:text-rose-400 text-slate-400 border border-slate-750 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
