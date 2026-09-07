import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { clientAPI } from "../../services/api";
import { StatusBadge, PriorityBadge } from "../../components/Badges";
import {
  FileText,
  PlusCircle,
  Search,
  Calendar,
  Building2,
  ArrowRight,
  Filter
} from "lucide-react";

export const CitizenComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchComplaints = () => {
    setLoading(true);
    clientAPI.getComplaints({ status: statusFilter, limit: 50 })
      .then((res) => {
        if (res.data && res.data.success) {
          setComplaints(res.data.complaints || []);
          setTotal(res.data.total || 0);
        }
      })
      .catch((err) => console.error("Failed to load complaints:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  const tabs = [
    { id: "ALL", label: "All Complaints" },
    { id: "PENDING", label: "Pending" },
    { id: "IN_PROGRESS", label: "In Progress" },
    { id: "RESOLVED", label: "Resolved" },
    { id: "CLOSED", label: "Closed" }
  ];

  // Client-side search filtering
  const filtered = complaints.filter((c) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      (c.complaint_id || "").toLowerCase().includes(term) ||
      (c.title || "").toLowerCase().includes(term) ||
      (c.department || "").toLowerCase().includes(term) ||
      (c.category || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Submitted Complaints
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track and monitor resolution milestones for all your civic reports
          </p>
        </div>
        <Link
          to="/client/complaints/new"
          className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4 mr-1.5" /> Submit New Complaint
        </Link>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        {/* Status Tabs */}
        <div className="flex space-x-1 overflow-x-auto pb-1 sm:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                statusFilter === tab.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, title, department..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No complaints found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search ? "No reports match your search query." : "You haven't submitted any complaints under this filter tab."}
          </p>
          {statusFilter !== "ALL" && (
            <button
              onClick={() => setStatusFilter("ALL")}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Show all complaints
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((comp) => {
            const dateStr = comp.created_at ? new Date(comp.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
            const updatedStr = comp.updated_at ? new Date(comp.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : dateStr;

            return (
              <div
                key={comp.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Info Block */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {comp.complaint_id}
                    </span>
                    <StatusBadge status={comp.status} />
                    <PriorityBadge priority={comp.priority} />
                    {comp.category && (
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {comp.category}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {comp.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center">
                      <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      Department: <strong className="text-slate-700 ml-1">{comp.department}</strong>
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      Submitted: <span className="ml-1">{dateStr}</span>
                    </span>
                    <span className="text-slate-400">
                      Last Updated: {updatedStr}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <Link
                    to={`/client/complaints/${comp.complaint_id}`}
                    className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
                  >
                    View Details & Track <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
