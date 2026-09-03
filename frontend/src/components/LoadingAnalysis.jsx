import React, { useState, useEffect } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";

export const LoadingAnalysis = () => {
  const steps = [
    "Processing complaint",
    "Cleaning text",
    "Extracting features",
    "Classifying department",
    "Determining severity",
    "Determining priority",
    "Generating summary"
  ];

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 280);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "2rem 2.5rem",
          maxWidth: "480px",
          width: "90%",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          textAlign: "left"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              backgroundColor: "#eff6ff",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Sparkles size={24} className="animate-spin-slow" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a", fontWeight: "700" }}>
              AI is analyzing your complaint...
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
              TF-IDF feature extraction & XGBoost classification
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {steps.map((step, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div
                key={step}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "0.92rem",
                  color: isDone ? "#059669" : isCurrent ? "#2563eb" : "#94a3b8",
                  fontWeight: isCurrent || isDone ? "600" : "400",
                  transition: "all 0.25s ease"
                }}
              >
                {isDone ? (
                  <CheckCircle2 size={18} color="#059669" />
                ) : isCurrent ? (
                  <Loader2 size={18} color="#2563eb" className="animate-spin" />
                ) : (
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      border: "2px solid #cbd5e1"
                    }}
                  />
                )}
                <span>{step}</span>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #f1f5f9" }}>
          <div
            style={{
              height: "6px",
              width: "100%",
              backgroundColor: "#f1f5f9",
              borderRadius: "9999px",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${((currentStep + 1) / steps.length) * 100}%`,
                backgroundColor: "#2563eb",
                borderRadius: "9999px",
                transition: "width 0.3s ease"
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
