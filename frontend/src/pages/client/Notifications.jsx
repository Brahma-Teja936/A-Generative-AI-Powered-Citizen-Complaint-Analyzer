import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { clientAPI } from "../../services/api";
import { Bell, Check, ArrowRight, Clock, CheckCheck, Inbox } from "lucide-react";

export const CitizenNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = () => {
    setLoading(true);
    clientAPI.getNotifications()
      .then((res) => {
        if (res.data && res.data.success) {
          setNotifications(res.data.notifications || []);
        }
      })
      .catch((err) => console.error("Failed to load notifications:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await clientAPI.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (e) {
      console.error("Failed to mark as read:", e);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    for (const item of unread) {
      await clientAPI.markNotificationRead(item.id);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Notifications & Dispatch Alerts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time status changes, department assignments, and resolution updates
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
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No notifications yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You will receive instant notifications whenever your complaints are received, reviewed, assigned, or resolved.
          </p>
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
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  n.read
                    ? "bg-white border-slate-200/80"
                    : "bg-indigo-50/40 border-indigo-200/80 shadow-xs"
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      n.read
                        ? "bg-slate-100 text-slate-500"
                        : "bg-indigo-600 text-white shadow-xs"
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>

                    <div className="flex items-center space-x-3 pt-1 text-[11px] text-slate-400">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {dateStr} at {timeStr}
                      </span>
                      {n.complaint_id && (
                        <Link
                          to={`/client/complaints/${n.complaint_id}`}
                          className="font-semibold text-indigo-600 hover:underline flex items-center"
                        >
                          Track {n.complaint_id} <ArrowRight className="w-3 h-3 ml-0.5" />
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
