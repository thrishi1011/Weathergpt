# ⚡ WeatherGPT — AI-Powered Agro-Meteorological & Atmospheric Intelligence

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B%20%7C%2020%2B-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.10%2B%20%7C%203.11%2B-blue.svg)](https://python.org/)
[![Vite](https://img.shields.io/badge/Frontend-Vite%20%2B%20Vanilla%20JS-646CFF.svg)](https://vitejs.dev/)
[![Gemini 2.5](https://img.shields.io/badge/LLM-Gemini%20Flash%20%2F%20Pro-orange.svg)](https://ai.google.dev/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20Persistence-3ECF8E.svg)](https://supabase.com/)

> **WeatherGPT** is an advanced, multilingual conversational weather and agro-meteorological intelligence system. It combines real-time weather telemetry, official India Meteorological Department (IMD) warning feeds, browser GPS geolocation, instant 5-language translation (English, Telugu, Hindi, Tamil, Kannada), voice interfaces, and anonymous browser-persistent chat sessions.

---

## 🌟 Key Features

- ⚡ **Direct Humanoid Weather Intelligence**: Natural-language conversational answers explaining exact rainfall likelihood, temperature curves, and actionable advice (*"What you CAN do"* vs *"What to AVOID"*).
- 🌐 **100% Full-Page & Chat Translation**: Instant 1-click translation across **English, తెలుగు (Telugu), हिन्दी (Hindi), தமிழ் (Tamil), and ಕನ್ನಡ (Kannada)**. Translates user questions, AI responses, live telemetry, IMD status, and input placeholders with 0ms sub-caching.
- 💾 **Anonymous Browser-Persistent Chat (Supabase)**: Conversations persist seamlessly in the browser across refreshes without requiring any login or signup. Includes 1-click **🔗 Save recovery link** to restore chats on any device.
- 📍 **GPS & Multi-City Geocoding**: Automatic browser GPS detection with manual search support for over 750+ Indian districts and global locations.
- ⚠️ **Official IMD Alert Integration**: Real-time warnings directly synchronized with India Meteorological Department severity classifications (Green, Yellow, Orange, Red).
- 🎙️ **Voice & Speech Interface**: Minimalist microphone voice input with natural text-to-speech audio readout in your selected language.
- 🌙 **Modern Dark / Light Cockpit**: Responsive UI featuring dynamic weather widgets, hourly precipitation graphs, and glassmorphism styling.

---

## 🏗️ Architecture & Service Topology

```
                         [ User Browser / Client ]
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
       Frontend Cockpit (Vite)               Supabase Anonymous Persistence
       Port: 5173                            (Zero-Login Sessions & Recovery)
                 │
                 ▼  (HTTP Proxy /api)
       Backend Gateway (Express)
       Port: 3000
                 │
      ┌──────────┴──────────────┬────────────────────────┬──────────────────────┐
      ▼                         ▼                        ▼                      ▼
Open-Meteo & IMD          Python LLM Service       Google Translate API     Edge / Web
Weather Observation      (Gemini 2.5 Grounded)     (Sub-100ms Translation)  Speech STT/TTS
Data Normalizer           Port: 8001
```

### Canonical Network Ports

| Service | Port | Protocol | Description |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | `5173` | HTTP | Single-Page Cockpit (`http://localhost:5173`) |
| **Backend API Gateway** | `3000` | HTTP | Express REST API (`/api/ask`, `/api/weather`, `/api/translate`) |
| **Multilingual LLM** | `8001` | HTTP | Python FastAPI / Gemini Intelligence microservice |
| **Edge Voice Proxy** | `5050` | HTTP | Neural voice synthesis proxy |

---

## 📁 Repository Structure

```
Weathergpt/
├── backend/                  # Express REST API gateway & route controllers
│   ├── routes/               # /api/ask, /api/weather, /api/location, /api/tts
│   ├── server.js             # Main backend server entry point
│   └── package.json          # Backend dependencies
├── frontend/                 # Vite Single-Page Application
│   ├── components/           # UI components (ChatView, InputBar, LocationBar, Header, SplashScreen)
│   ├── css/                  # Styling & glassmorphism theme system
│   ├── services/             # Supabase client, API client, Speech synthesis
│   ├── utils/                # Multilingual i18n dictionaries & date formatters
│   ├── app.js                # App orchestration & session restoration
│   └── package.json          # Frontend dependencies
├── llm/                      # Python Gemini intelligence layer
│   ├── generator.py          # Grounded prompt engineering & translation engine
│   ├── server.py             # FastAPI microservice on port 8001
│   └── requirements.txt      # Python dependencies
├── data/                     # Weather APIs & IMD advisory scrapers
├── alerts/                   # Alert classification engine
├── location/                 # Geocoding database (750+ Indian districts)
├── voice/                    # Speech-to-Text & Text-to-Speech handlers
├── start.js                  # Unified 1-command startup orchestrator
├── .env.example              # Environment variables template
└── README.md                 # Complete documentation
```

---

## 🚀 Quick Start Guide

Follow these simple steps to run the complete application locally.

### 1. Prerequisites

Make sure you have the following installed on your machine:
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **Python**: v3.10 or higher ([Download Python](https://python.org/))
- **Git**: ([Download Git](https://git-scm.com/))

---

### 2. Clone the Repository

```bash
git clone https://github.com/thrishi1011/Weathergpt.git
cd Weathergpt
```

---

### 3. Configure Environment Variables

Create your `.env` file in the root directory by copying `.env.example`:

```bash
# On Linux / macOS / Git Bash:
cp .env.example .env

# On Windows PowerShell:
copy .env.example .env
```

Open `.env` and configure your API keys:

```env
PORT=3000
LLM_PORT=8001
GEMINI_API_KEY=your_gemini_api_key_here
LLM_MODEL=gemini-2.5-flash
SUPABASE_URL=https://xcpcuqzaoocbqieqnrec.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

> **Note**: If you do not provide a `GEMINI_API_KEY`, WeatherGPT includes an automated interactive demo fallback mode adhering to the shared API contract.

---

### 4. Install Dependencies

Install all dependencies with a few commands:

```bash
# Install root & backend dependencies
npm install
npm --prefix backend install
npm --prefix frontend install

# Install Python LLM dependencies
pip install -r llm/requirements.txt
```

---

### 5. Launch the Application (1 Single Command!)

Run the unified runner from the project root:

```bash
node start.js
```
*(Or use `npm start` / `npm run dev`)*

This single command automatically launches:
1. **Backend API Gateway** on `http://localhost:3000`
2. **Python LLM Service** on `http://127.0.0.1:8001`
3. **Vite Frontend UI** on `http://localhost:5173`

---

### 6. Open WeatherGPT in Your Browser

Navigate to:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 💡 How It Works

1. **Animated Loading Screen**: At startup, you are greeted with the animated Weather clouds emblem before smoothly entering the Chat Cockpit.
2. **Ask Weather Questions**: Type or speak any query:
   - *"Will it rain today in Warangal?"*
   - *"Is it safe to spray pesticides on cotton crops this afternoon?"*
   - *"Can I plan outdoor travel to Hyderabad tomorrow evening?"*
3. **Instant Multilingual Switch**: Click any language pill at the top (**English**, **తెలుగు**, **हिन्दी**, **தமிழ்**, **ಕನ್ನಡ**). The entire interface, live telemetry, and all past chat messages instantly convert into the selected language.
4. **Persistent History**: Refresh the page or close your browser—your chat history is silently restored through Supabase anonymous authentication. Click **🔗 Save recovery link** to copy a bookmarkable URL.

---

## 🧪 Testing

Run the automated test suites:

```bash
# Run End-to-End backend test
npm test

# Run all test suites (Backend, Geocoding & Alerts)
npm run test:all
```

---
