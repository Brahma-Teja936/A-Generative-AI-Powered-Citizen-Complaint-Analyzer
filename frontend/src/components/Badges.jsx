import React from "react";
import { AlertTriangle, ShieldAlert, CheckCircle2, Clock, Activity, ArrowUpRight } from "lucide-react";

export const SeverityBadge = ({ severity }) => {
  const s = (severity || "LOW").toUpperCase();

  const styles = {
    LOW: {
      bg: "#f1f5f9",
      text: "#475569",
      border: "#cbd5e1",
      icon: <Activity size={13} style={{ marginRight: "4px" }} />
    },
    MEDIUM: {
      bg: "#fef3c7",
      text: "#92400e",
      border: "#fcd34d",
      icon: <AlertTriangle size={13} style={{ marginRight: "4px" }} />
    },
    HIGH: {
      bg: "#ffedd5",
      text: "#c2410c",
      border: "#fdba74",
      icon: <AlertTriangle size={13} style={{ marginRight: "4px" }} />
    },
    CRITICAL: {
      bg: "#fee2e2",
      text: "#b91c1c",
      border: "#fca5a5",
      icon: <ShieldAlert size={13} style={{ marginRight: "4px" }} />
    }
  };

  const style = styles[s] || styles.LOW;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: "700",
        letterSpacing: "0.04em",
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        whiteSpace: "nowrap"
      }}
    >
      {style.icon}
      {s}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const p = (priority || "LOW").toUpperCase();

  const styles = {
    LOW: { bg: "#f8fafc", text: "#64748b", border: "#e2e8f0" },
    MEDIUM: { bg: "#e0f2fe", text: "#0369a1", border: "#bae6fd" },
    HIGH: { bg: "#ede9fe", text: "#6d28d9", border: "#ddd6fe" },
    URGENT: { bg: "#ffe4e6", text: "#be123c", border: "#fecdd3" }
  };

  const style = styles[p] || styles.LOW;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: "6px",
        fontSize: "0.75rem",
        fontWeight: "700",
        letterSpacing: "0.03em",
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        whiteSpace: "nowrap"
      }}
    >
      <ArrowUpRight size={13} style={{ marginRight: "3px" }} />
      {p}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const st = status || "Pending";

  const config = {
    Pending: {
      bg: "#fffbeb",
      text: "#b45309",
      border: "#fde68a",
      icon: <Clock size={13} style={{ marginRight: "4px" }} />
    },
    Assigned: {
      bg: "#eff6ff",
      text: "#1d4ed8",
      border: "#bfdbfe",
      icon: <Activity size={13} style={{ marginRight: "4px" }} />
    },
    "In Progress": {
      bg: "#f5f3ff",
      text: "#6d28d9",
      border: "#ddd6fe",
      icon: <Activity size={13} style={{ marginRight: "4px" }} />
    },
    Resolved: {
      bg: "#ecfdf5",
      text: "#047857",
      border: "#a7f3d0",
      icon: <CheckCircle2 size={13} style={{ marginRight: "4px" }} />
    },
    Rejected: {
      bg: "#fef2f2",
      text: "#b91c1c",
      border: "#fecaca",
      icon: <AlertTriangle size={13} style={{ marginRight: "4px" }} />
    }
  };

  const c = config[st] || config.Pending;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 11px",
        borderRadius: "9999px",
        fontSize: "0.78rem",
        fontWeight: "600",
        backgroundColor: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        whiteSpace: "nowrap"
      }}
    >
      {c.icon}
      {st}
    </span>
  );
};
