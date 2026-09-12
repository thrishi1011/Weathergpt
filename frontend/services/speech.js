/**
 * WeatherGPT Speech Service
 * Pure Gemini AI Multilingual Speech-to-Text (STT) + Neural Indic TTS.
 *
 * Design:
 *  1. Records high-fidelity microphone audio via MediaRecorder.
 *  2. Real-time Voice Activity Detection (VAD) detects when the user speaks and pauses.
 *  3. On pause (or mic button click), the audio is sent to /api/transcribe.
 *  4. Gemini AI detects the spoken language and transcribes accurately in native script.
 *  5. Never uses browser English STT to avoid typing random English words or phonetic gibberish.
 *  6. Supports Telugu, Hindi, English, Tamil, Kannada, Malayalam, Bengali, Marathi, Gujarati, etc.
 */

// BCP-47 language codes for TTS & language mapping
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
 */
export function detectScriptLanguage(str) {
  if (!str) return 'en';

  // 1. Unicode script detection (authoritative)
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
  const tamilPatterns = /\b(mazhai|peyyuma|peyyum|eppadi|irukku|irukkum|solunga|inraikku|naalai|veppam|vanakkam)\b/i;
  const kannadaPatterns = /\b(male|barutha|baruttadha|hegidhe|hegide|heli|ee dina|naale|havamana|bisi|namaskara)\b/i;
  const marathiPatterns = /\b(paus|padel|udya|kasa|aahe|havaman|kiti|sang)\b/i;
  const gujaratiPatterns = /\b(varsad|padse|aaje|kaale|kevo|havaman)\b/i;
  const bengaliPatterns = /\b(bristi|hobe|kemon|aajke|kaalke|abohawa)\b/i;
  const malayalamPatterns = /\b(mazha|peyyum|engane|undu|innu|naale|kaalanila)\b/i;

  if (teluguPatterns.test(lower)) return 'te';
  if (hindiPatterns.test(lower)) return 'hi';
  if (tamilPatterns.test(lower)) return 'ta';
  if (kannadaPatterns.test(lower)) return 'kn';
  if (marathiPatterns.test(lower)) return 'mr';
  if (gujaratiPatterns.test(lower)) return 'gu';
  if (bengaliPatterns.test(lower)) return 'bn';
  if (malayalamPatterns.test(lower)) return 'ml';

  return 'en';
}

class SpeechService {
  constructor() {
    this.mediaRecorder     = null;
    this.mediaStream       = null;
    this.audioContext      = null;
    this.audioChunks       = [];
    this.isListening       = false;
    this.isProcessing      = false;
    this.isSpeaking        = false;
    this.currentAudio      = null;
    this.currentUtterance  = null;
    this.onListeningChange = null;
    this.onTranscript      = null;
    this.onLanguageDetect  = null;
    this.onPauseComplete   = null;
    this.onStatusText      = null;
    this.onError           = null;
    this.activeLang        = 'en';
    this._vadAnimId        = null;
    this._maxDurationTimer = null;
  }

  isSttSupported() {
    return typeof window !== 'undefined' &&
      (Boolean(window.navigator?.mediaDevices?.getUserMedia) ||
       Boolean(window.MediaRecorder));
  }

  isTtsSupported() {
    return typeof window !== 'undefined' &&
      ('Audio' in window || 'speechSynthesis' in window);
  }

  /**
   * Start recording user speech via MediaRecorder with live Voice Activity Detection.
   */
  async startListening({ language = 'en', onTranscript, onLanguageDetect, onListeningChange, onPauseComplete, onStatusText, onError } = {}) {
    if (this.isListening || this.isProcessing) {
      await this.stopListening();
    }

    this.stopSpeaking();

    this.onTranscript      = onTranscript;
    this.onLanguageDetect  = onLanguageDetect;
    this.onListeningChange = onListeningChange;
    this.onPauseComplete   = onPauseComplete;
    this.onStatusText      = onStatusText;
    this.onError           = onError;
    this.activeLang        = language || 'en';
    this.audioChunks       = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (this.onError) this.onError('Microphone access is not supported in this browser. Please use Chrome or Edge.');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      this.mediaStream = stream;

      // Determine best audio mime type supported by browser
      let mimeType = 'audio/webm;codecs=opus';
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          if (MediaRecorder.isTypeSupported('audio/webm')) {
            mimeType = 'audio/webm';
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          } else {
            mimeType = '';
          }
        }
      }

      const recorderOptions = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, recorderOptions);
      this.mediaRecorder = recorder;
      this.isListening   = true;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      recorder.start(100); // 100ms timeslices for reliable chunk buffering

      if (this.onListeningChange) {
        this.onListeningChange(true);
      }
      if (this.onStatusText) {
        this.onStatusText('🎙️ Listening… speak in your language');
      }

      // Initialize live Voice Activity Detection (VAD) via Web Audio API
      this._startVAD(stream);

      // Safety timeout: max 12 seconds per utterance
      this._maxDurationTimer = setTimeout(() => {
        if (this.isListening) {
          console.log('[Speech] Max recording duration reached. Stopping.');
          this.stopListening();
        }
      }, 12000);

      return true;
    } catch (err) {
      console.warn('[Speech] Error starting audio recording:', err);
      this._cleanupAudio();
      this.isListening = false;
      if (this.onListeningChange) this.onListeningChange(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        if (this.onError) {
          this.onError('Microphone permission denied. Please allow microphone access in your browser address bar.');
        }
      } else {
        if (this.onError) {
          this.onError(`Microphone error: ${err.message || 'could not record audio'}`);
        }
      }
      return false;
    }
  }

  /**
   * Real-time Voice Activity Detection using AnalyserNode.
   * Tracks user speech volume and triggers transcription after a natural pause.
   */
  _startVAD(stream) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      this.audioContext = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      let silenceStartTime = null;
      let hasSpoken = false;

      const checkVolume = () => {
        if (!this.isListening) return;

        analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const avg = sum / buffer.length;

        // Human speech volume threshold
        if (avg > 14) {
          if (!hasSpoken) {
            hasSpoken = true;
            if (this.onStatusText) {
              this.onStatusText('🎙️ Hearing your voice… keep speaking');
            }
          }
          silenceStartTime = null;
        } else if (hasSpoken) {
          // Speech was active, now silent
          if (!silenceStartTime) {
            silenceStartTime = Date.now();
          } else if (Date.now() - silenceStartTime > 2200) {
            // 2.2 seconds of silence after speaking -> user finished asking question!
            console.log('[Speech] Natural pause detected after speech. Auto-transcribing with Gemini AI.');
            this.stopListening();
            return;
          }
        }

        this._vadAnimId = requestAnimationFrame(checkVolume);
      };

      this._vadAnimId = requestAnimationFrame(checkVolume);
    } catch (e) {
      console.warn('[Speech] VAD init notice:', e);
    }
  }

  setLanguage(language) {
    this.activeLang = language || 'en';
  }

  /**
   * Stop recording and send the actual audio to Gemini API for native script transcription & language detection.
   */
  async stopListening() {
    if (!this.isListening && !this.isProcessing) return;

    if (this._maxDurationTimer) {
      clearTimeout(this._maxDurationTimer);
      this._maxDurationTimer = null;
    }
    if (this._vadAnimId) {
      cancelAnimationFrame(this._vadAnimId);
      this._vadAnimId = null;
    }

    this.isListening = false;
    this.isProcessing = true;

    if (this.onListeningChange) {
      this.onListeningChange(false);
    }

    if (this.onStatusText) {
      this.onStatusText('✨ Transcribing with Gemini AI in native script…');
    }

    // Collect audio blob from MediaRecorder
    let audioBlob = null;
    let mimeType = 'audio/webm';

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        await new Promise((resolve) => {
          this.mediaRecorder.onstop = () => resolve();
          this.mediaRecorder.stop();
        });
        mimeType = this.mediaRecorder.mimeType || 'audio/webm';
        if (this.audioChunks.length > 0) {
          audioBlob = new Blob(this.audioChunks, { type: mimeType });
        }
      } catch (err) {
        console.warn('[Speech] MediaRecorder stop notice:', err);
      }
    }

    this._cleanupAudio();

    // Verify audio exists and has sufficient bytes
    if (!audioBlob || audioBlob.size < 1200) {
      this.isProcessing = false;
      console.log('[Speech] Audio empty or too short:', audioBlob?.size);
      if (this.onError) {
        this.onError('No speech detected. Please press the mic and speak your question.');
      }
      return;
    }

    // Send actual microphone audio to backend /api/transcribe -> Gemini
    try {
      const base64Audio = await this._blobToBase64(audioBlob);
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: base64Audio,
          mime_type: mimeType
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const transcript = (data.text || data.transcript || '').trim();
      const detectedLang = data.language || data.language_code || detectScriptLanguage(transcript);

      if (transcript) {
        console.log(`[Speech] Gemini Transcription SUCCESS: "${transcript}" (language: ${detectedLang})`);
        if (this.onTranscript) this.onTranscript(transcript);
        if (this.onLanguageDetect) this.onLanguageDetect(detectedLang);
        if (this.onPauseComplete) this.onPauseComplete(transcript, detectedLang);
      } else {
        if (this.onError) {
          this.onError('No speech detected. Please try again.');
        }
      }
    } catch (err) {
      console.error('[Speech] Gemini transcription error:', err);
      if (this.onError) {
        this.onError('Transcription service temporarily unavailable. Please type your question or try again.');
      }
    } finally {
      this.isProcessing = false;
    }
  }

  _cleanupAudio() {
    if (this._vadAnimId) {
      cancelAnimationFrame(this._vadAnimId);
      this._vadAnimId = null;
    }
    if (this.audioContext) {
      try { this.audioContext.close(); } catch (_) {}
      this.audioContext = null;
    }
    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach(t => t.stop());
      } catch (_) {}
      this.mediaStream = null;
    }
    this.mediaRecorder = null;
  }

  _blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        const base64 = typeof result === 'string' ? (result.split(',')[1] || result) : '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Speak text using Neural backend TTS or browser SpeechSynthesis.
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

    try {
      const audioUrl = `/api/tts?text=${encodeURIComponent(cleanText)}&language=${encodeURIComponent(bcp47)}`;
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;
      this.isSpeaking   = true;

      audio.onplay   = () => { if (onStart) onStart(); };
      audio.onended  = () => { this.isSpeaking = false; this.currentAudio = null; if (onEnd) onEnd(); };
      audio.onerror  = () => {
        this.currentAudio = null;
        this._speakNativeFallback({ cleanText, bcp47, onStart, onEnd, onError });
      };

      await audio.play();
      return;
    } catch (err) {
      console.warn('[Speech] Neural TTS playback fallback:', err);
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
