import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { clientAPI } from "../../services/api";
import { StatusBadge, PriorityBadge, SeverityBadge } from "../../components/Badges";
import { StatusTimeline } from "../../components/StatusTimeline";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Building2,
  Clock,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  AlertCircle
} from "lucide-react";

export const CitizenComplaintDetail = () => {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    clientAPI.getComplaintDetail(id)
      .then((res) => {
        if (res.data && res.data.success) {
          setComplaint(res.data.complaint);
        } else {
          setError(res.data?.message || "Complaint not found");
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to load complaint details.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">{error || "Complaint not found"}</h2>
        <Link to="/client/complaints" className="inline-block text-xs font-semibold text-indigo-600 hover:underline">
          &larr; Return to My Complaints
        </Link>
      </div>
    );
  }

  const ai = complaint.ai_classification || {};
  const isResolved = complaint.status === "RESOLVED" || complaint.status === "CLOSED";
  const createdDate = complaint.created_at ? new Date(complaint.created_at).toLocaleString() : "";
  const updatedDate = complaint.updated_at ? new Date(complaint.updated_at).toLocaleString() : "";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top back nav */}
      <div>
        <Link
          to="/client/complaints"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to My Complaints
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-indigo-800 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
              {complaint.complaint_id}
            </span>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={ai.priority} />
            <SeverityBadge severity={ai.severity} />
          </div>
          <span className="text-xs text-slate-400">Last updated: {updatedDate}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
          {complaint.title}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center">
            <Building2 className="w-4 h-4 mr-2 text-slate-400" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Assigned Department</p>
              <p className="font-bold text-slate-800 text-sm">{complaint.department || ai.department}</p>
            </div>
          </div>

          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-slate-400" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Location</p>
              <p className="font-medium text-slate-800">{complaint.location || "Not specified"}</p>
            </div>
          </div>

          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-slate-400" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Reported Date</p>
              <p className="font-medium text-slate-800">{createdDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* RESOLUTION CALLOUT (When complaint is resolved) */}
      {isResolved && complaint.resolution && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-6 sm:p-8 space-y-3">
          <div className="flex items-center space-x-2 text-emerald-800 font-extrabold text-lg">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <span>Complaint Successfully Resolved</span>
          </div>

          <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-emerald-200/80 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              Official Resolution Report:
            </p>
            <p className="text-sm text-slate-800 leading-relaxed font-medium">
              "{complaint.resolution.description}"
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-emerald-800 pt-2 border-t border-emerald-100">
              {complaint.resolution.resolved_by && (
                <span>Inspected & Resolved by: <strong>{complaint.resolution.resolved_by}</strong></span>
              )}
              {complaint.resolution.resolved_at && (
                <span>
                  Date: {new Date(complaint.resolution.resolved_at).toLocaleDateString()} at{" "}
                  {new Date(complaint.resolution.resolved_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progress Timeline Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Real-Time Progress Timeline</h2>
          <span className="text-xs text-slate-500 font-medium">Direct Municipal Audit Synchronization</span>
        </div>

        <StatusTimeline timeline={complaint.timeline || []} currentStatus={complaint.status} />
      </div>

      {/* Complaint Description & AI Summary Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Original Description (2 Cols) */}
        <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Original Complaint Details
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {complaint.description}
          </p>

          {/* Attachments */}
          {complaint.attachments && complaint.attachments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              <span className="text-xs font-semibold text-slate-600 flex items-center">
                <ImageIcon className="w-3.5 h-3.5 mr-1" /> Attached Evidence
              </span>
              <div className="flex flex-wrap gap-3">
                {complaint.attachments.map((att, idx) => (
                  <a
                    key={idx}
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-xl overflow-hidden border border-slate-200 hover:opacity-90 transition-opacity"
                  >
                    <img src={att.url} alt="Evidence" className="h-32 w-32 object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Information Card (1 Col) */}
        <div className="bg-gradient-to-br from-indigo-50/70 to-slate-50 p-6 rounded-3xl border border-indigo-100 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-indigo-900 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>AI Automated Assessment</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 block">Category:</span>
              <span className="font-semibold text-slate-800">{ai.category || "General Civic"}</span>
            </div>

            <div>
              <span className="text-slate-500 block">Department:</span>
              <span className="font-semibold text-indigo-700">{ai.department || "Municipal Services"}</span>
            </div>

            <div>
              <span className="text-slate-500 block">Target Resolution Window:</span>
              <span className="font-semibold text-slate-800 flex items-center mt-0.5">
                <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {ai.estimated_response_time || "Within 48 hours"}
              </span>
            </div>

            {ai.summary && (
              <div className="pt-2 border-t border-indigo-100">
                <span className="text-slate-500 block mb-1">AI Case Summary:</span>
                <p className="text-slate-700 italic leading-relaxed font-medium bg-white/70 p-2.5 rounded-xl border border-indigo-50">
                  "{ai.summary}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
