# Trivaani (ත්‍රිවාණී / திரிவாணி)

> **One voice assistant for any citizen, in Sinhala, Tamil or English.**  
> Built in Sri Lanka, reusable for any office or country.  
> DevFest Sri Lanka 2026 - Government Digitalisation Track

---

## What is Trivaani?

**Trivaani** (*tri* = three, *vaani* = voice/speech) is a citizen-first voice agent that helps Sri Lankans complete government forms through natural conversation in Sinhala, Tamil, or English.

Rather than struggling through complex paper forms or travelling twice to a Divisional Secretariat because a supporting document was missing, citizens speak naturally to Trivaani. The assistant fills out the form in real time, scans identity documents with Gemini Vision, proactively identifies missing requirements, and enforces human confirmation before submission.

---

## Key Highlights

- **Three Languages & Code-Switching**: Speaks and understands Sinhala, Tamil, and English, including Singlish and Tanglish.
- **Completes the Task**: Does not just provide advice; actively sets form fields, reads supporting documents, and validates completeness.
- **Config-Driven Architecture**: Any public service or language can be added through a simple JSON configuration file without changing code.
- **Server-Enforced Safety**: `submit_application` is strictly blocked by backend guardrails until the user explicitly reviews and confirms.
- **Document OCR via Gemini Vision**: Extracts citizen details directly from photos of National Identity Cards (NIC) and hospital birth records.
- **Simple Mode**: High-contrast, large-button UI tailored for elderly and non-tech-savvy citizens.

---

## Architecture

```
React + Vite UI  <-- WebSocket (audio + events) -->  FastAPI backend  <-- Live API -->  Gemini Live
 mic, form, camera, confirm, action log               voice_bridge, tools, guardrails      
                                                      vision.py  ---------------------->  Gemini vision (JSON)
                                                      service config loader, SQLite audit
```

Repository layout:
```
trivaani/
  AGENTS.md         # Challenge rules, judging criteria, and engineering constraints
  TRACKER.md        # Live task tracker and audit log
  services/         # JSON configs (birth_certificate.json, illustrative_other.json)
  backend/          # FastAPI server, Live API bridge, tools, guardrails, vision
  frontend/         # React + Vite application, audio capture/playback, UI
  docs/             # Impact analysis, responsible AI, architecture, demo script
  eval/             # Test utterances, evaluation runner, and language quality logs
  samples/          # Synthetic test documents (no real citizen data)
```

---

## Quickstart

### Prerequisites
- Node.js (v18+)
- Python (3.11+)
- Google Gemini API key ([Get one here](https://aistudio.google.com/))

### 1. Environment Setup
Copy the example environment file and add your Gemini API key:
```bash
cp .env.example .env
```
Edit `.env`:
```ini
GEMINI_API_KEY=your_actual_gemini_api_key
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## Demo Service: Birth Certificate Copy Request (Form B 63)

The primary demo path implements Sri Lanka's official Registrar General's Department application for a certified birth certificate copy. See `docs/demo-script.md` for the step-by-step walkthrough.

To see the zero-code extensibility in action, inspect `services/illustrative_other.json`.

---

## Responsible AI & Privacy

- **Server-enforced confirmation**: The AI cannot finalize or submit any application on its own.
- **Fake data only**: Tested strictly with synthetic identity documents and records.
- **Redacted audit logs**: Personally identifiable information (NICs, phone numbers) is masked in storage.
- Detailed safeguards documented in `docs/responsible-ai.md`.
