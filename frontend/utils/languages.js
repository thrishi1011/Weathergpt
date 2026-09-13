/**
 * Shared language list for WeatherGPT.
 * Single source of truth so the Header's global selector and any
 * component that needs language metadata (speech, chat, modes) stay in sync.
 */

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'kn', label: 'ಕನ್ನಡ' }
];

export const DEFAULT_LANGUAGE = 'en';
