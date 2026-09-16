import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminAPI } from "../../services/api";
import {
  Bell,
  AlertOctagon,
  Flame,
  Copy,
  Layers,
  Sparkles,
  Check,
  CheckCheck,
  ArrowRight,
  Clock,
  Inbox
} from "lucide-react";

export const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = () => {
    setLoading(true);
    adminAPI.getNotifications()
      .then((res) => {
        if (res.data && res.data.success) {
          setNotifications(res.data.notifications || []);
        }
      })
      .catch((err) => console.error("Failed to load admin notifications:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await adminAPI.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (e) {
      console.error("Failed to mark read:", e);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    for (const item of unread) {
      await adminAPI.markNotificationRead(item.id);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getIconForType = (type) => {
    switch (type) {
      case "CRITICAL_COMPLAINT":
        return <AlertOctagon className="w-5 h-5 text-rose-600" />;
      case "URGENT_COMPLAINT":
        return <Flame className="w-5 h-5 text-amber-500" />;
      case "POSSIBLE_DUPLICATE":
        return <Copy className="w-5 h-5 text-indigo-500" />;
      case "MULTIPLE_ISSUES":
        return <Layers className="w-5 h-5 text-purple-500" />;
      case "LOW_AI_CONFIDENCE":
        return <Sparkles className="w-5 h-5 text-yellow-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Administrator Alerts & System Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Critical safety hazards, urgent triage requests, low AI confidences, and duplicate alerts
          </p>
        </div>

        {notifications.some((n) => !n.read) && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl transition-colors"
          >
            <CheckCheck className="w-4 h-4 mr-1" /> Mark All as Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center space-y-2 shadow-xs">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No active notifications</h3>
          <p className="text-xs text-slate-400">All alerts and triage notifications have been cleared.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const dt = n.created_at ? new Date(n.created_at) : null;
            const dateStr = dt ? dt.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
            const timeStr = dt ? dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

            return (
              <div
                key={n.id}
                className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  n.read
                    ? "bg-white border-slate-200"
                    : "bg-indigo-50/40 border-indigo-200 shadow-xs"
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
                    {getIconForType(n.type)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-rose-500"></span>}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>

                    <div className="flex items-center space-x-4 pt-1 text-[11px] text-slate-400">
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {dateStr} at {timeStr}
                      </span>
                      {n.complaint_id && (
                        <Link
                          to={`/admin/complaints/${n.complaint_id}`}
                          className="font-bold text-indigo-700 hover:underline flex items-center"
                        >
                          Review Case {n.complaint_id} <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {!n.read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors shrink-0"
                    title="Mark as Read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
