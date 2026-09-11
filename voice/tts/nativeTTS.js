/**
 * Native SpeechSynthesis Wrapper (TTS Tier 1)
 * Uses the browser's built-in Web Speech API SpeechSynthesis.
 */

import { findNativeVoice } from '../utils/languageSupport.js';

let currentUtterance = null;

/**
 * Checks if Tier 1 native synthesis is available for the given language.
 * @param {string} langCode - 'en-IN', 'hi-IN', 'te-IN'
 * @returns {Promise<boolean>}
 */
export async function isNativeTTSAvailable(langCode) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return false;
  }
  const voice = await findNativeVoice(langCode);
  return Boolean(voice);
}

/**
 * Speaks text using the browser's native SpeechSynthesis.
 * Resolves when speech finishes playing, or rejects on error.
 *
 * @param {string} text - Text to speak
 * @param {string} langCode - Language code ('en-IN', 'hi-IN', 'te-IN')
 * @param {Object} [options]
 * @param {number} [options.rate=1.0] - Speed rate (0.1 to 10)
 * @param {number} [options.pitch=1.0] - Pitch (0 to 2)
 * @param {Function} [options.onStart] - Callback when speech starts
 * @param {Function} [options.onEnd] - Callback when speech finishes
 * @param {Function} [options.onError] - Callback on error
 * @returns {Promise<void>}
 */
export async function speakNative(text, langCode = 'en-IN', options = {}) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    throw new Error('Native SpeechSynthesis is not supported in this environment');
  }

  const voice = await findNativeVoice(langCode);

  // Cancel any ongoing speech
  stopNativeTTS();

  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || langCode;
    } else {
      utterance.lang = langCode;
    }
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;

    utterance.onstart = () => {
      if (options.onStart) options.onStart();
    };

    utterance.onend = () => {
      currentUtterance = null;
      if (options.onEnd) options.onEnd();
      resolve();
    };

    utterance.onerror = (event) => {
      currentUtterance = null;
      // 'canceled' or 'interrupted' are typical when user clicks stop
      if (event.error === 'canceled' || event.error === 'interrupted') {
        resolve();
        return;
      }
      const err = new Error(`Native SpeechSynthesis error: ${event.error}`);
      if (options.onError) options.onError(err);
      reject(err);
    };

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Stops any ongoing native speech synthesis.
 */
export function stopNativeTTS() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}
