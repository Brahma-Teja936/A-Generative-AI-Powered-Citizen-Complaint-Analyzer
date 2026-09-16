import React from "react";
import { CheckCircle2, Clock, CircleDot, AlertCircle } from "lucide-react";

export const StatusTimeline = ({ timeline = [], currentStatus = "PENDING" }) => {
  const steps = [
    { key: "SUBMITTED", label: "Complaint Submitted" },
    { key: "AI_ANALYSIS", label: "AI Analysis Completed" },
    { key: "UNDER_REVIEW", label: "Under Review" },
    { key: "ASSIGNED", label: "Assigned to Department" },
    { key: "IN_PROGRESS", label: "Work in Progress" },
    { key: "RESOLVED", label: "Resolved" }
  ];

  // Map status to active step index
  const getStepIndex = (status) => {
    switch (status) {
      case "PENDING":
        return 1;
      case "UNDER_REVIEW":
        return 2;
      case "ASSIGNED":
        return 3;
      case "IN_PROGRESS":
        return 4;
      case "RESOLVED":
      case "CLOSED":
        return 5;
      default:
        return 1;
    }
  };

  const activeIndex = getStepIndex(currentStatus);

  return (
    <div className="space-y-6">
      {/* High level visual milestone pipeline */}
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full bg-slate-200 -z-0" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-500 -z-0"
          style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, idx) => {
          const isCompleted = idx < activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? "bg-emerald-600 text-white shadow-xs"
                    : isCurrent
                    ? "bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-sm animate-pulse"
                    : "bg-white border-2 border-slate-300 text-slate-400"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isCurrent ? (
                  <CircleDot className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-[10px] font-semibold">{idx + 1}</span>
                )}
              </div>
              <span
                className={`text-[11px] mt-2 font-medium text-center hidden md:block max-w-[90px] ${
                  isCurrent ? "text-indigo-600 font-bold" : isCompleted ? "text-slate-800" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Detailed Chronological Event Log */}
      {timeline.length > 0 && (
        <div className="mt-8 border-t border-slate-100 pt-6">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
            Audit Activity Log
          </h4>
          <div className="space-y-4">
            {timeline.map((event, index) => {
              const dt = event.created_at ? new Date(event.created_at) : null;
              const formattedDate = dt ? dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
              const formattedTime = dt ? dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";

              return (
                <div key={event.id || index} className="flex items-start space-x-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0" />
                  <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-slate-900">{event.status}</span>
                      <span className="text-xs text-slate-400">
                        {formattedDate} at {formattedTime}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed">{event.description}</p>
                    {(event.updated_by || event.department) && (
                      <div className="mt-2 text-[11px] text-slate-500 flex items-center space-x-2">
                        {event.department && <span>Department: <strong className="text-slate-700">{event.department}</strong></span>}
                        {event.updated_by && <span>• By: <strong className="text-slate-700">{event.updated_by}</strong></span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
