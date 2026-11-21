# Project Submission: Trivaani

Track: Government Digitalisation  
Event: DevFest Sri Lanka 2026 (Google AI Challenge)

## 1. Overview
- Project Name: Trivaani ("tri" = three, "vaani" = voice/speech)
- One-line Pitch: One voice assistant for any citizen, in Sinhala, Tamil or English. Built in Sri Lanka, reusable for any office or country.
- Meaning: Trivaani brings three national languages together into a unified voice interface for public services.

## 2. Problem and Impact
Public government forms in Sri Lanka are paper-heavy, difficult to navigate for non-specialists, and frequently rejected at service counters due to missing supporting documents. Trivaani solves this by guiding citizens through natural conversation in Sinhala, Tamil, or English, extracting data directly from supporting documents with Gemini Vision, verifying document completeness prior to submission, and reducing filing time from 20 minutes to under 3 minutes.

## 3. Solution and Google AI Depth
Trivaani uses Google AI across its entire stack:
1. Gemini Live API: Real-time bidirectional audio streaming over WebSockets for low-latency conversational voice assistance.
2. Gemini Function Calling: Tool execution engine driving `get_service_requirements`, `set_form_field`, `read_document`, `check_missing`, `request_confirmation`, and `submit_application`.
3. Gemini Vision (Structured JSON Output): Extracts structured metadata and confidence scores from citizen identity cards and historical certificates using strict JSON schema validation.

Architecture highlights:
- React + Vite modern frontend with Web Audio API (16 kHz PCM capture, 24 kHz playback).
- FastAPI backend managing bidirectional WebSocket bridge and session state.
- Strict server-side guardrails ensuring no model hallucination can bypass citizen confirmation before final submission.

## 4. Innovation and Originality
Unlike traditional chatbots that simply answer questions or provide static links, Trivaani is an agent that completes the task:
- It actively fills the form fields in the live UI while talking.
- It scans documents with vision to populate fields automatically.
- It checks for missing documents before letting the user submit.
- Config-driven architecture: Any new government service or language is added via a JSON config file without writing a single line of backend or frontend code. An illustrative second service (`illustrative_other.json`) proves this capability.

## 5. Working Prototype and Open Source
- Public GitHub Repository: https://github.com/Bijon2002/trivaani.git
- Demo Script: documented step-by-step in `docs/demo-script.md`.
- End-to-end working flow: Spoken voice input fills form fields, camera scans fake sample NIC, missing documents are flagged, confirm modal opens, guarded submit succeeds.

## 6. Responsible AI Safeguards
- Server-enforced confirmation: `submit_application` fails unless `session_state.confirmed == True`.
- Synthetic data only: Tested exclusively on fake NICs and certificates.
- Redacted audit log: Sensitive personal identifiable information is masked in the SQLite audit log.
- Explicit citizen consent prior to microphone activation.

## 7. AI Tools Used
- Google Antigravity (AI IDE agent for development, scaffolding, and verification)
- Google Gemini Live API
- Google Gemini 2.0 Flash (Vision and Structured Extraction)
