import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { clientAPI } from "../../services/api";
import {
  UploadCloud,
  FileText,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  X,
  ShieldAlert
} from "lucide-react";

export const NewComplaint = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    category: "",
    incident_date: new Date().toISOString().split("T")[0]
  });

  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successModal, setSuccessModal] = useState(null);

  const categories = [
    "Infrastructure",
    "Water",
    "Electricity",
    "Waste Management",
    "Sanitation",
    "Drainage",
    "Street Lighting",
    "Traffic",
    "Public Safety",
    "Public Health",
    "Parks & Environment",
    "Other"
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (!selected.type.startsWith("image/")) {
        setError("Only image attachments (JPG, PNG, WEBP) are supported.");
        return;
      }
      setFile(selected);
      setFilePreview(URL.createObjectURL(selected));
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Please provide a concise title for your complaint.");
      return;
    }

    if (!formData.description.trim() || formData.description.trim().length < 15) {
      setError("Please describe the issue in more detail (at least 15 characters) so our AI can analyze and route it accurately.");
      return;
    }

    setSubmitting(true);

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("location", formData.location);
      data.append("category", formData.category);
      data.append("incident_date", formData.incident_date);

      if (file) {
        data.append("attachment", file);
      }

      const res = await clientAPI.submitComplaint(data);

      if (res.data && res.data.success) {
        setSuccessModal({
          complaintId: res.data.complaint_id,
          complaint: res.data.complaint
        });
      } else {
        setError(res.data?.message || "Failed to submit complaint.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Server error submitting complaint. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/client/dashboard"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center space-x-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-emerald-200/60">
          <Sparkles className="w-3 h-3 text-emerald-500" />
          <span>Automated AI Triage & Verification</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Submit a Civic Complaint
        </h1>
        <p className="text-slate-500 text-sm">
          Describe the civic issue naturally in your own words. Our AI models will classify department, severity, priority, and route field workers.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-md space-y-6">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Complaint Title *
          </label>
          <input
            type="text"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Large pothole near government school entrance"
            className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400"
          />
        </div>

        {/* Description */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Detailed Description *
            </label>
            <span className="text-[11px] text-slate-400">Describe naturally (location, hazards, duration)</span>
          </div>
          <textarea
            name="description"
            required
            rows={5}
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the condition in detail. For example: There is a large pothole on the main road near the school gate. Vehicles are swerving to avoid it and two scooters fell yesterday. This has been continuing for 3 days."
            className="w-full text-sm p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 leading-relaxed"
          />
        </div>

        {/* Grid: Location & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Specific Location
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. MG Road, opposite City Hospital"
                className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Optional: AI also extracts locations from your description.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Category (Optional — AI Will Auto-Detect)
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="">Let AI analyze and categorize</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Incident Date */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Date / Time of Incident
          </label>
          <div className="relative rounded-xl shadow-xs max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Calendar className="w-4 h-4" />
            </div>
            <input
              type="date"
              name="incident_date"
              value={formData.incident_date}
              onChange={handleChange}
              className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Image Attachment Upload */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Photo / Attachment (Optional)
          </label>

          {!filePreview ? (
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50/20 cursor-pointer transition-colors">
              <UploadCloud className="w-8 h-8 text-indigo-600 mb-2" />
              <span className="text-xs font-semibold text-slate-700">
                Click to upload or drag and drop image
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, or WEBP (up to 16MB)</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          ) : (
            <div className="relative inline-block rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <img src={filePreview} alt="Upload preview" className="max-h-48 rounded-2xl object-cover" />
              <button
                type="button"
                onClick={removeFile}
                className="absolute top-2 right-2 p-1.5 bg-slate-900/80 text-white hover:bg-rose-600 rounded-full transition-colors"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Analyzing with AI & Submitting...
              </>
            ) : (
              <>
                Submit Complaint <CheckCircle2 className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success Modal */}
      {successModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-xl font-extrabold text-slate-900">Complaint Submitted!</h3>
              <p className="text-xs text-slate-500">
                Your complaint has been successfully submitted and analyzed by CivicAI.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Complaint Reference ID:</span>
                <span className="font-mono font-bold text-sm text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100">
                  {successModal.complaintId}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Assigned Department:</span>
                <span className="font-semibold text-slate-800">{successModal.complaint?.department}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Initial Status:</span>
                <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">PENDING</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                An acknowledgement email has been dispatched to your email address.
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                to={`/client/complaints/${successModal.complaintId}`}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs text-center shadow-xs"
              >
                Track Progress
              </Link>
              <Link
                to="/client/dashboard"
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs text-center"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
