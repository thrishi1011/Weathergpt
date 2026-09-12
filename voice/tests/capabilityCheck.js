/**
 * voice/tests/capabilityCheck.js
 * Run in-browser (or wire into a debug page) to report STT/TTS support per language.
 */

export const REQUIRED_LANGUAGES = [
  { code: "en-IN", label: "English (India)" },
  { code: "hi-IN", label: "Hindi" },
  { code: "te-IN", label: "Telugu" },
];

/**
 * Checks Speech-to-Text browser API availability and notes.
 */
export function checkSTTSupport() {
  if (typeof window === "undefined") {
    return { apiAvailable: false, note: "Node.js environment - Web Speech API not available." };
  }

  const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  return {
    apiAvailable: supported,
    engine: window.SpeechRecognition ? "Standard SpeechRecognition" : (window.webkitSpeechRecognition ? "webkitSpeechRecognition" : "None"),
    note: supported
      ? "SpeechRecognition API present. Accuracy per language depends on browser locale pack."
      : "SpeechRecognition API NOT available in this browser. STT fallback UI will be displayed.",
  };
}

/**
 * Checks SpeechSynthesis browser API availability and voice matches per required language.
 */
export function checkTTSSupport() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return { apiAvailable: false, voices: [], note: "SpeechSynthesis API not available." };
  }

  const voices = window.speechSynthesis.getVoices();

  const results = REQUIRED_LANGUAGES.map(({ code, label }) => {
    const normalizedTarget = code.toLowerCase().replace("_", "-");
    const prefix = normalizedTarget.split("-")[0];

    const match = voices.find(
      (v) =>
        v.lang &&
        (v.lang.toLowerCase().replace("_", "-") === normalizedTarget ||
          v.lang.toLowerCase().replace("_", "-").startsWith(prefix))
    );

    return {
      language: label,
      code,
      nativeVoiceFound: !!match,
      matchedVoiceName: match ? `${match.name} (${match.lang})` : "None",
      fallbackNeeded: !match,
      recommendedTier: match ? "Tier 1 (Native SpeechSynthesis)" : "Tier 2 (Edge TTS Proxy Fallback)"
    };
  });

  return { apiAvailable: true, totalVoices: voices.length, voices: results };
}

/**
 * Runs complete capability check and outputs formatted diagnostic report.
 */
export function runCapabilityCheck() {
  if (typeof window === "undefined") {
    return { note: "Capability check must be executed in browser environment." };
  }

  const report = {
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    stt: checkSTTSupport(),
    tts: checkTTSSupport(),
  };

  if (console.table && report.tts.voices) {
    console.log("=== [WeatherGPT Voice Capability Check] ===");
    console.log("User Agent:", report.userAgent);
    console.log("STT Status:", report.stt);
    console.table(report.tts.voices);
  }

  return report;
}

// Auto-register listener in browser
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    runCapabilityCheck();
  };
}
