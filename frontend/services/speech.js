/**
 * WeatherGPT Speech Service
 * High-fidelity Speech-to-Text (STT) and Neural Text-to-Speech (TTS)
 * Supports full authentic Indic pronunciation (Hindi, Telugu, Tamil, Kannada, English)
 */

// BCP 47 language mapping for Indian & global contexts
const LANG_MAP = {
  'en': 'en-IN',
  'te': 'te-IN',
  'hi': 'hi-IN',
  'ta': 'ta-IN',
  'kn': 'kn-IN',
  'ml': 'ml-IN',
  'bn': 'bn-IN',
  'mr': 'mr-IN'
};

class SpeechService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.isSpeaking = false;
    this.currentAudio = null;
    this.currentUtterance = null;
    this.onListeningChange = null;
    this.onTranscript = null;
    this.onError = null;
  }

  isSttSupported() {
    return typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  isTtsSupported() {
    return typeof window !== 'undefined' && ('Audio' in window || 'speechSynthesis' in window);
  }

  /**
   * Start listening to microphone with userMedia permission check & continuous capture
   */
  async startListening({ language = 'en', onTranscript, onListeningChange, onError }) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (onError) onError('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return false;
    }

    if (this.isListening) {
      this.stopListening();
      return false;
    }

    // Stop any ongoing speech readout before listening
    this.stopSpeaking();

    // 1. Request microphone permission explicitly to ensure hardware is active
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Immediately release tracks so recognition engine can bind to the device
        testStream.getTracks().forEach(track => track.stop());
      }
    } catch (permErr) {
      console.warn('[Speech] Microphone permission check warning:', permErr);
      if (onError) {
        onError('Microphone access denied. Please click the camera/microphone icon in your browser address bar and choose "Allow".');
      }
      return false;
    }

    this.onTranscript = onTranscript;
    this.onListeningChange = onListeningChange;
    this.onError = onError;

    // 2. Create a fresh recognition instance on every start to prevent stale engine states
    try {
      if (this.recognition) {
        try { this.recognition.abort(); } catch (_) {}
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;      // Keep listening while the user is speaking
      this.recognition.interimResults = true;  // Stream live transcript to input box
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = LANG_MAP[language] || 'en-IN';

      let accumulatedFinal = '';
      const SILENCE_DELAY_MS = 3500; // 3.5 seconds silence detection

      const resetSilenceTimer = (currentText) => {
        if (this.silenceTimeout) {
          clearTimeout(this.silenceTimeout);
          this.silenceTimeout = null;
        }
        if (!currentText || !currentText.trim()) return;

        this.silenceTimeout = setTimeout(() => {
          console.log('[Speech] 3.5s pause detected. Auto-stopping listening and finalizing text.');
          const finalTrimmed = currentText.trim();
          this.stopListening();
          if (onPauseComplete) {
            onPauseComplete(finalTrimmed);
          }
        }, SILENCE_DELAY_MS);
      };

      this.recognition.onstart = () => {
        this.isListening = true;
        accumulatedFinal = '';
        if (this.onListeningChange) this.onListeningChange(true);
      };

      this.recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            accumulatedFinal += item[0].transcript + ' ';
          } else {
            interim += item[0].transcript;
          }
        }

        const fullText = (accumulatedFinal + interim).trim();
        if (fullText && this.onTranscript) {
          this.onTranscript(fullText);
          resetSilenceTimer(fullText);
        }
      };

      this.recognition.onerror = (event) => {
        console.warn('[Speech] Recognition event error:', event.error);
        if (this.silenceTimeout) {
          clearTimeout(this.silenceTimeout);
          this.silenceTimeout = null;
        }
        
        // Suppress non-critical benign events
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }

        this.isListening = false;
        if (this.onListeningChange) this.onListeningChange(false);

        let userMsg = `Microphone error (${event.error}).`;
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          userMsg = 'Microphone permission denied. Please allow microphone access in your browser.';
        } else if (event.error === 'audio-capture') {
          userMsg = 'No microphone detected or microphone is currently muted/in use by another application.';
        } else if (event.error === 'network') {
          userMsg = 'Speech network service unreachable. Please ensure internet access or type your question.';
        }

        if (this.onError) this.onError(userMsg);
      };

      this.recognition.onend = () => {
        if (this.silenceTimeout) {
          clearTimeout(this.silenceTimeout);
          this.silenceTimeout = null;
        }
        this.isListening = false;
        if (this.onListeningChange) this.onListeningChange(false);
      };

      this.recognition.start();
      return true;
    } catch (startErr) {
      console.error('[Speech] Failed to start recognition instance:', startErr);
      this.isListening = false;
      if (this.onListeningChange) this.onListeningChange(false);
      if (onError) onError('Could not initialize speech recognition. Please try clicking the microphone again.');
      return false;
    }
  }

  stopListening() {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (_) {}
    }
    this.isListening = false;
    if (this.onListeningChange) this.onListeningChange(false);
  }

  /**
   * Speak text with authentic neural pronunciation
   * Plays full sentences in Hindi, Telugu, Tamil, Kannada, and English without letter-skipping
   */
  async speakText({ text, language = 'en', onStart, onEnd, onError }) {
    this.stopSpeaking();

    if (!text || !text.trim()) return;

    // Clean markdown asterisks, bolding, code syntax, and emojis
    const cleanText = text
      .replace(/[*_#`~]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const targetLang = LANG_MAP[language] || language;

    // Strategy 1: High-Fidelity Neural Indic Audio Stream via /api/tts
    try {
      const audioUrl = `/api/tts?text=${encodeURIComponent(cleanText)}&language=${encodeURIComponent(targetLang)}`;
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;
      this.isSpeaking = true;

      audio.onplay = () => {
        if (onStart) onStart();
      };

      audio.onended = () => {
        this.isSpeaking = false;
        this.currentAudio = null;
        if (onEnd) onEnd();
      };

      audio.onerror = () => {
        console.warn('[Speech] Neural TTS playback failed, attempting local browser SpeechSynthesis fallback...');
        this.currentAudio = null;
        this._speakNativeFallback({ cleanText, targetLang, onStart, onEnd, onError });
      };

      await audio.play();
      return;
    } catch (audioErr) {
      console.warn('[Speech] Audio element play error, falling back to SpeechSynthesis:', audioErr);
      this._speakNativeFallback({ cleanText, targetLang, onStart, onEnd, onError });
    }
  }

  /**
   * Fallback browser SpeechSynthesis
   */
  _speakNativeFallback({ cleanText, targetLang, onStart, onEnd, onError }) {
    if (!('speechSynthesis' in window)) {
      this.isSpeaking = false;
      if (onError) onError('Speech synthesis is not supported in this browser.');
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = targetLang;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const matched = voices.find(v => v.lang === targetLang || v.lang.startsWith(targetLang.split('-')[0]));
      if (matched) {
        utterance.voice = matched;
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        if (onStart) onStart();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      this.isSpeaking = false;
      if (onError) onError('Text-to-speech failed to start.');
      if (onEnd) onEnd();
    }
  }

  stopSpeaking() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (_) {}
      this.currentAudio = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
      this.currentUtterance = null;
    }

    this.isSpeaking = false;
  }
}

export const speechService = new SpeechService();
