import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { LoadingAnalysis } from "../components/LoadingAnalysis";
import { ConfidenceBar } from "../components/ConfidenceBar";
import { SeverityBadge, PriorityBadge } from "../components/Badges";
import {
  FileText,
  UploadCloud,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  Edit3,
  HelpCircle
} from "lucide-react";

export const SubmitComplaint = () => {
  const navigate = useNavigate();

  // Mode: "FORM" or "REVIEW"
  const [stage, setStage] = useState("FORM");

  // Inputs
  const [complaintText, setComplaintText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageDescription, setImageDescription] = useState("");

  // Analysis Result
  const [analysisResult, setAnalysisResult] = useState(null);

  // States
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // Character counter
  const charCount = complaintText.length;
  const minChars = 10;
  const maxChars = 2000;

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage("Invalid file format. Please upload JPG, PNG, or WEBP images.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("File size exceeds 10MB limit. Please upload a smaller image.");
      return;
    }

    setErrorMessage("");
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // 1. Analyze Complaint (ML pipeline)
  const handleAnalyze = async () => {
    setErrorMessage("");

    // Use text complaint or image description
    const textToAnalyze = complaintText.trim() || imageDescription.trim();

    if (!textToAnalyze) {
      setErrorMessage("Please enter a complaint description to analyze.");
      return;
    }

    if (textToAnalyze.length < minChars) {
      setErrorMessage(`Please describe the issue with at least ${minChars} characters.`);
      return;
    }

    try {
      setAnalyzing(true);
      const res = await API.post("/api/complaints/analyze", {
        complaint_text: textToAnalyze
      });

      if (res.data.success) {
        setAnalysisResult(res.data);
        setStage("REVIEW");
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "AI Analysis failed. Make sure backend is running."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // 2. Final Submit to PostgreSQL + Department Email
  const handleFinalSubmit = async () => {
    if (!analysisResult) return;

    try {
      setSubmitting(true);
      setErrorMessage("");

      const effectiveText = complaintText.trim() || imageDescription.trim();

      // Check if image file attached -> use multipart/form-data
      if (imageFile) {
        const formData = new FormData();
        formData.append("description", effectiveText);
        formData.append("department", analysisResult.department);
        formData.append("severity", analysisResult.severity);
        formData.append("priority", analysisResult.priority);
        formData.append("summary", analysisResult.summary);
        formData.append("confidence_department", analysisResult.confidence.department);
        formData.append("confidence_severity", analysisResult.confidence.severity);
        formData.append("confidence_priority", analysisResult.confidence.priority);
        formData.append("image", imageFile);

        const res = await API.post("/api/complaints", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });

        if (res.data.success) {
          setToastMessage("Complaint submitted successfully! Department notified.");
          setTimeout(() => {
            navigate(`/complaints/${res.data.complaint.id}`);
          }, 1000);
        }
      } else {
        const payload = {
          description: effectiveText,
          department: analysisResult.department,
          severity: analysisResult.severity,
          priority: analysisResult.priority,
          summary: analysisResult.summary,
          confidence_department: analysisResult.confidence.department,
          confidence_severity: analysisResult.confidence.severity,
          confidence_priority: analysisResult.confidence.priority
        };

        const res = await API.post("/api/complaints", payload);
        if (res.data.success) {
          setToastMessage("Complaint submitted successfully! Department notified.");
          setTimeout(() => {
            navigate(`/complaints/${res.data.complaint.id}`);
          }, 1000);
        }
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditBack = () => {
    setStage("FORM");
  };

  return (
    <div className="citizen-page-container">
      {analyzing && <LoadingAnalysis />}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          <CheckCircle2 size={20} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: "2rem", textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            borderRadius: "9999px",
            backgroundColor: "#eff6ff",
            color: "#2563eb",
            fontSize: "0.85rem",
            fontWeight: "700",
            marginBottom: "0.75rem"
          }}
        >
          <Sparkles size={16} />
          <span>Intelligent Civic Complaint Intake</span>
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a", margin: "0 0 0.5rem" }}>
          Submit a Civic Complaint
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.95rem", maxWidth: "600px", margin: "0 auto" }}>
          Provide the details of the municipal issue. Our Machine Learning models will classify the department,
          urgency, and automatically dispatch it to the appropriate city engineers.
        </p>
      </div>

      {errorMessage && (
        <div className="auth-error-banner" style={{ marginBottom: "1.5rem" }}>
          <AlertCircle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      {stage === "FORM" ? (
        /* Dual Cards Layout: Text Complaint & Image Complaint */
        <div className="submit-grid">
          {/* Card 1: TEXT COMPLAINT */}
          <div className="submission-card">
            <div className="submission-card-header">
              <div className="card-icon-pill" style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}>
                <FileText size={20} />
              </div>
              <div>
                <h2 className="submission-card-title">TEXT COMPLAINT</h2>
                <p className="submission-card-subtitle">Describe the civic grievance with location context</p>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Complaint Description *</span>
                <span style={{ fontSize: "0.78rem", color: charCount > maxChars ? "#ef4444" : "#94a3b8" }}>
                  {charCount} / {maxChars} characters
                </span>
              </label>
              <textarea
                className="complaint-textarea"
                rows={8}
                placeholder="Example: There is a huge pothole near the college entrance and vehicles are almost falling. Urgent repair needed before accidents occur..."
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                maxLength={maxChars}
              />
            </div>

            <div style={{ marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing || (!complaintText.trim() && !imageDescription.trim())}
                className="btn-analyze-complaint"
              >
                <Sparkles size={18} />
                <span>Analyze Complaint</span>
              </button>
            </div>
          </div>

          {/* Card 2: IMAGE COMPLAINT */}
          <div className="submission-card">
            <div className="submission-card-header">
              <div className="card-icon-pill" style={{ backgroundColor: "#f0fdf4", color: "#16a34a" }}>
                <ImageIcon size={20} />
              </div>
              <div>
                <h2 className="submission-card-title">IMAGE COMPLAINT</h2>
                <p className="submission-card-subtitle">Upload visual proof of the civic problem</p>
              </div>
            </div>

            {!imagePreview ? (
              <label className="image-dropzone">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
                <UploadCloud size={44} color="#94a3b8" />
                <span style={{ fontWeight: "600", color: "#334155", marginTop: "10px" }}>
                  Click to browse or drop an image
                </span>
                <span style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>
                  Supports JPG, JPEG, PNG, WEBP (Max 10MB)
                </span>
              </label>
            ) : (
              <div className="image-preview-wrapper">
                <img src={imagePreview} alt="Complaint preview" className="image-preview-display" />
                <button type="button" onClick={removeImage} className="btn-remove-image" title="Remove image">
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="form-group" style={{ marginTop: "1.2rem" }}>
              <label className="form-label">Optional Image Description / Landmark</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Opposite Metro Pillar #124, North Gate"
                value={imageDescription}
                onChange={(e) => setImageDescription(e.target.value)}
              />
            </div>

            <div
              style={{
                marginTop: "1.2rem",
                padding: "12px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.8rem",
                color: "#64748b"
              }}
            >
              <HelpCircle size={16} color="#3b82f6" />
              <span>Images are stored securely with your complaint record for field inspections.</span>
            </div>
          </div>
        </div>
      ) : (
        /* Analysis Result Screen (Section 18) */
        <div className="analysis-result-container">
          <div className="analysis-result-card">
            {/* Header */}
            <div className="result-header">
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  backgroundColor: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Sparkles size={26} />
              </div>
              <div>
                <span className="result-tag">MACHINE LEARNING EVALUATION</span>
                <h2 className="result-title">AI COMPLAINT ANALYSIS</h2>
                <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.88rem" }}>
                  Review predictions before final submission into PostgreSQL and email dispatch.
                </p>
              </div>
            </div>

            {/* Grid of Results */}
            <div className="result-summary-grid">
              <div className="result-field-box">
                <span className="result-field-label">Assigned Department</span>
                <div className="result-field-value" style={{ color: "#1e3a8a" }}>
                  {analysisResult.department}
                </div>
              </div>

              <div className="result-field-box">
                <span className="result-field-label">Severity Level</span>
                <div style={{ marginTop: "6px" }}>
                  <SeverityBadge severity={analysisResult.severity} />
                </div>
              </div>

              <div className="result-field-box">
                <span className="result-field-label">Calculated Priority</span>
                <div style={{ marginTop: "6px" }}>
                  <PriorityBadge priority={analysisResult.priority} />
                </div>
              </div>
            </div>

            {/* AI Summary */}
            <div className="result-summary-box">
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <CheckCircle2 size={18} color="#2563eb" />
                <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "0.95rem" }}>
                  AI Complaint Summary
                </span>
              </div>
              <p style={{ margin: 0, color: "#334155", lineHeight: "1.6", fontSize: "0.95rem" }}>
                {analysisResult.summary}
              </p>
            </div>

            {/* Original Complaint Preview */}
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                marginBottom: "1.5rem"
              }}
            >
              <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                Original Complaint Text:
              </span>
              <p style={{ margin: "6px 0 0", fontStyle: "italic", color: "#1e293b" }}>
                "{complaintText.trim() || imageDescription.trim()}"
              </p>
              {imagePreview && (
                <div style={{ marginTop: "12px" }}>
                  <img
                    src={imagePreview}
                    alt="Attached proof"
                    style={{ maxHeight: "140px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              )}
            </div>

            {/* Confidence Progress Bars */}
            <div className="confidence-section">
              <h4 style={{ margin: "0 0 12px", fontSize: "0.9rem", color: "#475569", fontWeight: "700" }}>
                MODEL CONFIDENCE METRICS
              </h4>
              <ConfidenceBar
                label="Department Classification"
                value={analysisResult.confidence.department}
                color="auto"
              />
              <ConfidenceBar
                label="Severity Detection"
                value={analysisResult.confidence.severity}
                color="auto"
              />
              <ConfidenceBar
                label="Priority Determination"
                value={analysisResult.confidence.priority}
                color="auto"
              />
            </div>

            {/* Actions */}
            <div className="result-actions">
              <button
                type="button"
                onClick={handleEditBack}
                className="btn-secondary-action"
                disabled={submitting}
              >
                <Edit3 size={17} />
                <span>Edit Complaint</span>
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="btn-primary-action"
                disabled={submitting}
                style={{ padding: "0.75rem 2rem", fontSize: "1rem" }}
              >
                {submitting ? (
                  <span>Submitting to Database...</span>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Submit Complaint</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
