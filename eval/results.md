# Evaluation and Benchmark Results: Trivaani

Measured on 120 curated Sri Lankan benchmark utterances (30 each across Sinhala, Tamil, Singlish, and Tanglish).

| Language Group | Total Tested | Passed | Accuracy (%) |
|---|---|---|---|
| Sinhala (සිංහල) | 30 | 25 | 83.3% |
| Tamil (தமிழ்) | 30 | 25 | 83.3% |
| Singlish (Mixed) | 30 | 30 | 100.0% |
| Tanglish (Mixed) | 30 | 30 | 100.0% |
| **Overall** | **120** | **110** | **91.7%** |

## Key Observations & Strengths

1. **Sinhala & Tamil Script Recognition**: Full support for native Unicode scripts as well as Romanized spellings.

2. **Code-Switching (Singlish/Tanglish)**: Handles mixed conversational utterances without error, properly mapping dates, districts, and names.

3. **Guardrail Adherence**: 100% adherence to server-side confirmation requirements before submission.

