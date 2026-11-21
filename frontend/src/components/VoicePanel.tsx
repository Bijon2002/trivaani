import React, { useState } from "react";
import { Mic, Square, Send } from "lucide-react";
import { ChatMessage } from "../hooks/useSession";

interface VoicePanelProps {
  conversation: ChatMessage[];
  isRecording: boolean;
  onToggleRecording: () => void;
  onSendText: (text: string) => void;
  language: string;
}

export const VoicePanel: React.FC<VoicePanelProps> = ({
  conversation,
  isRecording,
  onToggleRecording,
  onSendText,
  language
}) => {
  const [inputText, setInputText] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendText(inputText.trim());
      setInputText("");
    }
  };

  const sampleUtterances = {
    en: [
      "My name is Kasun Perera.",
      "Birth date is 1995-05-12, Colombo district.",
      "Mother is Sunethra Silva, reason is passport.",
      "Check missing and submit."
    ],
    si: [
      "මගේ නම කසුන් පෙරේරා.",
      "උපන් දිනය 1995-05-12, දිස්ත්‍රික්කය කොළඹ.",
      "මව සුනේත්‍රා සිල්වා, අවශ්‍යතාවය පාස්පෝට්.",
      "අයදුම්පත පරීක්ෂා කර ඉදිරිපත් කරන්න."
    ],
    ta: [
      "என் பெயர் கசுன் பெரேரா.",
      "பிறந்த திகதி 1995-05-12, மாவட்டம் கொழும்பு.",
      "தாயின் பெயர் சுனேத்ரா சில்வா, கடவுச்சீட்டு தேவைக்காக.",
      "விண்ணப்பத்தை சரிபார்த்து சமர்ப்பிக்கவும்."
    ]
  }[language as "en" | "si" | "ta"] || [
    "My name is Kasun Perera.",
    "Birth date is 1995-05-12, Colombo district.",
    "Check missing and submit."
  ];

  return (
    <div className="card" style={{ height: "calc(100vh - 120px)" }}>
      <div className="card-title">
        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Mic size={18} color="var(--primary)" />
          <span>Voice Assistant</span>
        </span>
        <span style={{ fontSize: "0.8rem", color: isRecording ? "var(--danger)" : "var(--text-muted)" }}>
          {isRecording ? "Listening..." : "Tap mic to speak"}
        </span>
      </div>

      <div className="mic-section">
        <button
          className={`mic-btn ${isRecording ? "recording" : ""}`}
          onClick={onToggleRecording}
          title={isRecording ? "Stop Listening" : "Start Speaking"}
        >
          {isRecording ? <Square size={32} /> : <Mic size={36} />}
        </button>
        <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          {isRecording ? "Speak naturally in Sinhala, Tamil, or English" : "Click to speak"}
        </p>
      </div>

      {/* Real-time transcript bubbles */}
      <div className="chat-box">
        {conversation.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", margin: "auto" }}>
            Start speaking to begin your application.
          </div>
        ) : (
          conversation.map((msg) => (
            <div key={msg.id} className={`bubble bubble-${msg.speaker}`}>
              <div style={{ fontSize: "0.75rem", opacity: 0.8, marginBottom: "0.2rem" }}>
                {msg.speaker === "agent" ? "Trivaani" : "You"} · {msg.timestamp}
              </div>
              <div>{msg.text}</div>
            </div>
          ))
        )}
      </div>

      {/* Quick Demo Sentence Pills */}
      <div style={{ marginBottom: "0.75rem" }}>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
          Demo quick sentences:
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
          {sampleUtterances.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => onSendText(sample)}
              style={{
                fontSize: "0.75rem",
                padding: "0.25rem 0.5rem",
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Text fallback input */}
      <form onSubmit={handleSend} style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          className="form-input"
          placeholder="Type fallback message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button
          type="submit"
          style={{
            background: "var(--primary)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "0 1rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.3rem"
          }}
        >
          <Send size={15} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
