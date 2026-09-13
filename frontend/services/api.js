/**
 * WeatherGPT API Service
 * Handles HTTP requests to the WeatherGPT backend:
 *   - POST /api/ask
 *   - GET /api/weather?location={location}
 *
 * Strict adherence to shared/api-contract.md:
 * POST /api/ask payload: { question, location, language }
 * POST /api/ask response: { answer, language }
 */

import { getMockWeather, getMockAnswer } from './mockData.js';

let isBackendAvailable = null;
let onStatusChangeCallback = null;

export function registerStatusListener(cb) {
  onStatusChangeCallback = cb;
}

function updateBackendStatus(available, reason = '') {
  isBackendAvailable = available;
  if (onStatusChangeCallback) {
    onStatusChangeCallback({ available, reason });
  }
}

/**
 * Ask a natural-language weather question
 * @param {Object} params
 * @param {string} params.question - The user query (e.g. "Will it rain tomorrow?")
 * @param {string} params.location - The chosen location (e.g. "Warangal")
 * @param {Object} [params.coordinates] - Optional { latitude, longitude }
 * @param {string} params.language - Language code (e.g. "en", "te", "hi")
 * @returns {Promise<{answer: string, language: string, isDemo?: boolean}>}
 */
export async function askQuestion({ question, location = 'Warangal', coordinates = null, language = 'en', conversation_context = null, history = null }) {
  const payload = {
    question: question.trim(),
    location: (location || 'Warangal').trim(),
    language: language || 'en'
  };

  const context = conversation_context || history;
  if (Array.isArray(context) && context.length > 0) {
    payload.conversation_context = context;
  }

  if (coordinates && coordinates.latitude != null && coordinates.longitude != null) {
    payload.coordinates = {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    updateBackendStatus(true, 'Connected to live WeatherGPT backend');
    return {
      answer: data.answer,
      language: data.language || language,
      isDemo: false
    };
  } catch (err) {
    console.warn('[WeatherGPT API] Backend unavailable or failed, utilizing fallback:', err.message);
    updateBackendStatus(false, 'Live backend offline (Running in interactive Demo Mode)');

    // Artificial slight delay for realistic feeling during demo
    await new Promise(r => setTimeout(r, 600));

    const fallbackAnswer = getMockAnswer(question, location, language);
    return {
      answer: fallbackAnswer,
      language: language,
      isDemo: true,
      notice: 'Simulated response (Live backend server not detected on /api/ask)'
    };
  }
}

/**
 * Best-effort translation of a short piece of free text into another language
 */
const LANGUAGE_NAMES = { en: 'English', te: 'Telugu', hi: 'Hindi', ta: 'Tamil', kn: 'Kannada' };

export async function translateFreeText(text, targetLanguage = 'en') {
  const trimmed = (text || '').trim();
  if (!trimmed) return text;

  try {
    const res = await batchTranslateTexts([trimmed], targetLanguage);
    if (res && res[0]) return res[0];
  } catch (_) {}

  return text;
}

/**
 * Batch translation of an array of texts via backend /api/translate
 * Supports translating ANY language to ANY language (including into English).
 */
export async function batchTranslateTexts(texts = [], targetLanguage = 'en') {
  if (!texts || texts.length === 0) return [];

  // 1. Try Backend /api/translate (Google Translate Engine + Gemini Fallback)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        texts: texts,
        target_language: targetLanguage
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.translations) && data.translations.length === texts.length) {
        return data.translations;
      }
    }
  } catch (err) {
    console.debug('Backend batch translation error, attempting direct Google Translate:', err);
  }

  // 2. Direct client-side Google Translate fallback
  try {
    const directTranslations = await Promise.all(
      texts.map(async (t) => {
        if (!t || !t.trim()) return t;
        try {
          const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLanguage)}&dt=t&q=${encodeURIComponent(t.trim())}`;
          const res = await fetch(url);
          if (res.ok) {
            const parsed = await res.json();
            if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
              return parsed[0].map(item => item[0]).join('');
            }
          }
        } catch (_) {}
        return t;
      })
    );
    return directTranslations;
  } catch (_) {}

  return texts;
}

/**
 * Fetch current weather data and IMD alerts for a location or coordinates
 * @param {string} location
 * @param {Object} [coords] - { latitude, longitude }
 * @returns {Promise<Object>}
 */
export async function fetchWeather(location = 'Warangal', coords = null) {
  const loc = (location || 'Warangal').trim();

  let url = `/api/weather?location=${encodeURIComponent(loc)}`;
  if (coords && coords.latitude != null && coords.longitude != null) {
    url += `&lat=${coords.latitude}&lon=${coords.longitude}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Weather API returned ${response.status}`);
    }

    const data = await response.json();
    updateBackendStatus(true, 'Live backend active');
    return data;
  } catch (err) {
    console.warn('[WeatherGPT API] Weather fetch fallback used:', err.message);
    updateBackendStatus(false, 'Backend offline');
    return getMockWeather(loc);
  }
}

/**
 * Reverse geocode coordinates to district/city
 */
export async function reverseGeocodeCoords(latitude, longitude) {
  try {
    const res = await fetch(`/api/location/reverse?lat=${latitude}&lon=${longitude}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('[WeatherGPT API] Reverse geocode request failed:', e.message);
  }
  return null;
}

/**
 * Search locations worldwide
 */
export async function searchLocations(query) {
  try {
    const res = await fetch(`/api/location/search?query=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      return data.results || [];
    }
  } catch (e) {
    console.warn('[WeatherGPT API] Location search failed:', e.message);
  }
  return [];
}

/**
 * Detect location via IP fallback
 */
export async function detectIpLocation() {
  try {
    const res = await fetch('/api/location/ip');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('[WeatherGPT API] IP location detection failed:', e.message);
  }
  return null;
}

/**
 * Ping backend to check real-time availability
 */
export async function checkBackendConnection() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('/health', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      updateBackendStatus(true, 'Backend Connected');
      return true;
    }
  } catch (e) {
    // Expected when backend server is not running
  }
  updateBackendStatus(false, 'Backend Offline');
  return false;
}

/**
 * Detect language of query using Gemini API backend
 */
export async function detectLanguage(text) {
  if (!text || !text.trim()) return { language: 'en' };
  try {
    const res = await fetch('/api/detect-language', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim() })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.debug('Language detection error:', err);
  }
  return { language: 'en' };
}

