import { useState, useEffect, useRef, useCallback } from "react";
import { AudioRecorder } from "../audio/audioRecorder";
import { AudioPlayer } from "../audio/audioPlayer";

export interface FormFieldValue {
  value: any;
  source: string;
  confidence: number;
}

export interface MissingItem {
  id?: string;
  doc_type?: string;
  label?: string;
  title?: string;
}

export interface SessionData {
  session_id: string;
  service_id: string;
  language: string;
  form_data: Record<string, FormFieldValue>;
  uploaded_documents: string[];
  confirmation_requested: boolean;
  confirmation_summary?: string;
  confirmed: boolean;
  submitted: boolean;
  submission_id?: string;
  missing?: {
    is_complete: boolean;
    missing_fields: MissingItem[];
    missing_documents: MissingItem[];
    filled_fields_count: number;
    total_required_fields: number;
  };
}

export interface ChatMessage {
  id: string;
  speaker: "agent" | "user" | "system";
  text: string;
  timestamp: string;
}

export interface ActionLogItem {
  id: string;
  tool: string;
  args?: any;
  result?: any;
  timestamp: string;
}

export function useSession() {
  const [sessionId, setSessionId] = useState<string>(() => "triv-" + Math.random().toString(36).substring(2, 9));
  const [serviceId, setServiceId] = useState<string>("birth_certificate");
  const [language, setLanguage] = useState<string>("en");
  const [serviceConfig, setServiceConfig] = useState<any>(null);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [actionLogs, setActionLogs] = useState<ActionLogItem[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showConsentModal, setShowConsentModal] = useState<boolean>(true);
  const [simpleMode, setSimpleMode] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);

  // Load available services and config
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/services")
      .then((res) => res.json())
      .then((data) => setAvailableServices(data.services || []))
      .catch((err) => console.error("Error fetching services:", err));

    fetch(`http://127.0.0.1:8000/api/services/${serviceId}`)
      .then((res) => res.json())
      .then((data) => setServiceConfig(data))
      .catch((err) => console.error("Error fetching service config:", err));
  }, [serviceId]);

  // Connect WebSocket
  const connectWebSocket = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    const wsUrl = `ws://127.0.0.1:8000/ws/session?session_id=${sessionId}&service_id=${serviceId}&language=${language}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log("WebSocket connected to Trivaani voice bridge.");
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log("WebSocket disconnected.");
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleServerMessage(msg);
      } catch (e) {
        console.error("Error parsing WS message:", e);
      }
    };
  }, [sessionId, serviceId, language]);

  const handleServerMessage = (msg: any) => {
    const timeStr = new Date().toLocaleTimeString();

    if (msg.type === "session_init") {
      setSessionData(msg.state);
    } else if (msg.type === "transcript") {
      setConversation((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          speaker: msg.speaker || "agent",
          text: msg.text,
          timestamp: timeStr
        }
      ]);
      if (msg.updated_field) {
        highlightField(msg.updated_field);
      }
      if (msg.state) {
        setSessionData(msg.state);
      }
    } else if (msg.type === "audio") {
      if (!audioPlayerRef.current) {
        audioPlayerRef.current = new AudioPlayer();
      }
      audioPlayerRef.current.playChunk(msg.data);
    } else if (msg.type === "tool_executed") {
      setActionLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          tool: msg.tool,
          args: msg.args,
          result: msg.result,
          timestamp: timeStr
        }
      ]);
      if (msg.tool === "set_form_field" && msg.args?.field_id) {
        highlightField(msg.args.field_id);
      }
      if (msg.tool === "request_confirmation") {
        setShowConfirmModal(true);
      }
      if (msg.state) {
        setSessionData(msg.state);
      }
    } else if (msg.type === "confirmation_requested") {
      setShowConfirmModal(true);
      if (msg.state) setSessionData(msg.state);
    } else if (msg.type === "confirmed" || msg.type === "submit_result") {
      if (msg.state) setSessionData(msg.state);
    } else if (msg.type === "language_switched") {
      setLanguage(msg.language);
      if (msg.state) setSessionData(msg.state);
    }
  };

  const highlightField = (fieldId: string) => {
    setActiveFieldId(fieldId);
    setTimeout(() => {
      setActiveFieldId((curr) => (curr === fieldId ? null : curr));
    }, 2800);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stop();
        audioRecorderRef.current = null;
      }
      setIsRecording(false);
    } else {
      try {
        if (!isConnected) {
          connectWebSocket();
        }
        audioRecorderRef.current = new AudioRecorder((base64Chunk) => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "audio", data: base64Chunk }));
          }
        });
        await audioRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Microphone access error:", err);
      }
    }
  };

  const sendTextMessage = (text: string) => {
    if (!text.trim()) return;
    const timeStr = new Date().toLocaleTimeString();
    setConversation((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        speaker: "user",
        text,
        timestamp: timeStr
      }
    ]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "text", text }));
    }
  };

  const switchLanguage = (newLang: string) => {
    setLanguage(newLang);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "switch_language", language: newLang }));
    }
  };

  const switchService = (newServiceId: string) => {
    setServiceId(newServiceId);
    setSessionId("triv-" + Math.random().toString(36).substring(2, 9));
    setConversation([]);
    setActionLogs([]);
    setShowConfirmModal(false);
  };

  const updateFieldManual = async (fieldId: string, value: string) => {
    highlightField(fieldId);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/session/${sessionId}/field`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field_id: fieldId, value, source: "manual" })
      });
      const data = await res.json();
      if (data.state) setSessionData(data.state);
    } catch (err) {
      console.error("Error updating field:", err);
    }
  };

  const userConfirm = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "confirm" }));
    } else {
      fetch(`http://127.0.0.1:8000/api/session/${sessionId}/confirm`, { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          if (data.state) setSessionData(data.state);
        });
    }
  };

  const submitApplication = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "submit" }));
    } else {
      fetch(`http://127.0.0.1:8000/api/session/${sessionId}/submit`, { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          if (data.state) setSessionData(data.state);
        });
    }
    setShowConfirmModal(false);
  };

  const uploadDocument = async (docType: string, file: File) => {
    const formData = new FormData();
    formData.append("doc_type", docType);
    formData.append("file", file);

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/session/${sessionId}/document`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.state) {
        setSessionData(data.state);
      }
      setActionLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          tool: "read_document (Vision OCR)",
          args: { doc_type: docType, filename: file.name },
          result: data.extracted_fields,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      return data;
    } catch (err) {
      console.error("Error uploading document:", err);
      return null;
    }
  };

  return {
    sessionId,
    serviceId,
    language,
    serviceConfig,
    availableServices,
    sessionData,
    conversation,
    actionLogs,
    isRecording,
    isConnected,
    activeFieldId,
    showConfirmModal,
    showConsentModal,
    simpleMode,
    setShowConfirmModal,
    setShowConsentModal,
    setSimpleMode,
    connectWebSocket,
    toggleRecording,
    sendTextMessage,
    switchLanguage,
    switchService,
    updateFieldManual,
    userConfirm,
    submitApplication,
    uploadDocument
  };
}
