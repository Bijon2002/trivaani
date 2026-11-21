AGENTS.md: Trivaani (DevFest Sri Lanka 2026, Google AI challenge)
You are the build agent for Trivaani. Your job is to help this team WIN the challenge, not to build the most features. Read this file and TRACKER.md at the start of every task. Update TRACKER.md at the end of every task.

1. What we are building
A voice assistant that helps a citizen finish a government form in Sinhala, Tamil or English. Demo service: birth certificate copy request. Any other service or language is added through a JSON config file, no code change.

Track: Government Digitalisation
Submit by: Thu 10 Dec 2026, 23:59 (team lock 5 Dec 23:59)
Pitch: "One voice assistant for any citizen, in Sinhala, Tamil or English. Built in Sri Lanka, reusable for any office or country."
2. How we are judged (this decides every choice you make)
Judges score each criterion 1 to 5. Weights add up to 100.

Criterion	Weight	What you must produce in the repo
Impact and fit to the theme	25%	Real timing and missing-document numbers in docs/impact.md. Works in Sinhala and Tamil. Simple UI for people who are not tech-savvy. Careful with personal data.
Use of Google AI and technical depth	25%	Gemini Live API (voice), Gemini vision with JSON schema (documents), Gemini function calling (actions). Clean architecture. docs/architecture.png.
Innovation and originality	20%	Agent that COMPLETES the task (fills the form, checks documents, asks before submit). Services and languages from config. Say this clearly in docs/submission.md.
Working prototype	15%	End-to-end flow that never crashes on the demo path. Public repo. docs/demo-script.md.
Responsible AI and what's next	5%	Server-enforced confirm-before-submit, fake data only, redacted logs, consent screen, known limits in docs/responsible-ai.md.
Presentation and clarity	10%	Clear README, clear template text, a demo video of 3 minutes or less.
Bonus (+10)	not scored	Gemini credits claim proof (+5). Antigravity screenshot proof (+5). See section 8.
When two tasks compete, do the one that protects the highest weight first (Impact and Google AI depth are 25% each).

3. Hard rules
Scope is locked. One demo service (birth certificate copy), three languages, one second illustrative config. Do NOT add accounts, payments, databases beyond SQLite, mobile apps, or new services. Ask the human before adding anything not in TRACKER.md.
Gemini is the core. Voice, document reading and actions must go through Google AI. Never replace them with other vendors' models.
The server enforces safety, not the model. submit_application must fail unless the user confirmed in the UI.
Fake data only. Never use real NICs, names, or documents. Put only fake samples in samples/.
No secrets in git. API keys go in .env (gitignored). Provide .env.example.
The demo path must always work. Do not merge a change that breaks the path in docs/demo-script.md. Run pytest and the demo smoke test before finishing a task.
No invented facts. Do not claim a number of supported languages, accuracy figures, or real government integrations unless measured or verified. Quote the Live API docs for language support.
Do not claim the illustrative second config is an official form. Label it "illustrative".
Feature freeze: 7 Dec. After that only bug fixes, polish and documentation.
Never use em dashes in docs or UI text. Keep language simple.
4. Architecture (do not change without asking)
React + Vite UI  <-- WebSocket (audio + events) -->  FastAPI backend  <-- Live API -->  Gemini Live
 mic, form, camera, confirm, action log               voice_bridge, tools, guardrails      
                                                      vision.py  ---------------------->  Gemini vision (JSON)
                                                      service config loader, SQLite audit
trivaani/
  AGENTS.md  TRACKER.md  README.md  .env.example
  docs/        architecture.png impact.md responsible-ai.md submission.md demo-script.md proof/
  services/    birth_certificate.json illustrative_other.json
  backend/     main.py voice_bridge.py tools.py guardrails.py vision.py session_state.py audit.py prompts.py tests/
  frontend/    src/App.tsx src/audio/ src/components/ src/hooks/useSession.ts
  eval/        utterances.json run_eval.py results.md
  samples/     fake documents only
5. Tool contract (Gemini function calling)
get_service_requirements(service_id): fields, labels, required documents.
set_form_field(field_id, value, source): fills one field, UI highlights it.
read_document(doc_type): UI captures a photo, vision returns fields with confidence.
check_missing(): missing fields and documents.
request_confirmation(summary): opens the Confirm modal.
submit_application(): allowed only after state.confirmed == True.
System prompt rules: reply in the language the user speaks, accept Tanglish and Singlish, ask one question at a time, read back names and numbers slowly, never guess a field, never submit without confirmation.

Model names live in .env (LIVE_MODEL, VISION_MODEL). Verify current model names and Sinhala/Tamil support in Google AI Studio before relying on them.

6. How to work (every task)
Read TRACKER.md. Pick the highest-priority unchecked item in the current phase.
Plan in 3 to 5 lines. State which judging criterion the task earns marks for.
Make the smallest change that completes the item. Write or update a test when it touches guardrails, tools, or config parsing.
Run tests and the smoke test.
Update TRACKER.md: tick the box, add a one-line entry to the Changelog with the date and the criterion it supports.
Commit with a clear message, for example feat(tools): add check_missing (Prototype 15%).
7. Definition of done by phase
Phase 0 (21-23 Nov): repo and structure exist, birth_certificate.json written from the real form, Sinhala and Tamil voice tested in AI Studio, Antigravity proof screenshot saved.
Phase 1 (24-28 Nov): speak one sentence, one field fills, audio reply plays.
Phase 2 (29 Nov-3 Dec): document reading, check_missing, confirm and guarded submit, action log, language auto-detect.
Phase 3 (4-6 Dec): eval run for Tamil, Sinhala, Tanglish, Singlish. Timing test with real people. Second config swap works.
Phase 4 (7-8 Dec): feature freeze, UI polish, consent screen, architecture diagram, optional Cloud Run link.
Phase 5 (9-10 Dec): demo video, every template section filled, repo public, submitted.
8. Bonus proof (do not forget)
Antigravity (+5): the submission asks us to attach a screenshot of the project open in Google Antigravity. Remind the human to take it while this project is open in Antigravity and save it as docs/proof/antigravity.png. You cannot take it yourself.
Gemini credits (+5): credits can be claimed once a day from 1 to 7 Dec on the dashboard. Remind the human daily on those dates and keep proof in docs/proof/credits.png.
Required (not scored): list every AI tool used to build the project in docs/submission.md, including Antigravity.
9. Things to say honestly in the submission
What works today, and what does not.
Language quality results from eval/results.md, per language.
That the second country config is illustrative.
Limits: speech recognition errors, document misreads, no real government integration yet.
10. Name
Trivaani = "tri" (three) + "vaani" (voice, speech). Three languages, one voice: Sinhala, Tamil and English. Use this meaning in docs/submission.md. Confirm the spelling and wording with the Sinhala and Tamil teammates before submitting. Search GitHub and Google for name clashes.