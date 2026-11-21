import React from "react";
import { ActionLogItem } from "../hooks/useSession";

interface ActionLogProps {
  logs: ActionLogItem[];
  sessionId: string;
}

export const ActionLog: React.FC<ActionLogProps> = ({ logs, sessionId }) => {
  return (
    <div className="card" style={{ flex: 1, minHeight: "260px" }}>
      <div className="card-title">
        <span>⚡ Agent Action Log</span>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          Session: {sessionId.substring(0, 10)}...
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {logs.length === 0 ? (
          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center", margin: "auto" }}>
            Tool actions and audit events will display here in real time.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              style={{
                background: "#f8fafc",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "0.5rem",
                fontSize: "0.75rem"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                <span style={{ fontWeight: 700, color: "var(--primary)" }}>{log.tool}</span>
                <span style={{ color: "#94a3b8" }}>{log.timestamp}</span>
              </div>
              {log.args && Object.keys(log.args).length > 0 && (
                <div style={{ color: "#475569", fontFamily: "monospace", fontSize: "0.7rem" }}>
                  args: {JSON.stringify(log.args)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
