/**
 * Language Detector Utility
 * High-performance heuristic and Unicode script analyzer to detect spoken / transcribed language.
 *
 * Supports detection for:
 * - Telugu (te-IN)
 * - Hindi (hi-IN)
 * - English (en-IN)
 * - Tamil (ta-IN)
 * - Kannada (kn-IN)
 * - Malayalam (ml-IN)
 * - Bengali (bn-IN)
 * - Marathi (mr-IN)
 * - Gujarati (gu-IN)
 */

const SCRIPT_RANGES = [
  { lang: 'te-IN', regex: /[\u0C00-\u0C7F]/ }, // Telugu script
  { lang: 'ta-IN', regex: /[\u0B80-\u0BFF]/ }, // Tamil script
  { lang: 'kn-IN', regex: /[\u0C80-\u0CFF]/ }, // Kannada script
  { lang: 'ml-IN', regex: /[\u0D00-\u0D7F]/ }, // Malayalam script
  { lang: 'bn-IN', regex: /[\u0980-\u09FF]/ }, // Bengali script
  { lang: 'gu-IN', regex: /[\u0A80-\u0AFF]/ }, // Gujarati script
  { lang: 'hi-IN', regex: /[\u0900-\u097F]/ }  // Devanagari (Hindi)
];

// Rich phonetic/transliterated vocabulary for Indic languages
const INDIC_VOCABULARY = {
  'te-IN': [
    'varsham', 'vaana', 'vana', 'paduthunda', 'padutunda', 'padtada', 'padtadha', 'padutha', 'padindi',
    'untada', 'untadi', 'vuntada', 'vuntadi', 'undi', 'vundi', 'ela', 'yela', 'cheppu', 'cheppandi',
    'entha', 'yenda', 'enda', 'chali', 'mabbulu', 'mabu', 'gaali', 'gali', 'toofanu', 'tufanu',
    'repu', 'eeroju', 'ninna', 'ippudu', 'baga', 'manchiga', 'telugu', 'namaskaram', 'lo', 'daggara',
    'ukkapotha', 'chellaga', 'challa'
  ],
  'hi-IN': [
    'barish', 'barsat', 'hogi', 'hoga', 'hoga kya', 'hogi kya', 'kaisa', 'kaisi', 'hai', 'batao',
    'bataiye', 'aaj', 'kal', 'parso', 'mausam', 'tapman', 'garmi', 'thand', 'hawa', 'toofan',
    'namaste', 'shukriya', 'kya', 'pani'
  ],
  'ta-IN': [
    'mazhai', 'peyyuma', 'peyyum', 'eppadi', 'irukku', 'irukkum', 'solunga', 'inraikku', 'naalai',
    'nalai', 'veppam', 'kaala nilai', 'vanakkam', 'nandri', 'thannir'
  ],
  'kn-IN': [
    'male', 'barutha', 'baruttadha', 'hegidhe', 'hegide', 'heli', 'ee dina', 'naale', 'nale',
    'havamana', 'bisi', 'namaskara', 'dhanyavada', 'sheetha'
  ]
};

/**
 * Detects language code from input text.
 *
 * @param {string} text - Input text/question
 * @param {string} [fallbackLang='en-IN'] - Fallback language if inconclusive
 * @returns {string} - BCP-47 locale code (e.g. 'te-IN', 'hi-IN', 'en-IN')
 */
export function detectLanguage(text, fallbackLang = 'en-IN') {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return fallbackLang;
  }

  const cleanText = text.trim();

  // 1. Script block check (highest precision for native scripts)
  for (const item of SCRIPT_RANGES) {
    if (item.regex.test(cleanText)) {
      return item.lang;
    }
  }

  // 2. Token-level scoring for Transliterated Indic speech
  const normalized = cleanText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = normalized.split(/\s+/).filter(w => w.length > 0);

  const scores = {
    'te-IN': 0,
    'hi-IN': 0,
    'ta-IN': 0,
    'kn-IN': 0
  };

  for (const [lang, vocab] of Object.entries(INDIC_VOCABULARY)) {
    for (const keyword of vocab) {
      if (keyword.includes(' ')) {
        // Multi-word phrase check
        if (normalized.includes(keyword)) {
          scores[lang] += 3;
        }
      } else {
        // Single word exact or prefix match
        if (words.includes(keyword)) {
          scores[lang] += 2;
        } else if (words.some(w => w.startsWith(keyword) || (keyword.length >= 4 && w.includes(keyword)))) {
          scores[lang] += 1;
        }
      }
    }
  }

  let highestLang = null;
  let maxScore = 0;

  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      highestLang = lang;
    }
  }

  if (maxScore > 0 && highestLang) {
    return highestLang;
  }

  // 3. Default to fallback language (en-IN)
  return fallbackLang;
}

/**
 * Normalizes a language name or code returned by Gemini into the
 * BCP-47 locale code used by the WeatherGPT voice/TTS system.
 *
 * Gemini may return a plain English name ("Telugu", "Hindi"),
 * an ISO 639-1 code ("te", "hi", "en"), or a BCP-47 tag ("te-IN").
 * This function maps all known forms to the voice system's format.
 *
 * @param {string} langStr - Language string from Gemini response
 * @param {string} [fallback='en-IN'] - Fallback locale if unrecognised
 * @returns {string} BCP-47 locale code (e.g. 'te-IN', 'hi-IN', 'en-IN')
 */
export function normalizeGeminiLanguage(langStr, fallback = 'en-IN') {
  if (!langStr || typeof langStr !== 'string') return fallback;

  const s = langStr.trim().toLowerCase();

  // Already a BCP-47 code (e.g. "te-IN", "hi-IN", "en-US")
  if (/^[a-z]{2,3}-[a-z]{2,3}$/i.test(s)) {
    const prefix = s.split('-')[0];
    return ISO_TO_LOCALE[prefix] || s;
  }

  // Check exact ISO 639-1 / 639-3 two/three-letter codes
  if (ISO_TO_LOCALE[s]) return ISO_TO_LOCALE[s];

  // Check plain English / native name
  if (NAME_TO_LOCALE[s]) return NAME_TO_LOCALE[s];

  // Partial match on name
  for (const [name, code] of Object.entries(NAME_TO_LOCALE)) {
    if (s.includes(name) || name.includes(s)) return code;
  }

  return fallback;
}

/** Maps ISO 639-1 two-letter codes → BCP-47 locale */
const ISO_TO_LOCALE = {
  'te': 'te-IN',
  'tel': 'te-IN',
  'hi': 'hi-IN',
  'hin': 'hi-IN',
  'en': 'en-IN',
  'eng': 'en-IN',
  'ta': 'ta-IN',
  'tam': 'ta-IN',
  'kn': 'kn-IN',
  'kan': 'kn-IN',
  'ml': 'ml-IN',
  'mal': 'ml-IN',
  'bn': 'bn-IN',
  'ben': 'bn-IN',
  'mr': 'mr-IN',
  'mar': 'mr-IN',
  'gu': 'gu-IN',
  'guj': 'gu-IN'
};

/** Maps plain language names (lowercase) → BCP-47 locale */
const NAME_TO_LOCALE = {
  'telugu': 'te-IN',
  'తెలుగు': 'te-IN',
  'hindi': 'hi-IN',
  'हिंदी': 'hi-IN',
  'हिन्दी': 'hi-IN',
  'english': 'en-IN',
  'tamil': 'ta-IN',
  'தமிழ்': 'ta-IN',
  'kannada': 'kn-IN',
  'ಕನ್ನಡ': 'kn-IN',
  'malayalam': 'ml-IN',
  'മലയാളം': 'ml-IN',
  'bengali': 'bn-IN',
  'বাংলা': 'bn-IN',
  'marathi': 'mr-IN',
  'मराठी': 'mr-IN',
  'gujarati': 'gu-IN',
  'ગુજરાતી': 'gu-IN'
};
