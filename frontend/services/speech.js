/**
 * WeatherGPT Speech Service
 * Speech-to-Text (STT) with auto language detection and Neural TTS.
 *
 * Key behaviours:
 *  - Mic stays open until 3.5 seconds of silence (then auto-types into input)
 *  - Auto-detects spoken language from Unicode script in the transcript
 *  - Restarts recognition automatically if Chrome ends the session early (localhost quirk)
 *  - Neural Indic TTS via /api/tts backend (Hindi, Telugu, Tamil, Kannada…)
 */

// BCP-47 language codes used for SpeechRecognition.lang
// We start with 'en-IN' so Chrome picks up accented Indian English by default
// but we also accept speech in any language and detect it post-fact
const STT_LANG = 'en-IN';   // broad locale — Chrome still recognises Hindi/Telugu words in this mode

// Map from 2-letter code to BCP-47 for TTS
const TTS_LANG_MAP = {
  'en': 'en-IN',
  'te': 'te-IN',
  'hi': 'hi-IN',
  'ta': 'ta-IN',
  'kn': 'kn-IN',
  'ml': 'ml-IN',
  'bn': 'bn-IN',
  'mr': 'mr-IN',
  'gu': 'gu-IN',
  'pa': 'pa-IN',
  'or': 'or-IN',
  'ur': 'ur-PK',
};

/**
 * Detect the written script / language from Unicode codepoints.
 * Returns a 2-letter ISO code, or 'en' as default.
 */
export function detectScriptLanguage(str) {
  if (!str) return 'en';
  if (/[\u0C00-\u0C7F]/.test(str)) return 'te';   // Telugu
  if (/[\u0900-\u097F]/.test(str)) return 'hi';   // Devanagari (Hindi/Marathi)
  if (/[\u0B80-\u0BFF]/.test(str)) return 'ta';   // Tamil
  if (/[\u0C80-\u0CFF]/.test(str)) return 'kn';   // Kannada
  if (/[\u0D00-\u0D7F]/.test(str)) return 'ml';   // Malayalam
  if (/[\u0980-\u09FF]/.test(str)) return 'bn';   // Bengali
  if (/[\u0A80-\u0AFF]/.test(str)) return 'gu';   // Gujarati
  if (/[\u0A00-\u0A7F]/.test(str)) return 'pa';   // Punjabi (Gurmukhi)
  if (/[\u0B00-\u0B7F]/.test(str)) return 'or';   // Odia
  if (/[\u0600-\u06FF]/.test(str)) return 'ur';   // Urdu/Arabic
  return 'en';
}

class SpeechService {
  constructor() {
    this.recognition     = null;
    this.isListening     = false;
    this.isSpeaking      = false;
    this.currentAudio    = null;
    this.currentUtterance = null;
    this.onListeningChange = null;
    this.onTranscript    = null;
    this.onLanguageDetect = null;   // NEW: fires when language is detected from voice
    this.onPauseComplete = null;
    this.onError         = null;
    this.silenceTimeout  = null;
    this._accumulatedFinal = '';
    this._shouldKeepListening = false;  // controls the keep-alive restart loop
  }

  isSttSupported() {
    return typeof window !== 'undefined' &&
      Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  isTtsSupported() {
    return typeof window !== 'undefined' &&
      ('Audio' in window || 'speechSynthesis' in window);
  }

  /**
   * Start listening — stays open until 3.5 s of silence after any speech.
   *
   * @param {Object} opts
   * @param {Function} opts.onTranscript      - called with live transcript string while speaking
   * @param {Function} opts.onLanguageDetect  - called with detected 2-letter lang code
   * @param {Function} opts.onListeningChange - called with true/false
   * @param {Function} opts.onPauseComplete   - called with final transcript after silence
   * @param {Function} opts.onError           - called with user-friendly error string
   */
  async startListening({ onTranscript, onLanguageDetect, onListeningChange, onPauseComplete, onError }) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (onError) onError('Speech recognition is not supported. Please use Google Chrome or Microsoft Edge.');
      return false;
    }

    if (this.isListening) {
      this.stopListening();
      return false;
    }

    // Stop any ongoing TTS before recording
    this.stopSpeaking();

    // Request mic permission first — ensures hardware is ready before recognition starts
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
      }
    } catch (permErr) {
      if (onError) onError('Microphone access denied. Please allow microphone in your browser address bar and try again.');
      return false;
    }

    // Store callbacks
    this.onTranscript     = onTranscript;
    this.onLanguageDetect = onLanguageDetect;
    this.onListeningChange = onListeningChange;
    this.onPauseComplete  = onPauseComplete;
    this.onError          = onError;

    // Reset state
    this._accumulatedFinal    = '';
    this._shouldKeepListening = true;
    this.isListening          = true;
    if (onListeningChange) onListeningChange(true);

    // Start the recognition session (will auto-restart on early end)
    this._startSession(SpeechRecognition);
    return true;
  }

  /** Internal: create and start one SpeechRecognition session */
  _startSession(SpeechRecognition) {
    if (!this._shouldKeepListening) return;

    if (this.recognition) {
      try { this.recognition.abort(); } catch (_) {}
      this.recognition = null;
    }

    const rec = new SpeechRecognition();
    // continuous=false is more reliable on localhost (avoids network socket errors).
    // We compensate by auto-restarting in onend until silence detected.
    rec.continuous      = false;
    rec.interimResults  = true;
    rec.maxAlternatives = 1;
    rec.lang            = STT_LANG;

    this.recognition = rec;
    const SILENCE_MS = 3500;

    const resetSilenceTimer = (text) => {
      if (this.silenceTimeout) {
        clearTimeout(this.silenceTimeout);
        this.silenceTimeout = null;
      }
      if (!text || !text.trim()) return;

      this.silenceTimeout = setTimeout(() => {
        console.log('[Speech] Silence detected. Finalising transcript.');
        this._shouldKeepListening = false;
        this.stopListening();
        const finalText = this._accumulatedFinal.trim();
        if (finalText && this.onPauseComplete) {
          this.onPauseComplete(finalText, detectScriptLanguage(finalText));
        }
      }, SILENCE_MS);
    };

    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          this._accumulatedFinal += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }

      const fullText = (this._accumulatedFinal + interim).trim();
      if (fullText) {
        // Live transcript → update textarea immediately
        if (this.onTranscript) this.onTranscript(fullText);

        // Detect language from script and notify
        const lang = detectScriptLanguage(fullText);
        if (this.onLanguageDetect) this.onLanguageDetect(lang);

        // Restart silence timer
        resetSilenceTimer(fullText);
      }
    };

    rec.onerror = (event) => {
      console.warn('[Speech] Recognition error:', event.error);

      // If we have captured text, treat any error as a graceful end
      if (this._accumulatedFinal.trim()) {
        if (this.silenceTimeout) { clearTimeout(this.silenceTimeout); this.silenceTimeout = null; }
        this._shouldKeepListening = false;
        const finalText = this._accumulatedFinal.trim();
        this.isListening = false;
        if (this.onListeningChange) this.onListeningChange(false);
        if (this.onPauseComplete) {
          this.onPauseComplete(finalText, detectScriptLanguage(finalText));
        }
        return;
      }

      // Ignore benign abort/no-speech — let onend handle restart
      if (event.error === 'aborted' || event.error === 'no-speech') return;

      // Network error on localhost — restart quietly after short delay
      if (event.error === 'network') {
        console.log('[Speech] Network error on STT — restarting session...');
        setTimeout(() => this._startSession(SpeechRecognition), 300);
        return;
      }

      // Real errors — surface to user
      this._shouldKeepListening = false;
      this.isListening = false;
      if (this.silenceTimeout) { clearTimeout(this.silenceTimeout); this.silenceTimeout = null; }
      if (this.onListeningChange) this.onListeningChange(false);

      let msg = 'Voice input error. Please try again.';
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        msg = 'Microphone permission denied. Please allow microphone access in your browser.';
      } else if (event.error === 'audio-capture') {
        msg = 'No microphone detected. Please connect a microphone and try again.';
      }
      if (this.onError) this.onError(msg);
    };

    rec.onend = () => {
      // If silence timer already fired, we're done
      if (!this._shouldKeepListening) {
        // Ensure state is clean
        if (this.isListening) {
          this.isListening = false;
          if (this.onListeningChange) this.onListeningChange(false);
        }
        return;
      }

      // Still in listening mode → restart for another utterance
      // (Chrome ends a non-continuous session after each pause)
      if (this._accumulatedFinal.trim()) {
        // Already have text — restart so user can keep talking
        console.log('[Speech] Session ended mid-speech. Restarting for continued input...');
        setTimeout(() => this._startSession(SpeechRecognition), 100);
      } else {
        // Nothing captured yet — restart to wait for speech
        setTimeout(() => this._startSession(SpeechRecognition), 100);
      }
    };

    try {
      rec.start();
    } catch (err) {
      console.error('[Speech] Could not start recognition:', err);
      if (this.onError) this.onError('Could not start voice input. Please click the mic button again.');
      this._shouldKeepListening = false;
      this.isListening = false;
      if (this.onListeningChange) this.onListeningChange(false);
    }
  }

  stopListening() {
    this._shouldKeepListening = false;
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
    if (this.recognition) {
      try { this.recognition.stop(); } catch (_) {}
    }
    this.isListening = false;
    if (this.onListeningChange) this.onListeningChange(false);
  }

  /**
   * Speak text using Neural TTS (backend /api/tts) with Indic language support.
   * Falls back to browser SpeechSynthesis if the backend endpoint fails.
   */
  async speakText({ text, language = 'en', onStart, onEnd, onError }) {
    this.stopSpeaking();
    if (!text || !text.trim()) return;

    const cleanText = text
      .replace(/[*_#`~]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleanText) return;

    const bcp47 = TTS_LANG_MAP[language] || language;

    // Primary: neural backend TTS
    try {
      const audioUrl = `/api/tts?text=${encodeURIComponent(cleanText)}&language=${encodeURIComponent(bcp47)}`;
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;
      this.isSpeaking   = true;

      audio.onplay   = () => { if (onStart) onStart(); };
      audio.onended  = () => { this.isSpeaking = false; this.currentAudio = null; if (onEnd) onEnd(); };
      audio.onerror  = () => {
        this.currentAudio = null;
        console.warn('[Speech] Neural TTS failed, falling back to SpeechSynthesis');
        this._speakNativeFallback({ cleanText, bcp47, onStart, onEnd, onError });
      };

      await audio.play();
      return;
    } catch (err) {
      console.warn('[Speech] Audio.play() failed:', err);
      this._speakNativeFallback({ cleanText, bcp47, onStart, onEnd, onError });
    }
  }

  _speakNativeFallback({ cleanText, bcp47, onStart, onEnd, onError }) {
    if (!('speechSynthesis' in window)) {
      this.isSpeaking = false;
      if (onEnd) onEnd();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = bcp47;
      utterance.rate = 0.95;

      const voices = window.speechSynthesis.getVoices();
      const prefix = bcp47.split('-')[0];
      const matched = voices.find(v => v.lang === bcp47 || v.lang.startsWith(prefix));
      if (matched) utterance.voice = matched;

      utterance.onstart = () => { this.isSpeaking = true; if (onStart) onStart(); };
      utterance.onend   = () => { this.isSpeaking = false; this.currentUtterance = null; if (onEnd) onEnd(); };
      utterance.onerror = () => { this.isSpeaking = false; this.currentUtterance = null; if (onEnd) onEnd(); };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    }
  }

  stopSpeaking() {
    if (this.currentAudio) {
      try { this.currentAudio.pause(); this.currentAudio.currentTime = 0; } catch (_) {}
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
      this.currentUtterance = null;
    }
    this.isSpeaking = false;
  }
}

export const speechService = new SpeechService();
