import React from "react";

export const ConfidenceBar = ({ label, value, color = "#2563eb" }) => {
  // Value is expected to be either decimal (0.94) or integer (94)
  const percent = Math.round(value <= 1.0 ? value * 100 : value);

  let barColor = color;
  if (!color || color === "auto") {
    if (percent >= 85) barColor = "#10b981"; // Green
    else if (percent >= 70) barColor = "#3b82f6"; // Blue
    else if (percent >= 50) barColor = "#f59e0b"; // Orange/Amber
    else barColor = "#ef4444"; // Red
  }

  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#475569" }}>{label}</span>
        <span style={{ fontSize: "0.85rem", fontWeight: "700", color: barColor }}>{percent}%</span>
      </div>
      <div
        style={{
          width: "100%",
          height: "8px",
          backgroundColor: "#e2e8f0",
          borderRadius: "9999px",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            width: `${Math.min(100, Math.max(5, percent))}%`,
            height: "100%",
            backgroundColor: barColor,
            borderRadius: "9999px",
            transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
        />
      </div>
    </div>
  );
};
