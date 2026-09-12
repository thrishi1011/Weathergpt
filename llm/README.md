# WeatherGPT — LLM + Multilingual Intelligence Layer

**Role**: LLM + Multilingual Developer  
**Scope**: `llm/` directory only

This module provides the natural language understanding and multilingual generation layer for **WeatherGPT**. It takes structured weather and official IMD alert data alongside the user's natural language question and outputs clear, helpful, safe, and strictly grounded answers in **14 major languages**.

---

## 1. Supported Languages (14 Languages)

| Language | Code | Native Script & Name | Tone / Register |
| :--- | :--- | :--- | :--- |
| **English** | `en` | English | Direct, concise, friendly |
| **Hindi** | `hi` | हिंदी | Polite conversational (**आप**) |
| **Telugu** | `te` | తెలుగు | Respectful conversational (**మీరు**) |
| **Tamil** | `ta` | தமிழ் | Polite conversational (**நீங்கள்**) |
| **Kannada** | `kn` | ಕನ್ನಡ | Respectful conversational (**ನೀವು**) |
| **Malayalam** | `ml` | മലയാളം | Polite conversational (**നിങ്ങൾ**) |
| **Bengali** | `bn` | বাংলা | Respectful conversational (**আপনি**) |
| **Marathi** | `mr` | मराठी | Respectful conversational (**आपण**) |
| **Assamese** | `as` | অসমীয়া | Polite conversational (**আপুনি**) |
| **Gujarati** | `gu` | ગુજરાતી | Respectful conversational (**તમે**) |
| **Kashmiri** | `ks` | कॉशुर / کٲشُر | Respectful conversational |
| **Punjabi** | `pa` | ਪੰਜਾਬੀ | Respectful conversational (**ਤੁਸੀਂ**) |
| **Odia** | `or` | ଓଡ଼ିଆ | Respectful conversational (**ଆପଣ**) |
| **Urdu** | `ur` | اردو | Polite conversational (**آپ**) |

---

## 2. Core Architecture & Pipeline

```
 User Question + Language Code + Target Location
                       │
                       ▼
 Backend Fetches Weather & IMD Data (shared/weather-schema.json)
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    llm/service.py                           │
│                                                             │
│  1. build_llm_payload()                                     │
│     (Formats & validates against schemas/input.schema.json) │
│                                                             │
│  2. LLM Generation (generator.py)                           │
│     (Master System Prompt with Strict Grounding Rules)      │
│     - Google Gemini / OpenAI / Mock Offline Provider        │
│                                                             │
│  3. ResponseValidator (validation/response_validator.py)    │
│     - Numeric fact check (No hallucinated numbers)          │
│     - Multilingual IMD alert severity check                 │
│     - Prompt injection & leak filter                        │
│                                                             │
│  4. Deterministic Fallback Engine (validation/fallbacks.py) │
│     (14-language native templates for offline/fallback)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
        JSON Response adhering to shared/api-contract.md
        { "answer": "...", "language": "..." }
```

---

## 3. Strict Grounding & Anti-Hallucination Guarantees

- **Zero Invented Data**: Temperature, rain probability, wind speed, humidity, and alert severities are strictly extracted from the provided payload.
- **Missing Data Handling**: If a parameter (e.g. `humidity: null`) is missing, the response states that the data is unavailable rather than hallucinating an estimate.
- **Separation of Fact vs. Interpretation**:
  - *Fact*: `rain_probability: 80%`, `temperature: 34°C`.
  - *Interpretation*: Advising the user to carry an umbrella or take precautions.
- **Deterministic Response Validator**:
  - Rejects answers containing numbers not found in the input data.
  - Rejects phantom alerts or mismatched severity levels (e.g., claiming Red Alert when IMD issued Yellow).
  - Automatically falls back to localized deterministic templates across all 14 languages if the LLM output fails verification.

---

## 4. Backend Integration Quickstart

```python
from llm import ask_weather

# Sample weather data conforming to shared/weather-schema.json
weather_payload = {
    "location": "Chennai",
    "timestamp": "2026-09-11T12:00:00+05:30",
    "temperature": 32,
    "humidity": 80,
    "rain_probability": 85,
    "rainfall": 25,
    "wind_speed": 20,
    "weather_condition": "Heavy Showers",
    "imd_alert": {
        "active": True,
        "severity": "orange",
        "event": "Heavy Rain Warning",
        "message": "Orange Alert: Be prepared for intense spells of rain."
    }
}

# Example in Tamil ('ta')
response_ta = ask_weather(
    question="மழை வருமா?",
    weather_data=weather_payload,
    language="ta",
    location="Chennai"
)
print(response_ta)

# Example in Kannada ('kn')
response_kn = ask_weather(
    question="ನಾಳೆ ಮಳೆ ಬರುತ್ತದೆಯೇ?",
    weather_data=weather_payload,
    language="kn",
    location="Chennai"
)
print(response_kn)
```

---

## 5. Directory Structure

```
llm/
├── README.md                           # Architecture & Integration Guide
├── __init__.py                         # Package exports
├── service.py                          # Main entry point (ask_weather, build_llm_payload)
├── generator.py                        # LLM providers (Gemini, OpenAI, Mock)
├── prompts/
│   ├── __init__.py                     # System prompt loader
│   ├── system_prompt.md                # Grounding rules, schema, & few-shot examples
│   └── language_notes.md               # Complete 14-language vocabulary & IMD terms
├── schemas/
│   ├── input.schema.json               # Input schema with 14 language enums
│   └── output.schema.json              # Output schema with 14 language enums
├── validation/
│   ├── __init__.py
│   ├── response_validator.py           # Guardrail fact-checker
│   ├── response_validator.md           # Guardrail specs
│   └── fallbacks.py                    # 14-language deterministic template engine
└── tests/
    ├── __init__.py
    ├── test_cases.md                   # Benchmark evaluation matrix
    ├── test_validator.py               # Unit tests for guardrails across 14 languages
    └── test_service.py                 # Multi-language integration tests
```

---

## 6. Running Tests

```bash
python3 -m unittest discover -s llm/tests -v
```
