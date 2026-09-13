/**
 * Speech to Text (STT) Module
 * Browser Web Speech API (SpeechRecognition / webkitSpeechRecognition) wrapper.
 * Fully supports 'en-IN', 'hi-IN', 'te-IN' with comprehensive error handling.
 */

import { isSTTSupported, SUPPORTED_LANGUAGES, getBrowserCompatibilityNotice } from '../utils/languageSupport.js';

class SpeechToTextManager {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.currentLang = 'en-IN';
    this.activeCallbacks = null;
  }

  /**
   * Initializes or re-initializes SpeechRecognition instance.
   */
  _initRecognition() {
    if (!isSTTSupported()) {
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false; // Capture single utterance for query
    recognition.interimResults = true; // Stream interim results to UI
    recognition.maxAlternatives = 1;

    return recognition;
  }

  /**
   * Starts listening to microphone speech.
   *
   * @param {Object} config
   * @param {string} [config.language='en-IN'] - Language code ('en-IN', 'hi-IN', 'te-IN')
   * @param {Function} [config.onStart] - Called when mic starts capturing
   * @param {Function} [config.onInterim] - Called with interim string (transcription, isFinal)
   * @param {Function} [config.onResult] - Called with final transcribed string
   * @param {Function} [config.onError] - Called on error with a friendly error object
   * @param {Function} [config.onEnd] - Called when recognition session completes
   */
  startListening({
    language = 'en-IN',
    onStart,
    onInterim,
    onResult,
    onError,
    onEnd
  } = {}) {
    if (!isSTTSupported()) {
      const errorMsg = 'Speech recognition is not supported in this browser. Please use Chrome or Edge.';
      if (onError) onError({ code: 'not-supported', message: errorMsg });
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.currentLang = language;
    this.activeCallbacks = { onStart, onInterim, onResult, onError, onEnd };

    this.recognition = this._initRecognition();
    if (language === 'auto') {
      // Empty string tells Chrome to use the browser/system language — allows
      // multilingual recognition instead of being locked to a single locale.
      // Chrome will still return native-script text (e.g., Telugu or Hindi)
      // if the user has that language pack installed.
      this.recognition.lang = '';
      console.log('[STT] Auto-detect mode: recognition.lang set to "" (system default)');
    } else {
      const langConfig = SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES['en-IN'];
      this.recognition.lang = langConfig.speechRecognitionLang || language;
    }

    let finalTranscript = '';
    let latestInterim = '';
    let hasDispatchedResult = false;

    this.recognition.onstart = () => {
      this.isListening = true;
      hasDispatchedResult = false;
      finalTranscript = '';
      latestInterim = '';
      console.log(`[STT] Listening started for language: ${this.recognition.lang}`);
      if (onStart) onStart();
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        const transcript = item[0].transcript;
        if (item.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        latestInterim = interimTranscript;
        if (onInterim) onInterim(interimTranscript);
      }

      if (finalTranscript && !hasDispatchedResult) {
        hasDispatchedResult = true;
        console.log(`[STT] Final transcription: "${finalTranscript}"`);
        if (onResult) onResult(finalTranscript.trim());
      }
    };

    this.recognition.onerror = (event) => {
      console.warn(`[STT] Recognition error:`, event.error);
      let userFriendlyMessage = 'An error occurred during speech recognition.';

      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          userFriendlyMessage = 'Microphone access was denied. Please allow microphone permissions in your browser settings.';
          break;
        case 'no-speech':
          userFriendlyMessage = 'No speech was detected. Please try speaking again.';
          break;
        case 'audio-capture':
          userFriendlyMessage = 'No microphone was found or microphone is busy.';
          break;
        case 'network':
          userFriendlyMessage = 'Network error during speech recognition. Please check your connection.';
          break;
        case 'aborted':
          // User or system stopped listening, usually not an error to alert
          return;
        case 'language-not-supported':
          userFriendlyMessage = `Speech recognition for language (${language}) is not supported on this browser.`;
          break;
        default:
          userFriendlyMessage = `Speech recognition error: ${event.error}`;
      }

      if (onError) {
        onError({
          code: event.error,
          message: userFriendlyMessage,
          notice: getBrowserCompatibilityNotice(language)
        });
      }
    };

    this.recognition.onend = () => {
      const wasListening = this.isListening;
      this.isListening = false;
      console.log(`[STT] Listening session ended.`);

      // If speech was captured as interim but isFinal was not flagged before connection ended:
      if (wasListening && !hasDispatchedResult) {
        const candidate = (finalTranscript || latestInterim).trim();
        if (candidate) {
          hasDispatchedResult = true;
          console.log(`[STT] Dispatching end-of-session transcription: "${candidate}"`);
          if (onResult) onResult(candidate);
        }
      }

      if (onEnd) onEnd();
    };

    try {
      this.recognition.start();
    } catch (err) {
      this.isListening = false;
      console.error('[STT] Failed to start recognition:', err);
      if (onError) {
        onError({
          code: 'start-failure',
          message: 'Failed to start microphone. Please try again.',
          error: err
        });
      }
    }
  }

  /**
   * Stops listening and completes the current transcript.
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (_) {}
    }
    this.isListening = false;
  }

  /**
   * Aborts listening immediately without firing results.
   */
  abort() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (_) {}
    }
    this.isListening = false;
  }

  /**
   * Returns whether the manager is currently listening.
   * @returns {boolean}
   */
  getIsListening() {
    return this.isListening;
  }
}

export const speechToText = new SpeechToTextManager();
export default speechToText;
