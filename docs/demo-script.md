# Demo Script: Trivaani (Birth Certificate Copy Request)

This script provides a 3-minute demonstration path for the judges.

## Pre-flight Checklist
1. Backend running: `uvicorn backend.main:app --reload --port 8000`
2. Frontend running: `cd frontend && npm run dev`
3. Sample documents ready in `samples/`:
   - `sample_nic.png` (Synthetic test National Identity Card)
4. Audio device tested (mic and speakers active).

## Demo Walkthrough (3 Minutes)

### Step 1: Landing and Consent (0:00 - 0:25)
- Open Trivaani in the browser.
- Point out the clean trilingual banner (Sinhala, Tamil, English).
- Click "Enable Voice Assistant" on the Consent screen.
- Highlight the Simple Mode toggle for accessibility.

### Step 2: Spoken Form Filling in Sinhala / Tamil (0:25 - 1:15)
- Speak in Sinhala: "මට මගේ උපන් සහතිකයේ පිටපතක් ගන්න ඕනෙ. මගේ නම කසුන් පෙරේරා."
  (Translation: "I need to get a copy of my birth certificate. My name is Kasun Perera.")
- The assistant speaks back in Sinhala, welcoming the user and confirming the applicant name.
- Field `applicant_full_name` is highlighted in gold and populated on the live form.
- The assistant asks for the date of birth and district.
- Speak in Singlish / English: "Birth date is 1995 May 12, district Colombo."
- The assistant sets `date_of_birth` to `1995-05-12` and `birth_district` to `Colombo`.

### Step 3: Document Vision and Auto-fill (1:15 - 1:55)
- Assistant asks: "Do you have your National Identity Card ready?"
- Click "Scan Document" or trigger `read_document`.
- Upload the fake sample NIC `samples/sample_nic.png`.
- Gemini Vision extracts `applicant_nic: "199513304567"` and confirms full name with confidence scores.
- The NIC field lights up on the form.

### Step 4: Missing Field Check (`check_missing`) (1:55 - 2:20)
- Say: "Can I submit the form now?"
- Assistant calls `check_missing()`.
- Assistant informs the user: "Mother's full name and reason for copy are still required before submitting."
- Speak: "Mother's name is Sunethra Silva, and the reason is passport application."
- Assistant populates `mother_full_name` and `reason_for_copy`.

### Step 5: Guarded Review and Confirmation (2:20 - 2:50)
- Assistant calls `request_confirmation(summary)`.
- The Confirmation Modal appears on screen showing all populated values.
- Mention to judges: If the AI tries to call `submit_application` directly without citizen consent, the server guardrail blocks it.
- Click "Confirm & Submit".
- The assistant executes `submit_application()`.
- Success screen displays submission tracking reference number and audit log entry.

### Step 6: Config-Driven Extensibility Proof (2:50 - 3:00)
- Show `services/illustrative_other.json`.
- Demonstrate that changing one configuration string swaps the entire form, fields, and language labels without modifying backend or frontend code.
