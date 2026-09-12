/**
 * WeatherGPT Speech Service
 * Speech-to-Text (STT) with auto language detection and Neural Indic TTS.
 *
 * Key behaviours:
 *  - Pressing mic immediately listens and auto-types into the input box in real-time
 *  - Auto-detects spoken language (Telugu, Hindi, English, etc.) from Unicode scripts & transliterations
 *  - Captures single/multi-phrase utterances cleanly without crashing or overlapping sessions
 *  - Auto-finalizes after ~3.5 seconds of silence or when user presses send
 *  - Neural Indic TTS via /api/tts backend (Hindi, Telugu, Tamil, Kannada, English…)
 */

// BCP-47 language codes for SpeechRecognition
export const STT_LANG_MAP = {
  en: 'en-IN',
  te: 'te-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  pa: 'pa-IN',
  or: 'or-IN',
  ur: 'ur-PK',
};

// Map from 2-letter code to BCP-47 for TTS
export const TTS_LANG_MAP = {
  en: 'en-IN',
  te: 'te-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  pa: 'pa-IN',
  or: 'or-IN',
  ur: 'ur-PK',
};

/**
 * Detect the written script / language from Unicode codepoints & common Indian transliteration words.
 * Returns a 2-letter ISO code: 'te', 'hi', 'en', etc.
 */
export function detectScriptLanguage(str) {
  if (!str) return 'en';

  // 1. Unicode script detection (high confidence)
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

  // 2. Transliteration / Romanized keyword detection
  const lower = str.toLowerCase();
  const teluguPatterns = /\b(varsham|paduthunda|padtunda|eroju|repu|ninna|ela|undhi|undha|vathavaranam|raithu|polam|pantalu|gali|chali|yela|telugu|cheppu)\b/i;
  const hindiPatterns = /\b(mausam|kaisa|barish|hogi|aaj|kal|kisan|fasal|tapman|hawa|garmi|sardi|kya|batao|hoga|rahega|hindi|bataiye)\b/i;

  if (teluguPatterns.test(lower)) return 'te';
  if (hindiPatterns.test(lower)) return 'hi';

  return 'en';
}

class SpeechService {
  constructor() {
    this.recognition       = null;
    this.isListening       = false;
    this.isSpeaking        = false;
    this.currentAudio      = null;
    this.currentUtterance  = null;
    this.onListeningChange = null;
    this.onTranscript      = null;
    this.onLanguageDetect  = null;
    this.onPauseComplete   = null;
    this.onError           = null;
    this.silenceTimeout    = null;
    this.currentText       = '';
    this.activeLang        = 'en-IN';
    this._restartTimer     = null;
    this._allowRestart     = false;
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
   * Start listening to voice input and auto-type into the target UI.
   *
   * @param {Object} opts
   * @param {string}   [opts.language='en']     - 2-letter lang code ('en', 'te', 'hi'...)
   * @param {Function} opts.onTranscript        - called with live text while speaking
   * @param {Function} opts.onLanguageDetect    - called when language is detected
   * @param {Function} opts.onListeningChange   - called with boolean
   * @param {Function} opts.onPauseComplete     - called with (finalTranscript, detectedLang)
   * @param {Function} opts.onError             - called with friendly error message
   */
  startListening({ language = 'en', onTranscript, onLanguageDetect, onListeningChange, onPauseComplete, onError } = {}) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (onError) onError('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return false;
    }

    // Stop any existing recognition cleanly
    if (this.isListening) {
      this.stopListening();
    }

    // Stop ongoing TTS before listening
    this.stopSpeaking();

    // Store callbacks
    this.onTranscript      = onTranscript;
    this.onLanguageDetect  = onLanguageDetect;
    this.onListeningChange = onListeningChange;
    this.onPauseComplete   = onPauseComplete;
    this.onError           = onError;

    this.currentText       = '';
    this.isListening       = true;
    this._allowRestart     = true;
    this.activeLang        = STT_LANG_MAP[language] || 'en-IN';

    if (this.onListeningChange) {
      this.onListeningChange(true);
    }

    this._spawnRecognition(SpeechRecognition);
    return true;
  }

  /** Change language on the fly while listening */
  setLanguage(language) {
    const newLang = STT_LANG_MAP[language] || 'en-IN';
    if (this.activeLang === newLang) return;
    this.activeLang = newLang;
    if (this.isListening) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this._spawnRecognition(SpeechRecognition);
      }
    }
  }

  /** Internal: spawn a clean SpeechRecognition instance */
  _spawnRecognition(SpeechRecognition) {
    if (!this.isListening) return;

    // Clean up any previous recognition instance completely
    if (this.recognition) {
      const old = this.recognition;
      this.recognition = null;
      old.onstart = null;
      old.onresult = null;
      old.onerror = null;
      old.onend = null;
      try { old.abort(); } catch (_) {}
    }

    const rec = new SpeechRecognition();
    rec.continuous      = false; // single utterance per session avoids localhost socket timeouts
    rec.interimResults  = true;  // delivers live speech as the user speaks!
    rec.maxAlternatives = 1;
    rec.lang            = this.activeLang;
    this.recognition    = rec;

    let sessionFinal = '';
    let sessionInterim = '';

    const resetSilence = () => {
      if (this.silenceTimeout) {
        clearTimeout(this.silenceTimeout);
        this.silenceTimeout = null;
      }
      this.silenceTimeout = setTimeout(() => {
        console.log('[Speech] 3.5s pause detected. Finalizing transcript.');
        this._allowRestart = false;
        const textToFinalize = this.currentText.trim();
        this.stopListening();
        if (textToFinalize && this.onPauseComplete) {
          const detected = detectScriptLanguage(textToFinalize);
          this.onPauseComplete(textToFinalize, detected);
        }
      }, 3500);
    };

    rec.onstart = () => {
      console.log(`[Speech] Microphone listening started (language: ${rec.lang})`);
    };

    rec.onresult = (event) => {
      sessionInterim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          sessionFinal += item[0].transcript + ' ';
        } else {
          sessionInterim += item[0].transcript;
        }
      }

      // Combine previous speech + this session's speech
      const combined = (this.currentText ? this.currentText + ' ' : '') + sessionFinal + sessionInterim;
      const clean = combined.replace(/\s+/g, ' ').trim();

      if (clean) {
        // Auto-type directly into input bar in real time!
        if (this.onTranscript) {
          this.onTranscript(clean);
        }

        // Auto-detect language
        const detected = detectScriptLanguage(clean);
        if (detected && this.onLanguageDetect) {
          this.onLanguageDetect(detected);
        }

        // Reset the silence pause timer
        resetSilence();
      }
    };

    rec.onerror = (event) => {
      console.warn('[Speech] Recognition error:', event.error);

      // Benign non-errors (silence or aborted by user)
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }

      // If user has already spoken text, preserve it and finalize cleanly!
      const captured = (this.currentText + ' ' + sessionFinal + ' ' + sessionInterim).trim();
      if (captured) {
        this._allowRestart = false;
        this.stopListening();
        if (this.onPauseComplete) {
          this.onPauseComplete(captured, detectScriptLanguage(captured));
        }
        return;
      }

      // Network error on localhost (Google Speech server unreachable)
      if (event.error === 'network') {
        console.warn('[Speech] Network error connecting to speech recognition server.');
        this._allowRestart = false;
        this.stopListening();
        if (this.onError) {
          this.onError('Speech network service unreachable. Please ensure internet access or type your question.');
        }
        return;
      }

      // Permission or hardware errors
      this._allowRestart = false;
      this.stopListening();
      let msg = 'Voice input error. Please try again.';
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        msg = 'Microphone permission denied. Please allow microphone access in your browser.';
      } else if (event.error === 'audio-capture') {
        msg = 'No microphone detected or microphone is currently in use.';
      }
      if (this.onError) {
        this.onError(msg);
      }
    };

    rec.onend = () => {
      // Accumulate any final text from this session
      if (sessionFinal.trim()) {
        this.currentText = (this.currentText ? this.currentText + ' ' : '') + sessionFinal.trim();
        this.currentText = this.currentText.trim();
      }

      // If finished or stopped listening, close down cleanly
      if (!this.isListening || !this._allowRestart) {
        if (this.isListening) {
          this.stopListening();
        }
        return;
      }

      // If session ended naturally (pause in speech) and we're still listening,
      // restart cleanly after 150ms to allow multi-sentence speaking
      clearTimeout(this._restartTimer);
      this._restartTimer = setTimeout(() => {
        if (this.isListening && this._allowRestart) {
          this._spawnRecognition(SpeechRecognition);
        }
      }, 150);
    };

    try {
      rec.start();
    } catch (err) {
      console.error('[Speech] Failed to start recognition:', err);
      const captured = this.currentText.trim();
      if (captured && this.onPauseComplete) {
        this.onPauseComplete(captured, detectScriptLanguage(captured));
      } else if (this.onError) {
        this.onError('Failed to start microphone. Please click the mic button again.');
      }
      this.stopListening();
    }
  }

  /**
   * Stop listening and finalize any captured speech.
   */
  stopListening() {
    this._allowRestart = false;
    this.isListening   = false;

    if (this._restartTimer) {
      clearTimeout(this._restartTimer);
      this._restartTimer = null;
    }
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }

    if (this.recognition) {
      const rec = this.recognition;
      this.recognition = null;
      rec.onstart  = null;
      rec.onresult = null;
      rec.onerror  = null;
      rec.onend    = null;
      try { rec.abort(); } catch (_) {}
    }

    if (this.onListeningChange) {
      this.onListeningChange(false);
    }
  }

  /**
   * Speak text using Neural TTS (backend /api/tts) with Indic language support.
   * Falls back to browser SpeechSynthesis if backend TTS fails.
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
