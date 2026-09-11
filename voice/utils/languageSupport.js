/**
 * Language Support and Voice Detection Utilities
 * Defines supported languages and maps locale codes to voice identifiers.
 */

export const SUPPORTED_LANGUAGES = {
  'en-IN': {
    code: 'en-IN',
    label: 'English (India)',
    nativeLabel: 'English (India)',
    defaultEdgeVoice: 'en-IN-NeerjaNeural',
    speechRecognitionLang: 'en-IN'
  },
  'hi-IN': {
    code: 'hi-IN',
    label: 'Hindi',
    nativeLabel: 'हिंदी',
    defaultEdgeVoice: 'hi-IN-SwaraNeural',
    speechRecognitionLang: 'hi-IN'
  },
  'te-IN': {
    code: 'te-IN',
    label: 'Telugu',
    nativeLabel: 'తెలుగు',
    defaultEdgeVoice: 'te-IN-ShrutiNeural',
    speechRecognitionLang: 'te-IN'
  }
};

/**
 * Checks if the browser environment supports Web Speech STT.
 * @returns {boolean}
 */
export function isSTTSupported() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Checks if the browser is running on Chrome/Chromium (best support for hi-IN/te-IN).
 * @returns {boolean}
 */
export function isChromiumBrowser() {
  if (typeof window === 'undefined' || !window.navigator) return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isChrome = userAgent.includes('chrome') && !userAgent.includes('edg') && !userAgent.includes('opr');
  const isEdge = userAgent.includes('edg');
  const isBrave = Boolean(window.navigator.brave);
  return isChrome || isEdge || isBrave;
}

/**
 * Returns browser voice compatibility warning if any.
 * @param {string} langCode - e.g., 'te-IN', 'hi-IN', 'en-IN'
 * @returns {string|null}
 */
export function getBrowserCompatibilityNotice(langCode) {
  if (!isSTTSupported()) {
    return 'Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.';
  }
  if ((langCode === 'te-IN' || langCode === 'hi-IN') && !isChromiumBrowser()) {
    return `Speech recognition for ${SUPPORTED_LANGUAGES[langCode]?.nativeLabel || langCode} works best on Chrome/Chromium browsers. Firefox/Safari may have limited support.`;
  }
  return null;
}

/**
 * Retrieves all currently available SpeechSynthesis voices.
 * @returns {Promise<SpeechSynthesisVoice[]>}
 */
export function getAvailableVoices() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve([]);
      return;
    }

    let voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    // Wait for voiceschanged event if list is not immediately populated
    const onVoicesChanged = () => {
      voices = window.speechSynthesis.getVoices();
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      resolve(voices);
    };

    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);

    // Timeout fallback after 1.5 seconds in case voiceschanged never fires
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      resolve(window.speechSynthesis.getVoices());
    }, 1500);
  });
}

export async function findNativeVoice(langCode) {
  const voices = await getAvailableVoices();
  const normalizedLang = langCode.toLowerCase().replace('_', '-');
  const prefix = normalizedLang.split('-')[0]; // 'te', 'hi', 'en'

  // 1. Exact match first (e.g. te-IN)
  let match = voices.find(v => v.lang && v.lang.toLowerCase().replace('_', '-') === normalizedLang);
  if (match) return match;

  // 2. Prefix match (e.g. te, te-*, tel, hin)
  match = voices.find(v => {
    if (!v.lang) return false;
    const l = v.lang.toLowerCase().replace('_', '-');
    return l.startsWith(prefix) ||
      (prefix === 'te' && (l.startsWith('tel') || l.includes('telugu'))) ||
      (prefix === 'hi' && (l.startsWith('hin') || l.includes('hindi')));
  });
  if (match) return match;

  // 3. Name-based match (e.g. voice name contains "Telugu" or "తెలుగు")
  if (langCode === 'te-IN' || prefix === 'te') {
    match = voices.find(v => v.name && (v.name.toLowerCase().includes('telugu') || v.name.includes('తెలుగు')));
    if (match) return match;
  } else if (langCode === 'hi-IN' || prefix === 'hi') {
    match = voices.find(v => v.name && (v.name.toLowerCase().includes('hindi') || v.name.includes('हिंदी')));
    if (match) return match;
  }

  return null;
}
