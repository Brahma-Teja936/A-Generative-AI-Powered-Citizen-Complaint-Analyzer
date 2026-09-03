import React from "react";
import { Check, Clock, CircleDot, AlertCircle } from "lucide-react";

export const StatusTimeline = ({ currentStatus = "Pending" }) => {
  const steps = [
    { key: "Submitted", label: "Submitted", desc: "Complaint received" },
    { key: "AI Analyzed", label: "AI Analyzed", desc: "Classified & dispatched" },
    { key: "Assigned", label: "Assigned", desc: "Designated to department" },
    { key: "In Progress", label: "In Progress", desc: "Work order underway" },
    { key: "Resolved", label: "Resolved", desc: "Civic resolution complete" }
  ];

  // Determine active step index
  let activeIndex = 0;
  if (currentStatus === "Pending") activeIndex = 1; // It has already been submitted & AI analyzed
  else if (currentStatus === "Assigned") activeIndex = 2;
  else if (currentStatus === "In Progress") activeIndex = 3;
  else if (currentStatus === "Resolved") activeIndex = 4;
  else if (currentStatus === "Rejected") activeIndex = -1;

  if (currentStatus === "Rejected") {
    return (
      <div
        style={{
          padding: "1rem",
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          color: "#991b1b"
        }}
      >
        <AlertCircle size={24} />
        <div>
          <strong style={{ display: "block" }}>Complaint Status: Rejected</strong>
          <span style={{ fontSize: "0.85rem" }}>
            This complaint was evaluated and determined to be outside municipal jurisdiction or duplicate.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
        {/* Background connector line */}
        <div
          style={{
            position: "absolute",
            top: "18px",
            left: "5%",
            right: "5%",
            height: "3px",
            backgroundColor: "#e2e8f0",
            zIndex: 1
          }}
        />

        {/* Completed connector fill */}
        <div
          style={{
            position: "absolute",
            top: "18px",
            left: "5%",
            width: `${(activeIndex / (steps.length - 1)) * 90}%`,
            height: "3px",
            backgroundColor: "#2563eb",
            zIndex: 2,
            transition: "width 0.6s ease"
          }}
        />

        {steps.map((step, idx) => {
          const isCompleted = idx < activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <div
              key={step.key}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                zIndex: 3,
                width: "18%"
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isCompleted ? "#2563eb" : isCurrent ? "#3b82f6" : "#ffffff",
                  color: isCompleted || isCurrent ? "#ffffff" : "#94a3b8",
                  border: isCompleted || isCurrent ? "2px solid #2563eb" : "2px solid #cbd5e1",
                  boxShadow: isCurrent ? "0 0 0 4px rgba(37, 99, 235, 0.2)" : "none",
                  transition: "all 0.3s ease"
                }}
              >
                {isCompleted ? (
                  <Check size={18} strokeWidth={3} />
                ) : isCurrent ? (
                  <CircleDot size={18} />
                ) : (
                  <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>{idx + 1}</span>
                )}
              </div>

              <span
                style={{
                  marginTop: "8px",
                  fontSize: "0.82rem",
                  fontWeight: isCurrent ? "700" : "600",
                  color: isCurrent ? "#1e293b" : isCompleted ? "#334155" : "#94a3b8",
                  textAlign: "center"
                }}
              >
                {step.label}
              </span>
              <span
                style={{
                  fontSize: "0.7rem",
                  color: "#64748b",
                  textAlign: "center",
                  display: "none"
                }}
              >
                {step.desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
