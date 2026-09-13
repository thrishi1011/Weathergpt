# WeatherGPT — Voice Module

Spoken voice interface for WeatherGPT. Provides speech-to-text (STT) input and two-tier text-to-speech (TTS) output with support for English (India), Hindi, and Telugu.

---

## 1. Features

- **Languages Supported:**
  - `en-IN` (English - India)
  - `hi-IN` (हिंदी - Hindi)
  - `te-IN` (తెలుగు - Telugu)
- **Speech-to-Text (STT):**
  - Native browser Web Speech API (`webkitSpeechRecognition` / `SpeechRecognition`).
  - Real-time interim and final transcription streaming.
  - Graceful handling of microphone permissions, no-speech timeouts, and browser incompatibilities.
- **Hybrid Two-Tier Text-to-Speech (TTS):**
  - **Tier 1 (Native SpeechSynthesis):** Instant, zero-latency playback using local OS/browser voices.
  - **Tier 2 (Edge TTS Proxy Fallback):** High-quality neural voices (`te-IN-ShrutiNeural`, `hi-IN-SwaraNeural`, `en-IN-NeerjaNeural`) with **no API keys needed**, ensuring missing desktop Telugu/Hindi voices speak reliably.
- **Decoupled Backend Client:**
  - Mock backend client `askBackend()` matching `POST /api/ask` (`shared/api-contract.md`).
  - Swappable to live backend with a single config flag.
- **Standalone UI:**
  - React component: `VoiceControls.jsx`
  - Zero-dependency HTML test page: `index.html`

---

## 2. File Structure

```
voice/
├── components/
│   ├── VoiceControls.jsx     # React voice interface component
│   └── VoiceControls.css     # Dark mode, responsive design & visualizers
├── mock/
│   └── mockAsk.js            # Mock client for POST /api/ask (swappable)
├── server/
│   └── tts-proxy.js          # Edge TTS proxy server (no API key needed)
├── stt/
│   └── speechToText.js       # Browser Web Speech API manager
├── tts/
│   ├── nativeTTS.js          # Tier 1: window.speechSynthesis
│   ├── edgeTTSFallback.js    # Tier 2: Calls local Edge TTS proxy
│   └── ttsRouter.js          # Hybrid Tier 1 -> Tier 2 orchestrator
├── utils/
│   └── languageSupport.js    # Browser capabilities & voice detection
├── index.html                # Standalone browser test harness
├── package.json              # Standalone dependencies for proxy server
├── test-runner.js            # Node unit test runner
└── README.md                 # Documentation
```

---

## 3. Quick Start (Standalone Mode)

### Step 1: Install Dependencies
Inside the `voice/` folder:
```bash
npm install
```

### Step 2: Start the Edge TTS Proxy Server
Start the local fallback TTS proxy server on port `5050`:
```bash
npm start
```
The server will output:
```
=========================================
 WeatherGPT Edge TTS Proxy Server Running
 Port: http://localhost:5050
 Health: http://localhost:5050/health
 TTS: POST http://localhost:5050/api/tts
=========================================
```

### Step 3: Run the Standalone Test Harness
Open `voice/index.html` in Google Chrome or Microsoft Edge (directly via file:// or using a local static server like `npx serve .` or VS Code Live Server).

You can:
- Click language buttons to switch between English, Hindi, and Telugu.
- Click the mic button to speak a question (e.g. *"Will it rain tomorrow in Warangal?"* or *"వరంగల్‌లో రేపు వర్షం పడుతుందా?"*).
- Hear the answer synthesized automatically.
- Test Tier 1 vs Tier 2 diagnostic buttons in the test panel.

---

## 4. Running Validation & Unit Tests

To run the complete automated test suite (mock backend fidelity, language config, Edge neural voice generation, and boundary isolation):
```bash
npm test
```

### Capability Check (Level 1)
To inspect the browser's native STT/TTS capabilities and detect whether fallbacks are necessary:
- Open `voice/index.html` in Chrome / Edge.
- Click **"Run Capability Check (L1)"** or call `runCapabilityCheck()` in the browser DevTools console.
- Review the formatted diagnostic table for `en-IN`, `hi-IN`, and `te-IN`.

See [tests/validationMatrix.md](./tests/validationMatrix.md) for the cross-browser & cross-device compatibility matrix.

---

## 5. Integrating with Main WeatherGPT Application

### Integrating React Component into Frontend
Import and use `VoiceControls` in any React view:

```jsx
import VoiceControls from './voice/components/VoiceControls';

function App() {
  const handleAskComplete = (response) => {
    console.log('Spoken question answer:', response);
  };

  return (
    <div>
      <VoiceControls location="Warangal" onAskComplete={handleAskComplete} />
    </div>
  );
}
```

### Switching from Mock to Live Backend
In `voice/mock/mockAsk.js`:
1. Set `export const USE_MOCK = false;`
2. Ensure your backend provides the `POST /api/ask` endpoint defined in `shared/api-contract.md`:
```json
// Request:
{
  "question": "Will it rain tomorrow?",
  "location": "Warangal",
  "language": "en-IN"
}

// Response:
{
  "answer": "Rain is highly likely tomorrow in Warangal.",
  "language": "en-IN"
}
```

---

## 6. Error Handling Strategy

| Failure Case | Handling Behavior |
|---|---|
| **Microphone Permission Denied** | Displays clear alert prompting the user to grant microphone permissions in browser settings. |
| **STT Not Supported** | Detects lack of Web Speech API upfront and suggests using Chrome or Edge. |
| **No Speech Detected** | Prompts the user friendly message to try speaking again. |
| **Missing Native Voice (e.g., Telugu)** | `ttsRouter.js` automatically cascades from Tier 1 to Tier 2 (Edge TTS Proxy) seamlessly. |
| **Edge TTS Proxy Offline** | Shows user-friendly message (`"Edge TTS proxy server is unreachable. Please ensure npm start is running in voice/"`) and logs developer diagnostics. |
| **Backend API Down** | Shows friendly connectivity alert without fabricating weather data. |
