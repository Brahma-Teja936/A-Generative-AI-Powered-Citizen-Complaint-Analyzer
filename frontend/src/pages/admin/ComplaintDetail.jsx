import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { adminAPI } from "../../services/api";
import {
  StatusBadge,
  PriorityBadge,
  SeverityBadge,
  UrgencyBadge,
  SafetyRiskBadge,
  ConfidenceBar
} from "../../components/Badges";
import { StatusTimeline } from "../../components/StatusTimeline";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Building2,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Send,
  Save,
  CheckCheck,
  RefreshCw,
  Copy,
  Layers,
  ShieldAlert,
  User,
  Mail,
  Phone,
  FileText,
  HelpCircle,
  RotateCcw
} from "lucide-react";

export const AdminComplaintDetail = () => {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [similarComplaint, setSimilarComplaint] = useState(null);
  const [departmentsList, setDepartmentsList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Admin Override Form state
  const [decisionForm, setDecisionForm] = useState({
    department: "",
    secondary_department: "",
    category: "",
    subcategory: "",
    severity: "",
    priority: "",
    urgency: "",
    safety_risk: "",
    public_impact: "",
    response_time: "",
    notes: "",
    override_reason: ""
  });

  // Department Assignment state
  const [selectedDeptId, setSelectedDeptId] = useState("");

  // Progress update state
  const [progressStatus, setProgressStatus] = useState("IN_PROGRESS");
  const [progressDescription, setProgressDescription] = useState("");

  // Resolution state
  const [resolutionDescription, setResolutionDescription] = useState("");

  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [assigningDept, setAssigningDept] = useState(false);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [resolving, setResolving] = useState(false);

  const fetchDetail = () => {
    setLoading(true);
    adminAPI.getComplaintDetail(id)
      .then((res) => {
        if (res.data && res.data.success) {
          const comp = res.data.complaint;
          setComplaint(comp);
          setTimeline(res.data.timeline || []);
          setEmailLogs(res.data.email_logs || []);
          setSimilarComplaint(res.data.similar_complaint || null);

          // Populate decision form with current active values
          const ai = comp.ai_analysis || {};
          const dec = comp.admin_decision || {};
          setDecisionForm({
            department: dec.department || ai.department || "",
            secondary_department: dec.secondary_department || ai.secondary_department || "",
            category: dec.category || ai.category || "",
            subcategory: dec.subcategory || ai.subcategory || "",
            severity: dec.severity || ai.severity || "MEDIUM",
            priority: dec.priority || ai.priority || "MEDIUM",
            urgency: dec.urgency || ai.urgency || "ROUTINE",
            safety_risk: dec.safety_risk || ai.safety_risk || "LOW",
            public_impact: dec.public_impact || ai.public_impact || "LOW",
            response_time: dec.response_time || ai.recommended_response_time || "",
            notes: dec.notes || "",
            override_reason: dec.override_reason || ""
          });

          if (comp.assignment?.department_id) {
            setSelectedDeptId(comp.assignment.department_id);
          }
        }
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to load complaint."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetail();
    adminAPI.getDepartments().then((res) => {
      if (res.data?.departments) setDepartmentsList(res.data.departments);
    });
  }, [id]);

  const showSuccess = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(""), 5000);
  };

  // 1. Mark as Reviewed
  const handleReview = async () => {
    try {
      const res = await adminAPI.reviewComplaint(id);
      if (res.data?.success) {
        showSuccess("Complaint marked as reviewed!");
        fetchDetail();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark reviewed");
    }
  };

  // 2. Accept AI Recommendations
  const handleAcceptAI = () => {
    const ai = complaint.ai_analysis || {};
    setDecisionForm({
      department: ai.department || "",
      secondary_department: ai.secondary_department || "",
      category: ai.category || "",
      subcategory: ai.subcategory || "",
      severity: ai.severity || "MEDIUM",
      priority: ai.priority || "MEDIUM",
      urgency: ai.urgency || "ROUTINE",
      safety_risk: ai.safety_risk || "LOW",
      public_impact: ai.public_impact || "LOW",
      response_time: ai.recommended_response_time || "",
      notes: "Accepted AI automated recommendations.",
      override_reason: ""
    });
    showSuccess("Copied AI predictions into final administrative decision fields.");
  };

  // 3. Save Final Administrative Decision
  const handleSaveDecision = async (e) => {
    e.preventDefault();
    setSubmittingDecision(true);
    try {
      const res = await adminAPI.saveDecision(id, decisionForm);
      if (res.data?.success) {
        showSuccess("Final administrative decision saved.");
        fetchDetail();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save decision.");
    } finally {
      setSubmittingDecision(false);
    }
  };

  // 4. Assign Department
  const handleAssignDepartment = async () => {
    if (!selectedDeptId) {
      alert("Please select a department to assign.");
      return;
    }
    setAssigningDept(true);
    try {
      const res = await adminAPI.assignDepartment(id, { department_id: selectedDeptId });
      if (res.data?.success) {
        showSuccess(res.data.message);
        fetchDetail();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign department.");
    } finally {
      setAssigningDept(false);
    }
  };

  // 5. Update Progress Status
  const handleUpdateProgress = async (e) => {
    e.preventDefault();
    if (!progressDescription.trim()) {
      alert("Please provide a description of the progress update.");
      return;
    }
    setUpdatingProgress(true);
    try {
      const res = await adminAPI.updateProgress(id, {
        status: progressStatus,
        description: progressDescription
      });
      if (res.data?.success) {
        showSuccess("Progress updated and citizen notified.");
        setProgressDescription("");
        fetchDetail();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status.");
    } finally {
      setUpdatingProgress(false);
    }
  };

  // 6. Resolve Complaint
  const handleResolve = async (e) => {
    e.preventDefault();
    if (!resolutionDescription.trim()) {
      alert("Resolution description is required before resolving the complaint.");
      return;
    }
    setResolving(true);
    try {
      const res = await adminAPI.resolveComplaint(id, {
        resolution_description: resolutionDescription
      });
      if (res.data?.success) {
        showSuccess("Complaint resolved successfully! Final email dispatched to citizen.");
        fetchDetail();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to resolve complaint.");
    } finally {
      setResolving(false);
    }
  };

  // 7. Retry Email
  const handleRetryEmail = async (emailLogId) => {
    try {
      const res = await adminAPI.retryEmail(emailLogId);
      if (res.data?.success) {
        showSuccess("Email resent successfully!");
      } else {
        alert(`Email dispatch failed: ${res.data?.error || "Unknown error"}`);
      }
      fetchDetail();
    } catch (err) {
      alert("Failed to retry email dispatch.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="p-8 text-center space-y-4 max-w-lg mx-auto">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">{error || "Complaint not found"}</h2>
        <Link to="/admin/complaints" className="inline-block text-xs font-semibold text-indigo-600 hover:underline">
          &larr; Back to Complaints Queue
        </Link>
      </div>
    );
  }

  const ai = complaint.ai_analysis || {};
  const dec = complaint.admin_decision || {};
  const rev = complaint.review || {};
  const assigned = complaint.assignment || {};
  const resInfo = complaint.resolution || {};

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Back & Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link
          to="/admin/complaints"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Complaints Queue
        </Link>

        {actionSuccess && (
          <div className="p-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center shadow-xs">
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
            {actionSuccess}
          </div>
        )}

        <div className="flex items-center space-x-2">
          {!rev.reviewed && (
            <button
              onClick={handleReview}
              className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition-colors"
            >
              <CheckCheck className="w-4 h-4 mr-1.5" /> Mark as Reviewed
            </button>
          )}
          {rev.reviewed && (
            <span className="inline-flex items-center px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Reviewed by {rev.reviewed_by}
            </span>
          )}
        </div>
      </div>

      {/* MULTI-ISSUE WARNING BANNER */}
      {ai.has_multi_issue && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400 text-amber-900 flex items-start space-x-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Multiple Issues Detected — Manual Review Recommended</p>
            <p className="mt-0.5">
              Citizen complaint covers multiple civic areas: <strong>{ai.department}</strong> and secondary issue <strong>{ai.secondary_department}</strong>. Inter-departmental coordination is recommended.
            </p>
          </div>
        </div>
      )}

      {/* DUPLICATE COMPLAINT BANNER */}
      {ai.similar_complaint_id && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 flex items-start space-x-3 text-xs">
          <Copy className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-sm">Possible Duplicate Complaint Detected</p>
            <p className="mt-0.5">
              High similarity (TF-IDF Cosine Score: <strong>{Math.round((ai.duplicate_score || 0) * 100)}%</strong>) to earlier complaint{" "}
              <Link to={`/admin/complaints/${ai.similar_complaint_id}`} className="font-bold underline text-indigo-700">
                {ai.similar_complaint_id}
              </Link>.
            </p>
            {similarComplaint && (
              <div className="mt-2 p-2.5 bg-white rounded-xl border border-indigo-100 text-[11px] text-slate-700">
                <strong>Similar Case Title:</strong> "{similarComplaint.title}" — Status: <strong>{similarComplaint.status}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. COMPLAINT INFORMATION CARD */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Citizen Public Complaint</span>
            <div className="flex items-center space-x-3 mt-1">
              <span className="font-mono text-xl font-extrabold text-indigo-900">{complaint.complaint_id}</span>
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={dec.priority || ai.priority} />
              <SeverityBadge severity={dec.severity || ai.severity} />
            </div>
          </div>
          <span className="text-xs text-slate-400">
            Received on {new Date(complaint.created_at).toLocaleString()}
          </span>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 leading-tight">
          {complaint.title}
        </h2>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Original Citizen Statement</p>
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
            "{complaint.description}"
          </p>
        </div>

        {/* Citizen & Location Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-600">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Citizen Name</span>
            <p className="font-semibold text-slate-900 mt-0.5">{complaint.citizen_name}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Email</span>
            <p className="font-semibold text-slate-900 mt-0.5 truncate">{complaint.citizen_email}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Phone</span>
            <p className="font-semibold text-slate-900 mt-0.5">{complaint.citizen_phone || "Not provided"}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Location</span>
            <p className="font-semibold text-slate-900 mt-0.5">{complaint.location}</p>
          </div>
        </div>

        {/* Evidence Photos */}
        {complaint.attachments && complaint.attachments.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Citizen Attachments</span>
            <div className="flex flex-wrap gap-3">
              {complaint.attachments.map((att, i) => (
                <a key={i} href={att.url} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-slate-200 hover:opacity-90">
                  <img src={att.url} alt="Attachment" className="h-28 w-28 object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. COMPREHENSIVE AI COMPLAINT ANALYSIS REPORT */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-indigo-100 shadow-sm space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">AI Complaint Analysis Report</h3>
              <p className="text-[11px] text-slate-400">TF-IDF Vectorization + XGBoost Multi-Target Classifiers</p>
            </div>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Validity: {ai.validity || "VALID"}
          </span>
        </div>

        {/* 15+ Core AI Analysis Fields Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Primary Department</span>
            <p className="text-sm font-extrabold text-indigo-900">{ai.department}</p>
            <span className="text-[10px] text-slate-400 block">{ai.prediction_source?.department}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Category</span>
            <p className="text-sm font-bold text-slate-800">{ai.category}</p>
            <span className="text-[10px] text-slate-400 block">{ai.prediction_source?.category}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Subcategory</span>
            <p className="text-sm font-bold text-slate-800">{ai.subcategory}</p>
            <span className="text-[10px] text-slate-400 block">{ai.prediction_source?.subcategory}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Secondary Department</span>
            <p className="text-sm font-semibold text-slate-700">{ai.secondary_department || "None Detected"}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Severity Level</span>
            <div><SeverityBadge severity={ai.severity} /></div>
            <span className="text-[10px] text-slate-400 block">{ai.prediction_source?.severity}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Priority Level</span>
            <div><PriorityBadge priority={ai.priority} /></div>
            <span className="text-[10px] text-slate-400 block">{ai.prediction_source?.priority}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Urgency Window</span>
            <div><UrgencyBadge urgency={ai.urgency} /></div>
            <span className="text-[10px] text-slate-400 block">{ai.prediction_source?.urgency}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Safety Hazard Risk</span>
            <div><SafetyRiskBadge risk={ai.safety_risk} /></div>
            <span className="text-[10px] text-slate-400 block">{ai.prediction_source?.safety_risk}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Public Impact Scale</span>
            <p className="font-bold text-slate-800">{ai.public_impact || "LOW"}</p>
            <span className="text-[10px] text-slate-400 block">Est. Population: ~{ai.affected_count || 50}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Primary Affected Groups</span>
            <div className="flex flex-wrap gap-1">
              {(ai.affected_groups || ["General Public"]).map((g) => (
                <span key={g} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">
                  {g}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Extracted Location</span>
            <p className="font-medium text-slate-800">{ai.location}</p>
            <span className="text-[10px] text-slate-400 block">{ai.prediction_source?.location}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Reported Duration</span>
            <p className="font-medium text-slate-800">{ai.duration}</p>
            <span className="text-[10px] text-slate-400 block">{ai.prediction_source?.duration}</span>
          </div>
        </div>

        {/* AI Confidence Bars (Real Model Probabilities) */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Calibrated Model Confidence Scores
            </span>
            <span className="text-[11px] text-slate-400">Calculated directly from XGBoost predict_proba</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
            <ConfidenceBar label="Department" value={ai.confidence?.department} />
            <ConfidenceBar label="Category" value={ai.confidence?.category} />
            <ConfidenceBar label="Subcategory" value={ai.confidence?.subcategory} />
            <ConfidenceBar label="Severity" value={ai.confidence?.severity} />
            <ConfidenceBar label="Priority" value={ai.confidence?.priority} />
            <ConfidenceBar label="Urgency" value={ai.confidence?.urgency} />
          </div>
        </div>

        {/* AI Summary & Factual Evidence */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider block">Concise AI Summary</span>
            <p className="text-slate-800 leading-relaxed italic">"{ai.summary}"</p>
            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
              Recommended Field Action: <strong className="text-slate-800">{ai.recommended_action}</strong>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider block">Factual Analysis Evidence</span>
            <ul className="space-y-1 text-slate-600 list-disc list-inside">
              {(ai.evidence || []).map((point, idx) => (
                <li key={idx} className="leading-tight">{point}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 3. ADMINISTRATIVE AI REVIEW & FINAL DECISION PANEL */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Administrative Review & Final Decision
            </h3>
            <p className="text-xs text-slate-500">
              Verify, accept, or override AI recommendations. AI model predictions are strictly preserved.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAcceptAI}
            className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 inline mr-1.5 text-indigo-600" />
            Accept AI Recommendations
          </button>
        </div>

        <form onSubmit={handleSaveDecision} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Final Department *</label>
              <select
                value={decisionForm.department}
                onChange={(e) => setDecisionForm({ ...decisionForm, department: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
              >
                {departmentsList.map((d) => (
                  <option key={d.id} value={d.department_name}>{d.department_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Final Severity *</label>
              <select
                value={decisionForm.severity}
                onChange={(e) => setDecisionForm({ ...decisionForm, severity: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Final Priority *</label>
              <select
                value={decisionForm.priority}
                onChange={(e) => setDecisionForm({ ...decisionForm, priority: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
              >
                <option value="URGENT">URGENT</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Target Response Time</label>
              <input
                type="text"
                value={decisionForm.response_time}
                onChange={(e) => setDecisionForm({ ...decisionForm, response_time: e.target.value })}
                placeholder="Within 24 hours"
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 uppercase mb-1">Override Reason (Required if altering AI)</label>
              <input
                type="text"
                value={decisionForm.override_reason}
                onChange={(e) => setDecisionForm({ ...decisionForm, override_reason: e.target.value })}
                placeholder="e.g. Field inspection reveals water contamination hazard nearby"
                className="w-full p-2.5 border border-slate-200 rounded-xl placeholder-slate-400"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block font-bold text-slate-700 uppercase mb-1">Internal Administrative Notes</label>
              <textarea
                rows={2}
                value={decisionForm.notes}
                onChange={(e) => setDecisionForm({ ...decisionForm, notes: e.target.value })}
                placeholder="Internal notes for dispatch team..."
                className="w-full p-2.5 border border-slate-200 rounded-xl placeholder-slate-400"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={submittingDecision}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50"
            >
              {submittingDecision ? "Saving Decision..." : "Save Final Administrative Decision"}
            </button>
          </div>
        </form>
      </div>

      {/* 4. DEPARTMENT DISPATCH & STATUS PROGRESS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Department Assignment */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Official Department Assignment</h3>
          </div>
          <p className="text-xs text-slate-500">
            Selecting a department automatically triggers an official assignment notification email with complete AI diagnostics.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Municipal Department</label>
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white"
              >
                <option value="">Select Responsible Department</option>
                {departmentsList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.department_name} ({d.department_email})
                  </option>
                ))}
              </select>
            </div>

            {assigned.department_name && (
              <div className="p-3 bg-indigo-50 rounded-xl text-xs space-y-1">
                <span className="text-[10px] font-bold text-indigo-900 uppercase">Currently Assigned to:</span>
                <p className="font-bold text-indigo-900">{assigned.department_name}</p>
                <p className="text-[11px] text-indigo-700">Assigned by {assigned.assigned_by} on {new Date(assigned.assigned_at).toLocaleString()}</p>
              </div>
            )}

            <button
              onClick={handleAssignDepartment}
              disabled={assigningDept}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {assigningDept ? "Assigning & Dispatching..." : "Confirm Department Assignment"}
            </button>
          </div>
        </div>

        {/* Progress & Milestone Updates */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <RotateCcw className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Add Progress Milestone</h3>
          </div>
          <p className="text-xs text-slate-500">
            Records updates to the immutable timeline and creates citizen notifications.
          </p>

          <form onSubmit={handleUpdateProgress} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Update Status</label>
              <select
                value={progressStatus}
                onChange={(e) => setProgressStatus(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white"
              >
                <option value="UNDER_REVIEW">UNDER REVIEW</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="ON_HOLD">ON HOLD</option>
                <option value="CLOSED">CLOSED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Progress Description *</label>
              <textarea
                rows={2}
                required
                value={progressDescription}
                onChange={(e) => setProgressDescription(e.target.value)}
                placeholder="e.g. Field inspection team dispatched to site. Materials deployed."
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs placeholder-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={updatingProgress}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {updatingProgress ? "Updating..." : "Post Progress Milestone"}
            </button>
          </form>
        </div>
      </div>

      {/* 5. RESOLUTION PANEL */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-emerald-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-extrabold">Final Case Resolution</h3>
        </div>
        <p className="text-xs text-slate-600">
          To close or resolve a complaint, a clear description of corrective work performed is required. Upon resolution, an official resolution email is dispatched to the citizen.
        </p>

        {complaint.status === "RESOLVED" && resInfo.description ? (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-1 text-emerald-900">
            <span className="font-bold uppercase tracking-wider text-emerald-800">Case Resolved:</span>
            <p className="text-sm font-semibold">{resInfo.description}</p>
            <p className="text-[11px] text-emerald-700">Resolved by {resInfo.resolved_by} on {new Date(resInfo.resolved_at).toLocaleString()}</p>
          </div>
        ) : (
          <form onSubmit={handleResolve} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Resolution Work Description *
              </label>
              <textarea
                rows={3}
                required
                value={resolutionDescription}
                onChange={(e) => setResolutionDescription(e.target.value)}
                placeholder="e.g. Pothole filled and surrounding asphalt resurfaced. Site verified clean and safe by municipal inspector."
                className="w-full p-3 border border-slate-200 rounded-xl text-xs placeholder-slate-400 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={resolving}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {resolving ? "Resolving Case..." : "Mark Resolved & Send Final Notification"}
            </button>
          </form>
        )}
      </div>

      {/* 6. TIMELINE AUDIT HISTORY */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Complaint Progress Timeline</h3>
        <StatusTimeline timeline={timeline} currentStatus={complaint.status} />
      </div>

      {/* 7. DISPATCHED EMAIL LOGS AUDIT */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900 flex items-center">
            <Mail className="w-4 h-4 mr-2 text-indigo-600" />
            Email Dispatch Logs & Idempotency Audit
          </h3>
          <span className="text-xs text-slate-400">{emailLogs.length} attempts recorded</span>
        </div>

        {emailLogs.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">No email dispatches recorded yet for this case.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold">
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Error</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {emailLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{log.email_type}</td>
                    <td className="py-2.5 px-3 text-slate-600">{log.recipient}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.status === "SENT" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {log.sent_at ? new Date(log.sent_at).toLocaleString() : new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-rose-600 text-[11px] max-w-[150px] truncate">
                      {log.error || "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {log.status === "FAILED" && (
                        <button
                          onClick={() => handleRetryEmail(log.id)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold"
                        >
                          Retry Dispatch
                        </button>
                      )}
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
