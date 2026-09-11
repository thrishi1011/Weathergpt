/**
 * location/index.js
 * Public entry point for the Location module.
 *
 * Scope (per project spec): this module resolves "where is the user, and
 * what district is that" — it deliberately stops there. Turning a district
 * into an IMD warning is the alert engine's job, not this module's.
 */

export {
  getCurrentLocation,
  checkLocationPermission,
  LocationError,
  LOCATION_ERROR_CODES,
} from './geolocation.js';

export { reverseGeocode, forwardGeocode } from './geocoding.js';

export { normalizeLocationName, findLocalMatch } from './normalize.js';

export {
  INDIA_DISTRICTS,
  INDIA_PLACES,
  TELANGANA_DISTRICTS,
} from './india.js';

export { getLocationByIP } from './ipLocation.js';

import {
  getCurrentLocation,
  checkLocationPermission,
  LocationError,
  LOCATION_ERROR_CODES,
} from './geolocation.js';
import { reverseGeocode } from './geocoding.js';
import { getLocationByIP } from './ipLocation.js';

/**
 * Convenience helper for the main flow this module exists to support:
 *
 *   GPS coordinates -> Location/district -> (handed off to backend/alert engine)
 *
 * Gets the device's current position, then resolves it to a normalized
 * location + district in one call (GPS only, no fallback).
 *
 * @param {Partial<PositionOptions>} [geoOptions]
 * @returns {Promise<{
 *   name: string, district: string|null, state: string|null,
 *   country: string|null, formattedAddress: string|null,
 *   latitude: number, longitude: number, accuracy: number,
 *   source: 'gps',
 * }>}
 */
export async function getCurrentDistrict(geoOptions = {}) {
  const position = await getCurrentLocation(geoOptions);
  const address = await reverseGeocode(position.latitude, position.longitude);
  return {
    ...address,
    accuracy: position.accuracy,
    source: 'gps',
  };
}

/**
 * Self-service location detection entry point.
 * Checks permissions and attempts GPS-based geolocation first; if denied,
 * unavailable, or timed out, automatically falls back to approximate IP-based
 * geolocation unless IP fallback is explicitly disabled.
 *
 * @param {{
 *   geoOptions?: Partial<PositionOptions>,
 *   allowIpFallback?: boolean,
 *   ipOptions?: { signal?: AbortSignal, endpoint?: string, headers?: Record<string, string> }
 * }} [options]
 * @returns {Promise<{
 *   name: string, district: string|null, state: string|null,
 *   country: string|null, formattedAddress: string|null,
 *   latitude: number, longitude: number, accuracy?: number,
 *   source: 'gps'|'ip',
 * }>}
 */
export async function autoDetectLocation(options = {}) {
  const { geoOptions, allowIpFallback = true, ipOptions } = options;

  const permission = await checkLocationPermission();

  if (permission === 'denied') {
    if (allowIpFallback) {
      return await getLocationByIP(ipOptions);
    }
    throw new LocationError(
      LOCATION_ERROR_CODES.PERMISSION_DENIED,
      'Location permission was denied. Enable location access in your browser settings and try again.'
    );
  }

  try {
    const position = await getCurrentLocation(geoOptions);
    const address = await reverseGeocode(position.latitude, position.longitude);
    return {
      ...address,
      accuracy: position.accuracy,
      source: 'gps',
    };
  } catch (err) {
    if (allowIpFallback) {
      return await getLocationByIP(ipOptions);
    }
    throw err;
  }
}

