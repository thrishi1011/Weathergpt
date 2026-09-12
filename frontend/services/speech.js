/**
 * WeatherGPT Speech Service
 * Voice hooks for Speech-to-Text (STT) and Text-to-Speech (TTS)
 */

// BCP 47 language mapping for Indian & global contexts
const LANG_MAP = {
  'en': 'en-IN',
  'te': 'te-IN',
  'hi': 'hi-IN',
  'ta': 'ta-IN',
  'kn': 'kn-IN',
  'ml': 'ml-IN'
};

class SpeechService {
  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = SpeechRecognition ? new SpeechRecognition() : null;
    this.isListening = false;
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.onListeningChange = null;
    this.onTranscript = null;
    this.onError = null;

    if (this.recognition) {
      this.recognition.continuous = false;
      this.recognition.interimResults = true;

      this.recognition.onstart = () => {
        this.isListening = true;
        if (this.onListeningChange) this.onListeningChange(true);
      };

      this.recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (this.onTranscript) {
          this.onTranscript(transcript);
        }
      };

      this.recognition.onerror = (event) => {
        console.warn('[Speech] Recognition error:', event.error);
        this.isListening = false;
        if (this.onListeningChange) this.onListeningChange(false);
        if (this.onError) {
          let userMsg = 'Microphone error occurred.';
          if (event.error === 'not-allowed') userMsg = 'Microphone permission denied. Please allow microphone access in browser.';
          if (event.error === 'no-speech') userMsg = 'No speech detected. Please try speaking again.';
          this.onError(userMsg);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.onListeningChange) this.onListeningChange(false);
      };
    }
  }

  isSttSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  isTtsSupported() {
    return 'speechSynthesis' in window;
  }

  startListening({ language = 'en', onTranscript, onListeningChange, onError }) {
    if (!this.recognition) {
      if (onError) onError('Speech recognition is not supported in this browser. Please use Google Chrome or Edge.');
      return false;
    }

    if (this.isListening) {
      this.stopListening();
      return false;
    }

    // Stop TTS if speaking
    this.stopSpeaking();

    this.onTranscript = onTranscript;
    this.onListeningChange = onListeningChange;
    this.onError = onError;

    this.recognition.lang = LANG_MAP[language] || 'en-IN';
    try {
      this.recognition.start();
      return true;
    } catch (err) {
      console.warn('[Speech] Failed to start recognition:', err);
      return false;
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        // Ignore stop error
      }
      this.isListening = false;
      if (this.onListeningChange) this.onListeningChange(false);
    }
  }

  speakText({ text, language = 'en', onStart, onEnd, onError }) {
    if (!this.isTtsSupported()) {
      if (onError) onError('Text-to-speech is not supported in this browser.');
      return;
    }

    this.stopSpeaking();

    if (!text || !text.trim()) return;

    // Clean markdown asterisks or code formatting from spoken text
    const cleanText = text.replace(/[*_#`~]/g, '').trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const targetLang = LANG_MAP[language] || 'en-IN';
    utterance.lang = targetLang;
    utterance.rate = 0.95; // Clear natural tempo
    utterance.pitch = 1.0;

    // Try finding matching voice
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang === targetLang || v.lang.startsWith(language));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
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
      if (onError) onError('Text-to-speech error occurred.');
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  stopSpeaking() {
    if (this.isTtsSupported() && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
    }
  }
}

export const speechService = new SpeechService();
