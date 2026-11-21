import React from "react";
import { SessionData } from "../hooks/useSession";

interface FormPanelProps {
  serviceConfig: any;
  sessionData: SessionData | null;
  language: string;
  activeFieldId: string | null;
  onFieldChange: (fieldId: string, value: string) => void;
  onRequestSubmit: () => void;
}

export const FormPanel: React.FC<FormPanelProps> = ({
  serviceConfig,
  sessionData,
  language,
  activeFieldId,
  onFieldChange,
  onRequestSubmit
}) => {
  if (!serviceConfig) return <div className="card">Loading service form...</div>;

  const fields = serviceConfig.fields || [];
  const formData = sessionData?.form_data || {};
  const missing = sessionData?.missing;

  return (
    <div className="card" style={{ height: "calc(100vh - 120px)", overflowY: "auto" }}>
      <div className="card-title">
        <div>
          <span>{serviceConfig.title?.[language] || serviceConfig.title?.en}</span>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "normal", marginTop: "0.2rem" }}>
            {serviceConfig.department?.[language] || serviceConfig.department?.en}
          </div>
        </div>
        {missing && (
          <span
            style={{
              fontSize: "0.8rem",
              padding: "0.25rem 0.6rem",
              borderRadius: "999px",
              background: missing.is_complete ? "#d1fae5" : "#fee2e2",
              color: missing.is_complete ? "#065f46" : "#991b1b",
              fontWeight: 600
            }}
          >
            {missing.is_complete ? "Complete" : `${missing.missing_fields.length} missing`}
          </span>
        )}
      </div>

      <div style={{ flex: 1 }}>
        {fields.map((field: any) => {
          const currentEntry = formData[field.id];
          const currentValue = currentEntry ? currentEntry.value : "";
          const source = currentEntry?.source;
          const isHighlighted = activeFieldId === field.id;

          return (
            <div key={field.id} className="form-field">
              <label className="form-label">
                <span>{field.label?.[language] || field.label?.en}</span>
                {field.required && <span style={{ color: "red", marginLeft: "2px" }}>*</span>}
                {source && (
                  <span className={`field-badge badge-${source}`}>
                    {source}
                  </span>
                )}
              </label>

              {field.type === "select" && field.options ? (
                <select
                  className={`form-input ${isHighlighted ? "field-highlight" : ""}`}
                  value={currentValue || ""}
                  onChange={(e) => onFieldChange(field.id, e.target.value)}
                >
                  <option value="">-- Select --</option>
                  {field.options.map((opt: string) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type === "date" ? "date" : "text"}
                  className={`form-input ${isHighlighted ? "field-highlight" : ""}`}
                  value={currentValue || ""}
                  placeholder={field.hint?.[language] || field.hint?.en || ""}
                  onChange={(e) => onFieldChange(field.id, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
        <button
          onClick={onRequestSubmit}
          style={{
            width: "100%",
            background: missing?.is_complete ? "var(--success)" : "var(--primary)",
            color: "white",
            padding: "0.75rem",
            borderRadius: "8px",
            border: "none",
            fontWeight: 600,
            fontSize: "1rem",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          {missing?.is_complete ? "Review & Confirm Application" : "Check Form & Review"}
        </button>
      </div>
    </div>
  );
};
