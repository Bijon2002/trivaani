import base64
import os
from pathlib import Path
from typing import Dict, Any, Optional
from fastapi import FastAPI, WebSocket, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# Load environment configuration
load_dotenv()

from backend.config_loader import load_service_config, list_available_services
from backend.session_state import SessionState
from backend.guardrails import check_submit_guardrail, GuardrailBlockedException
from backend.tools import execute_tool
from backend.vision import extract_document_fields
from backend.audit import audit_logger
from backend.voice_bridge import VoiceBridgeSession

app = FastAPI(
    title="Trivaani API",
    description="Citizen Voice Assistant for Public Services - DevFest Sri Lanka 2026",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# In-memory active sessions
sessions: Dict[str, SessionState] = {}

def get_or_create_session(session_id: str, service_id: str = "birth_certificate", language: str = "en") -> SessionState:
    if session_id not in sessions:
        sessions[session_id] = SessionState(
            session_id=session_id,
            service_id=service_id,
            language=language
        )
    return sessions[session_id]

@app.get("/api/health")
async def health_check():
    return {
        "status": "HEALTHY",
        "service": "Trivaani API",
        "live_model": os.getenv("LIVE_MODEL", "gemini-2.0-flash-exp"),
        "vision_model": os.getenv("VISION_MODEL", "gemini-2.0-flash")
    }

@app.get("/api/services")
async def get_services():
    return {"services": list_available_services()}

@app.get("/api/services/{service_id}")
async def get_service(service_id: str):
    try:
        config = load_service_config(service_id)
        return config.model_dump()
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Service not found")

@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return sessions[session_id].to_dict()

@app.post("/api/session/{session_id}/field")
async def update_field(session_id: str, payload: Dict[str, Any]):
    state = get_or_create_session(session_id)
    field_id = payload.get("field_id")
    value = payload.get("value")
    source = payload.get("source", "manual")
    if not field_id:
        raise HTTPException(status_code=400, detail="field_id required")
    res = state.set_field(field_id=field_id, value=value, source=source)
    await audit_logger.log_event(session_id, "FIELD_SET", "citizen", res)
    return {"status": "SUCCESS", "state": state.to_dict()}

@app.post("/api/session/{session_id}/confirm")
async def confirm_application(session_id: str):
    state = get_or_create_session(session_id)
    state.user_confirm()
    await audit_logger.log_event(session_id, "CONFIRMED", "citizen", {})
    return {"status": "SUCCESS", "confirmed": True, "state": state.to_dict()}

@app.post("/api/session/{session_id}/submit")
async def submit_application_endpoint(session_id: str):
    state = get_or_create_session(session_id)
    try:
        res = await execute_tool("submit_application", {}, state)
        if res.get("status") == "BLOCKED":
            raise HTTPException(status_code=403, detail=res.get("error"))
        return res
    except GuardrailBlockedException as e:
        raise HTTPException(status_code=403, detail=str(e))

@app.post("/api/session/{session_id}/document")
async def upload_document(
    session_id: str,
    doc_type: str = Form(...),
    file: UploadFile = File(...)
):
    state = get_or_create_session(session_id)
    content = await file.read()

    # Find extractable fields for this document type from service config
    target_fields = []
    for doc in state.config.required_documents:
        if doc.doc_type == doc_type:
            target_fields = doc.extractable_fields
            break

    extraction = await extract_document_fields(
        image_bytes=content,
        doc_type=doc_type,
        target_fields=target_fields,
        mime_type=file.content_type or "image/jpeg"
    )

    extracted_fields = extraction.get("extracted_fields", {})
    confidences = extraction.get("confidence_scores", {})
    avg_conf = sum(confidences.values()) / max(len(confidences), 1) if confidences else 0.95

    state.record_document(doc_type=doc_type, extracted_fields=extracted_fields, confidence=avg_conf)
    await audit_logger.log_event(session_id, "DOCUMENT_SCANNED", "citizen", {
        "doc_type": doc_type,
        "extracted_fields": extracted_fields,
        "confidence": avg_conf
    })

    return {
        "status": "SUCCESS",
        "doc_type": doc_type,
        "extracted_fields": extracted_fields,
        "confidence": avg_conf,
        "state": state.to_dict()
    }

@app.get("/api/session/{session_id}/audit")
async def get_audit_trail(session_id: str):
    events = await audit_logger.get_session_events(session_id)
    return {"session_id": session_id, "events": events}

@app.websocket("/ws/session")
async def websocket_session_endpoint(
    websocket: WebSocket,
    session_id: Optional[str] = None,
    service_id: str = "birth_certificate",
    language: str = "en"
):
    await websocket.accept()
    sid = session_id or str(os.urandom(8).hex())
    state = get_or_create_session(sid, service_id=service_id, language=language)
    bridge = VoiceBridgeSession(websocket=websocket, session_state=state)
    await bridge.run()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
