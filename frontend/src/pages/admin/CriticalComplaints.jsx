import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminAPI } from "../../services/api";
import { StatusBadge, PriorityBadge, SeverityBadge, SafetyRiskBadge } from "../../components/Badges";
import { AlertOctagon, ShieldAlert, ArrowRight, Eye, RefreshCw } from "lucide-react";

export const CriticalComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCritical = () => {
    setLoading(true);
    adminAPI.getCriticalComplaints()
      .then((res) => {
        if (res.data && res.data.success) {
          setComplaints(res.data.complaints || []);
        }
      })
      .catch((err) => console.error("Failed to load critical complaints:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCritical();
  }, []);

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Alert Header */}
      <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <AlertOctagon className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-rose-950 tracking-tight">
              Critical Public Safety Complaints
            </h1>
            <p className="text-xs text-rose-700 mt-0.5">
              Complaints categorized with <strong>CRITICAL</strong> severity or <strong>VERY HIGH</strong> safety hazard risk. Immediate field intervention required.
            </p>
          </div>
        </div>

        <button
          onClick={fetchCritical}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" /> Refresh Critical Queue
        </button>
      </div>

      {/* Critical Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <ShieldAlert className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Critical Safety Hazards Pending</h3>
            <p className="text-xs text-slate-400">All critical public hazards have been addressed and resolved.</p>
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
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4">Safety Risk</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((c) => {
                  const ai = c.ai_analysis || {};
                  const dec = c.admin_decision || {};
                  const dept = c.assignment?.department_name || dec.department || ai.department;
                  const sev = dec.severity || ai.severity;
                  const risk = dec.safety_risk || ai.safety_risk;

                  return (
                    <tr key={c.id} className="hover:bg-rose-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-700">{c.complaint_id}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{c.citizen_name}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 max-w-[220px] truncate">{c.title}</td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{dept}</td>
                      <td className="py-3.5 px-4"><SeverityBadge severity={sev} /></td>
                      <td className="py-3.5 px-4"><SafetyRiskBadge risk={risk} /></td>
                      <td className="py-3.5 px-4"><StatusBadge status={c.status} /></td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/admin/complaints/${c.complaint_id}`}
                          className="inline-flex items-center px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Expedite Dispatch &rarr;
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
