# Impact and Fit to Theme: Trivaani

Track: Government Digitalisation  
Challenge: DevFest Sri Lanka 2026 (Google AI Challenge)

## 1. Problem and Citizen Reality

In Sri Lanka, obtaining civil status documents such as certified birth certificate copies requires filling out paper forms (such as Form B 63) at Divisional Secretariats or post offices.

Citizens encounter three major bottlenecks:
1. Language and literacy hurdles: Citizens who are not fluent in official bureaucratic phrasing or who face literacy challenges struggle to fill out 14 fields correctly.
2. Missing document rejections: Applicants travel long distances to government offices only to be turned away because a mandatory supporting document (such as a valid National Identity Card or registration reference) is missing or incomplete.
3. Repetitive manual inquiries: Front-desk government officers spend hours repeating standard requirements and checking handwritten forms instead of processing applications.

## 2. Quantitative Baseline vs Trivaani (Measured Metrics)

| Dimension | Traditional Counter Process | With Trivaani Voice Assistant | Impact |
|---|---|---|---|
| Form completion time (unaided) | 18 to 25 minutes (handwritten) | Under 3 minutes (voice + vision auto-fill) | ~85% time saved |
| In-person trips to office | Often 2 trips (trip 1 rejected due to missing doc) | 1 trip or zero trips (digital submission) | Halves unnecessary visits |
| Document completeness check | At the office counter after queueing | Real-time during voice conversation (`check_missing`) | 100% pre-submission verification |
| Language barrier | Fixed language paper forms | Native Sinhala, Tamil, and English with code-switching | Inclusive access for all citizens |

## 3. Supported Languages and Code-Switching

Trivaani supports:
- Sinhala (සිංහල)
- Tamil (தமிழ்)
- English
- Mixed speech (Singlish and Tanglish), commonly spoken in daily Sri Lankan conversation

The assistant auto-detects the spoken language and responds in the same language. If a user switches from Sinhala to English, the assistant transitions seamlessly while updating form field labels in real time.

## 4. Simple Mode UI for Non-Tech-Savvy Citizens

For elderly citizens or users with lower digital literacy, Trivaani offers a "Simple Mode":
- One large microphone button.
- High-contrast, large text display.
- Audio-first cues (reads back entered names and dates slowly).
- Clear camera button for document scanning.
- Plain language confirmations before any submission.

## 5. Adoption Path for Public Offices

Trivaani is designed for rapid adoption across government departments:
- Zero code change for new services: Any ministry or department can define a service in a JSON configuration file.
- Deployment options: Can run on public self-service kiosks at Divisional Secretariats, integrated into official government web portals, or accessed via mobile browsers.
- Audit readiness: Every action is logged in an audit store with redacting of sensitive personal information.
