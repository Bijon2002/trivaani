import React, { useRef, useState } from "react";
import { SessionData } from "../hooks/useSession";

interface DocumentScannerProps {
  serviceConfig: any;
  sessionData: SessionData | null;
  language: string;
  onUploadDocument: (docType: string, file: File) => Promise<any>;
}

export const DocumentScanner: React.FC<DocumentScannerProps> = ({
  serviceConfig,
  sessionData,
  language,
  onUploadDocument
}) => {
  const [selectedDocType, setSelectedDocType] = useState<string>("applicant_nic");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastScanResult, setLastScanResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const docs = serviceConfig?.required_documents || [];
  const uploaded = sessionData?.uploaded_documents || [];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const result = await onUploadDocument(selectedDocType, file);
    setIsScanning(false);
    setLastScanResult(result);
  };

  const handleScanSampleNIC = async () => {
    // Generate synthetic dummy image for instant testing in demo script
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 250;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(0, 0, 400, 250);
      ctx.fillStyle = "#003366";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("SRI LANKA NATIONAL IDENTITY CARD", 30, 40);
      ctx.fillStyle = "#1e293b";
      ctx.font = "14px sans-serif";
      ctx.fillText("NIC: 199512345678", 30, 90);
      ctx.fillText("Name: Kasun Perera", 30, 130);
      ctx.fillText("DOB: 1995-05-12", 30, 170);
      ctx.fillText("Address: Colombo", 30, 210);
    }

    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], "synthetic_sample_nic.png", { type: "image/png" });
        setIsScanning(true);
        const result = await onUploadDocument("applicant_nic", file);
        setIsScanning(false);
        setLastScanResult(result);
      }
    });
  };

  return (
    <div className="card" style={{ marginBottom: "1.5rem" }}>
      <div className="card-title">
        <span>📷 Supporting Documents</span>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          Gemini Vision OCR
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {docs.map((doc: any) => {
          const isUploaded = uploaded.includes(doc.doc_type);
          return (
            <div
              key={doc.doc_type}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.6rem 0.8rem",
                borderRadius: "8px",
                background: isUploaded ? "#ecfdf5" : "#f8fafc",
                border: `1px solid ${isUploaded ? "#10b981" : "#e2e8f0"}`
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#1e293b" }}>
                  {doc.title?.[language] || doc.title?.en}
                  {doc.mandatory && <span style={{ color: "red", marginLeft: "2px" }}>*</span>}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {isUploaded ? "Verified with Vision" : (doc.description?.[language] || doc.description?.en)}
                </div>
              </div>

              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px",
                  background: isUploaded ? "#d1fae5" : "#e2e8f0",
                  color: isUploaded ? "#065f46" : "#64748b",
                  fontWeight: 600
                }}
              >
                {isUploaded ? "Uploaded" : "Pending"}
              </span>
            </div>
          );
        })}

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
          <select
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value)}
            style={{
              flex: 1,
              padding: "0.4rem",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              fontSize: "0.85rem"
            }}
          >
            {docs.map((d: any) => (
              <option key={d.doc_type} value={d.doc_type}>
                {d.title?.[language] || d.title?.en}
              </option>
            ))}
          </select>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="image/*"
            onChange={handleFileChange}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            style={{
              background: "var(--primary)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "0.4rem 0.8rem",
              fontSize: "0.85rem",
              cursor: "pointer"
            }}
          >
            {isScanning ? "Scanning..." : "Upload Photo"}
          </button>

          <button
            onClick={handleScanSampleNIC}
            disabled={isScanning}
            style={{
              background: "#0284c7",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "0.4rem 0.6rem",
              fontSize: "0.8rem",
              cursor: "pointer"
            }}
            title="Scan synthetic NIC test sample"
          >
            Demo Sample
          </button>
        </div>

        {lastScanResult && lastScanResult.extracted_fields && (
          <div style={{ marginTop: "0.5rem", padding: "0.6rem", background: "#f8fafc", borderRadius: "6px", fontSize: "0.8rem" }}>
            <span style={{ fontWeight: 600, color: "#0369a1" }}>Extracted with Vision:</span>
            <ul style={{ paddingLeft: "1.2rem", marginTop: "0.3rem" }}>
              {Object.entries(lastScanResult.extracted_fields).map(([k, v]) => (
                <li key={k}>{k}: <strong>{String(v)}</strong></li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
