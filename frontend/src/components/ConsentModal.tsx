import React from "react";
import { ShieldCheck } from "lucide-react";

interface ConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  language: string;
}

interface ConsentText {
  title: string;
  p1: string;
  p2: string;
  points: string[];
  btn: string;
}

const CONSENT_TEXTS: Record<string, ConsentText> = {
  en: {
    title: "Citizen Consent & Privacy Notice",
    p1: "Trivaani is an AI voice assistant designed to help Sri Lankan citizens complete public service applications easily in Sinhala, Tamil, or English.",
    p2: "By enabling the voice assistant, your microphone audio will be streamed to Google Gemini Live API for speech processing and real-time form filling.",
    points: [
      "No biometric voiceprints are created or stored.",
      "National ID numbers and contact details are masked in audit logs.",
      "The AI assistant can never submit your application without your explicit on-screen review and confirmation."
    ],
    btn: "I Understand & Enable Voice Assistant"
  },
  si: {
    title: "පුරවැසි කැමැත්ත සහ පෞද්ගලිකත්ව නිවේදනය",
    p1: "ත්‍රිවාණී යනු ශ්‍රී ලාංකික පුරවැසියන්ට රාජ්‍ය සේවා අයදුම්පත් පහසුවෙන් සම්පූර්ණ කිරීම සඳහා සිංහල, දෙමළ හෝ ඉංග්‍රීසි භාෂාවෙන් ක්‍රියාත්මක වන හඬ සහායකයෙකි.",
    p2: "හඬ සහායක සක්‍රිය කිරීමෙන්, ඔබේ හඬ දත්ත Google Gemini Live API වෙත යොමු කර තත්‍ය කාලීනව පෝරමය පිරවීමට සහාය වේ.",
    points: [
      "කිසිදු ජෛවමිතික හඬ සටහනක් ගබඩා නොකෙරේ.",
      "හැඳුනුම්පත් අංක සහ පුද්ගලික දත්ත විගණන ලේඛනවලදී වසං කරනු ලැබේ.",
      "ඔබගේ සෘජු සමාලෝචනයෙන් සහ තහවුරු කිරීමෙන් තොරව කෘතිම බුද්ධියට කිසිවිටෙකත් අයදුම්පත ඉදිරිපත් කළ නොහැක."
    ],
    btn: "මම එකඟයි - හඬ සහායක සක්‍රිය කරන්න"
  },
  ta: {
    title: "குடிமக்கள் ஒப்புதல் மற்றும் தனியுரிமை அறிவிப்பு",
    p1: "திரிவாணி என்பது இலங்கை குடிமக்கள் பொது சேவை விண்ணப்பங்களை சிங்களம், தமிழ் அல்லது ஆங்கிலத்தில் எளிதாக பூர்த்தி செய்ய உதவும் குரல் உதவியாளராகும்.",
    p2: "குரல் உதவியாளரை இயக்குவதன் மூலம், உங்கள் மைக்ரோஃபோன் குரல் Google Gemini Live API-க்கு அனுப்பப்பட்டு படிவத்தை நிரப்ப உதவும்.",
    points: [
      "எந்தவொரு குரல் கைரேகையும் சேமிக்கப்படாது.",
      "அடையாள அட்டை எண்கள் மற்றும் தொலைபேசி எண்கள் தணிக்கை பதிவுகளில் மறைக்கப்படும்.",
      "உங்கள் நேரடி ஒப்புதல் இன்றி செயற்கை நுண்ணறிவால் விண்ணப்பத்தை சமர்ப்பிக்க முடியாது."
    ],
    btn: "நான் ஒப்புக்கொள்கிறேன் - குரல் உதவியாளரை இயக்குக"
  }
};

export const ConsentModal: React.FC<ConsentModalProps> = ({ isOpen, onAccept, language }) => {
  if (!isOpen) return null;

  const currentText = CONSENT_TEXTS[language] || CONSENT_TEXTS["en"];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 style={{ fontSize: "1.3rem", color: "#003366", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ShieldCheck size={24} color="#003366" />
          <span>{currentText.title}</span>
        </h2>
        <p style={{ color: "#4a5568", marginBottom: "0.75rem", fontSize: "0.95rem", lineHeight: "1.5" }}>
          {currentText.p1}
        </p>
        <p style={{ color: "#4a5568", marginBottom: "1rem", fontSize: "0.95rem", lineHeight: "1.5" }}>
          {currentText.p2}
        </p>
        <ul style={{ paddingLeft: "1.25rem", color: "#2d3748", fontSize: "0.9rem", marginBottom: "1.5rem", lineHeight: "1.6" }}>
          {currentText.points.map((pt: string, i: number) => (
            <li key={i}>{pt}</li>
          ))}
        </ul>
        <button
          onClick={onAccept}
          style={{
            width: "100%",
            background: "#003366",
            color: "white",
            padding: "0.85rem",
            borderRadius: "8px",
            border: "none",
            fontWeight: 600,
            fontSize: "1rem",
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(0, 51, 102, 0.2)"
          }}
        >
          {currentText.btn}
        </button>
      </div>
    </div>
  );
};
