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
 * @param {string} params.language - Language code (e.g. "en", "te", "hi")
 * @returns {Promise<{answer: string, language: string, isDemo?: boolean}>}
 */
export async function askQuestion({ question, location = 'Warangal', language = 'en' }) {
  const payload = {
    question: question.trim(),
    location: (location || 'Warangal').trim(),
    language: language || 'en'
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

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
 * Fetch current weather data and IMD alerts for a location
 * @param {string} location
 * @returns {Promise<Object>}
 */
export async function fetchWeather(location = 'Warangal') {
  const loc = (location || 'Warangal').trim();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`/api/weather?location=${encodeURIComponent(loc)}`, {
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
 * Ping backend to check real-time availability
 */
export async function checkBackendConnection() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('/api/weather?location=Warangal', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      updateBackendStatus(true, 'Live backend connected');
      return true;
    }
  } catch (e) {
    // Expected when backend server is not running
  }
  updateBackendStatus(false, 'Backend offline (interactive demo mode active)');
  return false;
}
