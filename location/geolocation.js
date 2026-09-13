/**
 * geolocation.js
 * Thin, promise-based wrapper around the browser's Geolocation API.
 *
 * Design choices:
 * - No continuous tracking (watchPosition) — location is only fetched
 *   when explicitly requested, per spec.
 * - All failure modes are normalized into a single LocationError class
 *   with a stable `code`, so calling UI code can switch on `error.code`
 *   instead of parsing browser-specific messages.
 */

export const LOCATION_ERROR_CODES = {
  NOT_SUPPORTED: 'NOT_SUPPORTED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  POSITION_UNAVAILABLE: 'POSITION_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  INVALID_INPUT: 'INVALID_INPUT',
  GEOCODING_FAILED: 'GEOCODING_FAILED',
  LOCATION_NOT_FOUND: 'LOCATION_NOT_FOUND',
  IP_LOOKUP_FAILED: 'IP_LOOKUP_FAILED',
  UNKNOWN: 'UNKNOWN',
};

export class LocationError extends Error {
  constructor(code, message, originalError = null) {
    super(message);
    this.name = 'LocationError';
    this.code = code;
    this.originalError = originalError;
  }
}

const DEFAULT_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

/**
 * Fetch the user's current position once.
 * Triggers the browser's native permission prompt on first call.
 *
 * @param {Partial<PositionOptions>} options
 * @returns {Promise<{
 *   latitude: number, longitude: number, accuracy: number,
 *   altitude: number|null, altitudeAccuracy: number|null,
 *   heading: number|null, speed: number|null, timestamp: number
 * }>}
 */
export function getCurrentLocation(options = {}) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      reject(
        new LocationError(
          LOCATION_ERROR_CODES.NOT_SUPPORTED,
          'Geolocation is not supported by this browser or environment.'
        )
      );
      return;
    }

    const opts = { ...DEFAULT_OPTIONS, ...options };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const {
          latitude,
          longitude,
          accuracy,
          altitude,
          altitudeAccuracy,
          heading,
          speed,
        } = position.coords;

        resolve({
          latitude,
          longitude,
          accuracy,
          altitude,
          altitudeAccuracy,
          heading,
          speed,
          timestamp: position.timestamp,
        });
      },
      (error) => reject(mapGeolocationError(error)),
      opts
    );
  });
}

/**
 * Best-effort check of current permission state without triggering a prompt.
 * Falls back to 'unsupported' in environments without the Permissions API
 * (e.g. Safari on older iOS).
 *
 * @returns {Promise<'granted'|'denied'|'prompt'|'unsupported'>}
 */
export async function checkLocationPermission() {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return 'unsupported';
  }
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    return status.state; // 'granted' | 'denied' | 'prompt'
  } catch {
    return 'unsupported';
  }
}

function mapGeolocationError(error) {
  // W3C GeolocationPositionError constants:
  // 1: PERMISSION_DENIED, 2: POSITION_UNAVAILABLE, 3: TIMEOUT
  const code = typeof error?.code === 'number' ? error.code : null;

  switch (code) {
    case 1:
      return new LocationError(
        LOCATION_ERROR_CODES.PERMISSION_DENIED,
        'Location permission was denied. Enable location access in your browser settings and try again.',
        error
      );
    case 2:
      return new LocationError(
        LOCATION_ERROR_CODES.POSITION_UNAVAILABLE,
        'Your location is currently unavailable. Check your device\'s location/GPS settings.',
        error
      );
    case 3:
      return new LocationError(
        LOCATION_ERROR_CODES.TIMEOUT,
        'Timed out while trying to get your location. Please try again.',
        error
      );
    default:
      return new LocationError(
        LOCATION_ERROR_CODES.UNKNOWN,
        'An unknown error occurred while retrieving your location.',
        error
      );
  }
}
