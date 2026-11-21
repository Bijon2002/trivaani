# Responsible AI and Safeguards: Trivaani

Trivaani follows Google AI principles and Sri Lankan data protection guidelines. Safety and user control are enforced at the architecture level.

## 1. Core Principle: Server-Enforced Safety

The model alone is never trusted to make final state mutations or submit citizen applications.
- Server guardrail: The backend API endpoint `submit_application` checks `session_state.confirmed == True`.
- If the model calls `submit_application` before the citizen explicitly clicked or spoke "Confirm" on the review screen, the server strictly rejects the tool call with `GUARDRAIL_BLOCKED: Confirmation required`.
- Two-step flow:
  1. The model calls `request_confirmation(summary)`.
  2. The UI displays the full confirmation modal listing every field.
  3. The citizen explicitly reviews and confirms.
  4. Only then can `submit_application` succeed.

## 2. Privacy and Data Handling

- Fake data only in development and testing: All test samples in `samples/` use synthetic names, fake NIC numbers (e.g., `199012304567` or `901234567V`), and fictional addresses.
- Redacted audit logs: The backend SQLite audit log stores events (`FIELD_SET`, `DOC_READ`, `CONFIRM_REQUESTED`, `SUBMITTED`), but redacts full NIC numbers and phone numbers in persisted logs.
- Ephemeral processing: Document photos submitted for OCR and field extraction are processed in memory and not stored permanently on server disks.

## 3. Consent Screen

Before audio streaming starts, Trivaani displays a clear consent banner:
- Citizens are informed that microphone audio is streamed to the AI assistant to help fill the form.
- No biometric voiceprints are retained.
- Users can stop or clear session data at any time.

## 4. Known Limitations

We state the limitations of Trivaani honestly:
1. Speech recognition in noisy environments: Background road or crowd noise can degrade transcription accuracy for regional accents. Users can edit any field manually in the UI.
2. Low-quality document scans: Blurry or poorly lit photos of damaged handwritten birth registers may lead to OCR misreads. Trivaani returns per-field confidence scores and prompts the user to verify low-confidence fields.
3. No live government database link: This prototype connects to the standard Form B 63 specification and simulates submission to an audit backend. It is not currently connected to live government production registries.
4. Model voice latency: WebSocket audio streaming depends on network bandwidth. In low-bandwidth areas, the fallback text interface ensures accessibility.
