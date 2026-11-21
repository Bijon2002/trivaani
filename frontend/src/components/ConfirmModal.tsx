import React from "react";
import { CheckCircle2, ClipboardCheck, Check, Send, X, PartyPopper } from "lucide-react";
import { SessionData } from "../hooks/useSession";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: SessionData | null;
  serviceConfig: any;
  language: string;
  onConfirm: () => void;
  onSubmit: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  sessionData,
  serviceConfig,
  language,
  onConfirm,
  onSubmit
}) => {
  if (!isOpen || !sessionData) return null;

  const formData = sessionData.form_data || {};
  const fields = serviceConfig?.fields || [];
  const isConfirmed = sessionData.confirmed;
  const isSubmitted = sessionData.submitted;
  const submissionId = sessionData.submission_id;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "620px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.25rem", color: "#003366", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {isSubmitted ? (
              <>
                <CheckCircle2 size={22} color="#10b981" />
                <span>Application Submitted!</span>
              </>
            ) : (
              <>
                <ClipboardCheck size={22} color="#003366" />
                <span>Citizen Review & Confirmation</span>
              </>
            )}
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
          >
            <X size={20} />
          </button>
        </div>

        {isSubmitted ? (
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}>
              <PartyPopper size={48} color="#10b981" />
            </div>
            <h3 style={{ color: "#003366", marginBottom: "0.5rem" }}>
              Successfully Submitted
            </h3>
            <p style={{ color: "#475569", marginBottom: "1rem" }}>
              Your application has been received by the Registrar General's Department.
            </p>
            <div
              style={{
                background: "#f1f5f9",
                padding: "0.75rem",
                borderRadius: "8px",
                display: "inline-block",
                fontWeight: 700,
                fontSize: "1.1rem",
                color: "#0f172a",
                letterSpacing: "1px"
              }}
            >
              Tracking Ref: {submissionId}
            </div>
            <div style={{ marginTop: "1.5rem" }}>
              <button
                onClick={onClose}
                style={{
                  background: "#003366",
                  color: "white",
                  padding: "0.7rem 1.5rem",
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <p style={{ color: "#475569", fontSize: "0.85rem", marginBottom: "1rem" }}>
              Please review all entries before submitting. In accordance with safety guardrails,
              the AI assistant cannot finalize your application without your explicit confirmation.
            </p>

            <div
              style={{
                background: "#f8fafc",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "0.75rem",
                maxHeight: "280px",
                overflowY: "auto",
                marginBottom: "1.25rem"
              }}
            >
              {fields.map((f: any) => {
                const val = formData[f.id]?.value;
                return (
                  <div
                    key={f.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "0.35rem 0",
                      borderBottom: "1px solid #edf2f7",
                      fontSize: "0.85rem"
                    }}
                  >
                    <span style={{ color: "#64748b" }}>{f.label?.[language] || f.label?.en}:</span>
                    <span style={{ fontWeight: 600, color: val ? "#0f172a" : "#ef4444" }}>
                      {val || "Not provided"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              {!isConfirmed ? (
                <button
                  onClick={onConfirm}
                  style={{
                    flex: 1,
                    background: "#0284c7",
                    color: "white",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem"
                  }}
                >
                  <Check size={18} />
                  <span>Confirm Details Are Accurate</span>
                </button>
              ) : (
                <button
                  onClick={onSubmit}
                  style={{
                    flex: 1,
                    background: "#10b981",
                    color: "white",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem"
                  }}
                >
                  <Send size={18} />
                  <span>Submit Application Now</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
