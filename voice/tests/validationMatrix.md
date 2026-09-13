# WeatherGPT Voice Module — Validation & Device Support Matrix

This matrix documents the multi-level validation, browser compatibility, and known issues for the WeatherGPT voice module (`voice/`).

---

## 1. Level 4 — Cross-Browser & Cross-Device Compatibility Matrix

| Browser / Platform | STT `en-IN` | STT `hi-IN` | STT `te-IN` | TTS `en-IN` | TTS `hi-IN` | TTS `te-IN` | Notes & Fallback Behavior |
|---|---|---|---|---|---|---|---|
| **Chrome (Windows / macOS / Linux)** | ✅ | ✅ | ✅ | ✅ (Tier 1) | ✅ (Tier 1 / 2) | 🔁 (Tier 2 Fallback) | Desktop OS lacks native Telugu speech pack; Tier 2 Edge TTS fallback plays `te-IN-ShrutiNeural` flawlessly. |
| **Microsoft Edge (Desktop)** | ✅ | ✅ | ✅ | ✅ (Tier 1) | ✅ (Tier 1) | 🔁 (Tier 2 Fallback) | Edge TTS neural fallback seamlessly integrates. |
| **Mozilla Firefox (Desktop)** | ❌ | ❌ | ❌ | ✅ (Tier 1) | ✅ (Tier 1) | 🔁 (Tier 2 Fallback) | Web Speech STT is not supported natively in Firefox; UI automatically prompts user to use Chrome/Edge or text input. |
| **Safari (macOS / iOS)** | ❌ / ⚠️ | ❌ | ❌ | ✅ (Tier 1) | 🔁 (Tier 2) | 🔁 (Tier 2 Fallback) | Safari restricts Web Speech API. UI warns user and suggests Chrome. Tier 2 TTS works smoothly. |
| **Chrome (Android)** | ✅ | ✅ | ✅ | ✅ (Tier 1) | ✅ (Tier 1) | ✅ (Tier 1 / 2) | Full native Google Speech recognition & synthesis available for all 3 locales on Android. |
| **Safari (iOS 15+)** | ⚠️ | ❌ | ❌ | ✅ (Tier 1) | 🔁 (Tier 2) | 🔁 (Tier 2 Fallback) | Native TTS works for English; Hindi/Telugu seamlessly served by Edge TTS proxy. |

**Legend:**
- ✅ **Native Support** (Tier 1 Web Speech / SpeechSynthesis)
- 🔁 **Handled via Fallback** (Tier 2 Edge TTS Proxy with neural voices)
- ❌ **Not Supported by Browser** (Handled gracefully with user-friendly alert)
- ⚠️ **Limited / Partial Browser Support**

---

## 2. Level 2 & 3 — Functional Verification Checklist

### 2.1 Speech-to-Text (`speechToText.js`)
- [x] Starts listening when triggered and stops on silence or stop button click.
- [x] Returns correct transcript for sample sentences in `en-IN`.
- [x] Returns correct transcript for sample sentences in `hi-IN`.
- [x] Returns correct transcript for sample sentences in `te-IN`.
- [x] Dynamic language switching: `recognition.lang` updates immediately upon switching tabs (`en-IN` / `hi-IN` / `te-IN`).
- [x] Empty/no-speech event triggers user-friendly prompt to speak again without application crash.
- [x] Microphone permission denial triggers clear prompt without infinite retry loops.

### 2.2 Text-to-Speech Tier 1 (`nativeTTS.js`)
- [x] Dispatches hardcoded sentence in `en-IN` to native speech synthesizer.
- [x] Dispatches hardcoded sentence in `hi-IN` if native voice is present.
- [x] Rejects cleanly if native voice is missing so that `ttsRouter.js` can trigger Tier 2 without user interruption.

### 2.3 Text-to-Speech Tier 2 (`edgeTTSFallback.js` & `server/tts-proxy.js`)
- [x] Local proxy starts cleanly on port 5050.
- [x] Returns MP3 audio streams for `en-IN`, `hi-IN`, `te-IN`.
- [x] Uses natural neural voices (`te-IN-ShrutiNeural`, `hi-IN-SwaraNeural`, `en-IN-NeerjaNeural`).
- [x] Unreachable proxy or network failure displays clear instruction without crash.

### 2.4 Hybrid Router (`ttsRouter.js`)
- [x] Prefers Tier 1 when a native voice exists.
- [x] Cascades instantly to Tier 2 when no native voice is installed (e.g. Telugu on desktop).
- [x] Re-evaluates tier on language change.

### 2.5 Backend Client (`mockAsk.js`)
- [x] Follows `POST /api/ask` contract (`shared/api-contract.md`).
- [x] Answers in the requested locale script (`en-IN`, `hi-IN`, `te-IN`).
- [x] Strict isolation: All backend communication is gated through `askBackend()`.

---

## 3. Known-Issue & Improvement Log

| Issue | Language / Browser | Root Cause | Fix Applied | Status |
|---|---|---|---|---|
| Telugu native voice missing on desktop OS | Desktop Chrome / Edge | OS does not bundle native `te-IN` SpeechSynthesis voice | Built Tier 2 proxy using `msedge-tts` (`te-IN-ShrutiNeural`) which streams audio via HTML5 Audio | **Resolved** |
| Web Speech STT unsupported | Firefox / Safari | Web Speech API not implemented or restricted in browser | Added upfront `isSTTSupported()` check in UI and graceful guidance banner recommending Chrome/Edge | **Resolved** |
| Async voice loading race condition | All browsers | `speechSynthesis.getVoices()` is initially empty until `voiceschanged` event fires | Implemented `getAvailableVoices()` with async `voiceschanged` promise and 1.5s fallback | **Resolved** |
| Edge TTS Proxy offline alert | All browsers | User forgot to run `npm start` in `voice/` directory | Friendly error alert explaining exact command to start proxy server | **Resolved** |
