import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminAPI } from "../../services/api";
import { StatusBadge, PriorityBadge, SeverityBadge, UrgencyBadge } from "../../components/Badges";
import { Clock, Flame, ArrowRight, Eye, RefreshCw } from "lucide-react";

export const UrgentComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUrgent = () => {
    setLoading(true);
    adminAPI.getUrgentComplaints()
      .then((res) => {
        if (res.data && res.data.success) {
          setComplaints(res.data.complaints || []);
        }
      })
      .catch((err) => console.error("Failed to load urgent complaints:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUrgent();
  }, []);

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Alert Header */}
      <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <Flame className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-amber-950 tracking-tight">
              Urgent Priority Complaints
            </h1>
            <p className="text-xs text-amber-700 mt-0.5">
              Complaints requiring priority response within 24 hours or immediate field deployment.
            </p>
          </div>
        </div>

        <button
          onClick={fetchUrgent}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" /> Refresh Urgent Queue
        </button>
      </div>

      {/* Urgent Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <Clock className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Urgent Priority Complaints Pending</h3>
            <p className="text-xs text-slate-400">All urgent civic complaints have been processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Complaint ID</th>
                  <th className="py-3.5 px-4">Citizen</th>
                  <th className="py-3.5 px-4">Title</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Urgency</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((c) => {
                  const ai = c.ai_analysis || {};
                  const dec = c.admin_decision || {};
                  const dept = c.assignment?.department_name || dec.department || ai.department;
                  const pri = dec.priority || ai.priority;
                  const urg = dec.urgency || ai.urgency;

                  return (
                    <tr key={c.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-800">{c.complaint_id}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{c.citizen_name}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 max-w-[220px] truncate">{c.title}</td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{dept}</td>
                      <td className="py-3.5 px-4"><PriorityBadge priority={pri} /></td>
                      <td className="py-3.5 px-4"><UrgencyBadge urgency={urg} /></td>
                      <td className="py-3.5 px-4"><StatusBadge status={c.status} /></td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/admin/complaints/${c.complaint_id}`}
                          className="inline-flex items-center px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Inspect &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
