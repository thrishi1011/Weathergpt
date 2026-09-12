# WeatherGPT — Conversational AI for Weather Forecasting, Alerts & Climate Intelligence

WeatherGPT is a multi-modal conversational weather intelligence system built for SIH. It integrates real-time meteorological observations, official India Meteorological Department (IMD) warning feeds, browser geolocation, multilingual AI explanations in 14 Indian languages, and accessible voice interfaces.

---

## Architecture & Ports

```
[ User Browser / Device ]
       │
       ├─────────────────────────┬─────────────────────────┐
       ▼                         ▼                         ▼
Frontend (Vite UI)        Voice Interface         Location Layer
Port: 5173                STT + Edge TTS (5050)   GPS + India Geo
       │
       ▼ (Proxy /api)
Backend API (Express) ───────────────────────────┐
Port: 3000                                       │
       │                                         ▼
       ├──────────────────────────┐      Alert Evaluation Engine
       ▼                          ▼      (IMD Warning Matcher)
Weather Data Layer          LLM Intelligence Layer
(Open-Meteo & IMD APIs)     (14-lang Grounded Engine)
                            Port: 8001 / CLI Fallback
```

### Canonical Network Ports

| Component | Default Port | Protocol | Description |
| :--- | :--- | :--- | :--- |
| **Backend API** | `3000` | HTTP | Core Express REST API (`/health`, `/api/weather`, `/api/ask`) |
| **Frontend UI** | `5173` | HTTP | Vite SPA cockpit with reverse proxy to `localhost:3000` |
| **LLM Service** | `8001` | HTTP | Python multilingual LLM microservice (with CLI runner fallback) |
| **Voice TTS Proxy** | `5050` | HTTP | Edge TTS neural speech synthesis proxy |

---

## Directory Structure

```
Weathergpt/
├── backend/          # Express API server connecting weather data, location, and LLM
├── frontend/         # Vite modern single-page application and interactive cockpit
├── llm/              # Multilingual intelligence layer with anti-hallucination guardrails
├── data/             # Official IMD API client and normalizer
├── alerts/           # Alert engine, severity normalizer, and notification service
├── location/         # Worldwide geocoding, 750+ Indian districts, and IP fallback
├── voice/            # Web Speech STT, Edge neural TTS, and voice UI components
├── shared/           # Shared JSON schema contracts and API specifications
└── README.md         # Comprehensive setup and testing documentation
```

---

## Getting Started

### 1. Prerequisites
- **Node.js** v18+ or v20+
- **Python** 3.10+ or 3.11+
- **Git**

### 2. Installation

Install Node.js dependencies for backend and frontend:
```bash
npm --prefix backend install
npm --prefix frontend install
npm --prefix voice install
```

### 3. Starting the Services

#### Option A: One-Command Development

Start the Backend (Port 3000):
```bash
node backend/server.js
```

Start the Frontend (Port 5173):
```bash
npm --prefix frontend run dev
```

*(Optional)* Start the Python LLM microservice on Port 8001 (Note: the backend automatically falls back to invoking Python directly if this service is not running):
```bash
python -m llm.server
```

*(Optional)* Start the Voice Edge TTS proxy on Port 5050:
```bash
npm --prefix voice start
```

---

## Running Automated Test Suites

All modules are fully covered by automated test suites that can be executed independently:

### 1. Data Layer Tests
```bash
python -m unittest discover -s data -v
```

### 2. LLM Multilingual & Guardrail Tests
```bash
python -m unittest discover -s llm/tests -v
```

### 3. Alert Engine & Severity Normalizer Tests
```bash
node alerts/test/runTests.js
```

### 4. Location & Geocoding Tests (31 test cases)
```bash
node location/test/test-v2.js
```

### 5. Voice Interface Tests
```bash
node voice/test-runner.js
```

### 6. Full System End-to-End Test Suite (16 automated verification steps)
```bash
node backend/test_e2e.js
```

### 7. Frontend Production Build Verification
```bash
npm --prefix frontend run build
```

---

## Shared Contracts & Compliance

All modules strictly adhere to the contracts defined in:
- `shared/api-contract.md`: REST endpoints (`GET /api/weather`, `POST /api/ask`)
- `shared/weather-schema.json`: Unified telemetry and IMD warning structure
