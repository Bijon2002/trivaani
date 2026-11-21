import React from "react";
import { Landmark } from "lucide-react";

interface HeaderProps {
  language: string;
  onLanguageChange: (lang: string) => void;
  serviceId: string;
  onServiceChange: (serviceId: string) => void;
  availableServices: Array<{ service_id: string; title: any; is_illustrative?: boolean }>;
  simpleMode: boolean;
  onToggleSimpleMode: () => void;
  isConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  serviceId,
  onServiceChange,
  availableServices,
  simpleMode,
  onToggleSimpleMode,
  isConnected
}) => {
  return (
    <header className="app-header">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div className="brand-title">
          <Landmark size={24} color="#FFBE29" />
          <span>Trivaani</span>
          <span className="brand-badge">DevFest 2026</span>
        </div>
        <select
          value={serviceId}
          onChange={(e) => onServiceChange(e.target.value)}
          style={{
            background: "rgba(255, 255, 255, 0.15)",
            color: "white",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            padding: "0.35rem 0.75rem",
            borderRadius: "6px",
            fontSize: "0.85rem",
            cursor: "pointer"
          }}
        >
          {availableServices.map((svc) => (
            <option key={svc.service_id} value={svc.service_id} style={{ color: "black" }}>
              {svc.is_illustrative ? "[Illustrative] " : ""}
              {svc.title?.[language] || svc.title?.en || svc.service_id}
            </option>
          ))}
        </select>
      </div>

      <div className="header-controls">
        <div style={{ display: "flex", gap: "0.3rem" }}>
          <button
            className={`btn-lang ${language === "en" ? "active" : ""}`}
            onClick={() => onLanguageChange("en")}
          >
            English
          </button>
          <button
            className={`btn-lang ${language === "si" ? "active" : ""}`}
            onClick={() => onLanguageChange("si")}
          >
            සිංහල
          </button>
          <button
            className={`btn-lang ${language === "ta" ? "active" : ""}`}
            onClick={() => onLanguageChange("ta")}
          >
            தமிழ்
          </button>
        </div>

        <button
          className="btn-mode"
          onClick={onToggleSimpleMode}
          style={{ background: simpleMode ? "#FFBE29" : "rgba(255, 255, 255, 0.2)", color: simpleMode ? "#002244" : "white", fontWeight: simpleMode ? "bold" : "normal" }}
        >
          {simpleMode ? "Standard Mode" : "Simple Mode"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: isConnected ? "#10b981" : "#f59e0b"
            }}
          />
          <span>{isConnected ? "Live Voice" : "Ready"}</span>
        </div>
      </div>
    </header>
  );
};
