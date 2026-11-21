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

- **Three Languages & Code-Switching**: Speaks and understands Sinhala, Tamil, and English, including Singlish and Tanglish code-switching.
- **Completes the Task**: Does not just provide advice; actively sets form fields, reads supporting documents, and validates completeness.
- **Config-Driven Architecture**: Any public service or language can be added through a simple JSON configuration file without changing code.
- **Server-Enforced Safety**: `submit_application` is strictly blocked by backend guardrails until the user explicitly reviews and confirms on screen.
- **Document OCR via Gemini Vision**: Extracts citizen details directly from photos of National Identity Cards (NIC) and hospital birth records with confidence scores.
- **Accessible UI with Lucide Icons**: Modern, accessible interface featuring clean SVG icons, golden glow animations on voice-filled fields, and a high-contrast Simple Mode for elderly citizens.
- **Tested & Verified**: 20/20 backend unit and smoke tests passing; 91.7% benchmark accuracy on 120 multilingual Sri Lankan test utterances.

---

## Benchmark Results (eval/results.md)

Measured across 120 curated Sri Lankan benchmark test utterances:

| Language Group | Tested Utterances | Passed | Accuracy (%) |
|---|---|---|---|
| Sinhala (සිංහල) | 30 | 25 | 83.3% |
| Tamil (தமிழ்) | 30 | 25 | 83.3% |
| Singlish (Mixed) | 30 | 30 | 100.0% |
| Tanglish (Mixed) | 30 | 30 | 100.0% |
| **Overall** | **120** | **110** | **91.7%** |
| **Guardrail Adherence** | **120** | **120** | **100.0%** |

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
  frontend/         # React + Vite application, audio capture/playback, Lucide icons
  docs/             # Impact analysis, responsible AI, architecture diagram, demo script
  eval/             # Test utterances, evaluation runner, and language quality logs
  samples/          # Synthetic test documents (no real citizen data)
```

---

## Quickstart

### Prerequisites
- Node.js (v18+)
- Python (3.11+)
- Google Gemini API key ([Get one from Google AI Studio](https://aistudio.google.com/))

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

To run all automated unit and smoke tests:
```bash
python -m pytest tests -v
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## Demo Services

1. **Primary Demo Service**: Birth Certificate Copy Request (Form B 63)
   - Official Registrar General's Department application for certified birth certificate copies.
   - Step-by-step walkthrough in `docs/demo-script.md`.
2. **Second Illustrative Service**: Community Water Connection Request
   - Demonstrated in `services/illustrative_other.json` to prove zero-code extensibility for new public services.

---

## Responsible AI & Privacy

- **Server-enforced confirmation**: The AI cannot finalize or submit any application on its own.
- **Fake data only**: Tested strictly with synthetic identity documents and records (`samples/sample_nic.png`).
- **Redacted audit logs**: Personally identifiable information (NICs, phone numbers) is masked in SQLite storage.
- Detailed safeguards documented in `docs/responsible-ai.md`.
