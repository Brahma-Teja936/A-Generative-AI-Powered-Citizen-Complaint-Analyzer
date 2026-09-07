import React from "react";

export const SeverityBadge = ({ severity }) => {
  const sev = (severity || "LOW").toUpperCase();
  const styles = {
    CRITICAL: "bg-red-500/10 text-red-700 border-red-200",
    HIGH: "bg-orange-500/10 text-orange-700 border-orange-200",
    MEDIUM: "bg-amber-500/10 text-amber-700 border-amber-200",
    LOW: "bg-emerald-500/10 text-emerald-700 border-emerald-200"
  };
  const activeClass = styles[sev] || styles.LOW;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${activeClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {sev}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const pri = (priority || "LOW").toUpperCase();
  const styles = {
    URGENT: "bg-rose-500/10 text-rose-700 border-rose-200 font-bold",
    HIGH: "bg-amber-500/10 text-amber-700 border-amber-200",
    MEDIUM: "bg-blue-500/10 text-blue-700 border-blue-200",
    LOW: "bg-slate-500/10 text-slate-700 border-slate-200"
  };
  const activeClass = styles[pri] || styles.LOW;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${activeClass}`}>
      {pri}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const st = (status || "PENDING").toUpperCase();
  const styles = {
    PENDING: "bg-amber-50 text-amber-800 border-amber-300",
    UNDER_REVIEW: "bg-purple-50 text-purple-800 border-purple-300",
    ASSIGNED: "bg-indigo-50 text-indigo-800 border-indigo-300",
    IN_PROGRESS: "bg-blue-50 text-blue-800 border-blue-300",
    ON_HOLD: "bg-orange-50 text-orange-800 border-orange-300",
    RESOLVED: "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold",
    CLOSED: "bg-slate-100 text-slate-700 border-slate-300",
    REJECTED: "bg-red-50 text-red-800 border-red-300"
  };
  const activeClass = styles[st] || "bg-slate-100 text-slate-700 border-slate-300";

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${activeClass}`}>
      <span className="w-2 h-2 rounded-full bg-current mr-1.5" />
      {st.replace("_", " ")}
    </span>
  );
};

export const UrgencyBadge = ({ urgency }) => {
  const urg = (urgency || "ROUTINE").toUpperCase();
  const styles = {
    IMMEDIATE: "bg-red-100 text-red-800 border-red-300 font-bold",
    "WITHIN 24 HOURS": "bg-orange-100 text-orange-800 border-orange-300",
    "WITHIN 3 DAYS": "bg-amber-100 text-amber-800 border-amber-300",
    "WITHIN 7 DAYS": "bg-blue-100 text-blue-800 border-blue-300",
    ROUTINE: "bg-slate-100 text-slate-700 border-slate-300"
  };
  const activeClass = styles[urg] || styles.ROUTINE;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${activeClass}`}>
      {urg}
    </span>
  );
};

export const SafetyRiskBadge = ({ risk }) => {
  const r = (risk || "LOW").toUpperCase();
  const styles = {
    "VERY HIGH": "bg-red-600 text-white font-bold animate-pulse-subtle",
    HIGH: "bg-orange-500 text-white font-semibold",
    MEDIUM: "bg-amber-500 text-white font-medium",
    LOW: "bg-emerald-500 text-white font-normal",
    NONE: "bg-slate-200 text-slate-700 font-normal"
  };
  const activeClass = styles[r] || styles.LOW;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs tracking-wide shadow-xs ${activeClass}`}>
      {r}
    </span>
  );
};

export const ConfidenceBar = ({ label, value }) => {
  const num = typeof value === "number" ? value : 0;
  const percentage = Math.round(num * 100);

  let barColor = "bg-emerald-500";
  if (percentage < 70) {
    barColor = "bg-red-500";
  } else if (percentage < 85) {
    barColor = "bg-amber-500";
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-600 font-medium">
        <span>{label}</span>
        <span className="font-semibold text-slate-800">{percentage}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
