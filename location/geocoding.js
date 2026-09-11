/**
 * geocoding.js
 * Reverse geocoding (coordinates -> address) and forward geocoding
 * (place name -> coordinates) worldwide, using OpenStreetMap's free Nominatim API.
 *
 * IMPORTANT — production notes:
 * - Nominatim's usage policy caps requests at ~1/sec and asks for a
 *   descriptive User-Agent. Browsers won't let client-side fetch() set a
 *   custom User-Agent, so for real production traffic you should proxy
 *   these calls through your own backend (or swap in a paid provider like
 *   Google Geocoding, LocationIQ, or Mapbox — same function signatures
 *   below, just change the implementation).
 * - This module has zero hard dependency on Nominatim beyond this file —
 *   swapping providers means editing only reverseGeocode/forwardGeocode.
 */

import { LocationError, LOCATION_ERROR_CODES } from './geolocation.js';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

function getDefaultHeaders() {
  const headers = {
    Accept: 'application/json',
    'Accept-Language': 'en',
  };
  if (typeof window === 'undefined') {
    headers['User-Agent'] = 'WeatherGPT/2.0 (worldwide-geocoding)';
  }
  return headers;
}

/**
 * Convert coordinates into a normalized, readable location.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @param {{ signal?: AbortSignal, headers?: Record<string, string> }} [opts]
 * @returns {Promise<NormalizedLocation>}
 */
export async function reverseGeocode(latitude, longitude, opts = {}) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new LocationError(
      LOCATION_ERROR_CODES.INVALID_INPUT,
      'reverseGeocode requires numeric latitude and longitude.'
    );
  }

  const url =
    `${NOMINATIM_BASE}/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}` +
    `&zoom=10&addressdetails=1`;

  try {
    const res = await fetch(url, {
      signal: opts.signal,
      headers: {
        ...getDefaultHeaders(),
        ...opts.headers,
      },
    });
    if (!res.ok) {
      throw new Error(`Reverse geocoding request failed with status ${res.status}`);
    }
    const data = await res.json();
    return parseNominatimResult(data, latitude, longitude);
  } catch (err) {
    if (err instanceof LocationError) throw err;
    throw new LocationError(
      LOCATION_ERROR_CODES.GEOCODING_FAILED,
      'Could not resolve an address for these coordinates.',
      err
    );
  }
}

/**
 * Convert a free-text place name into a normalized location worldwide.
 * Optionally scoped to specific countries by passing opts.countryCodes.
 *
 * @param {string} query
 * @param {{ signal?: AbortSignal, countryCodes?: string, headers?: Record<string, string> }} [opts]
 * @returns {Promise<NormalizedLocation|null>} null if nothing matched
 */
export async function forwardGeocode(query, opts = {}) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    throw new LocationError(
      LOCATION_ERROR_CODES.INVALID_INPUT,
      'forwardGeocode requires a non-empty place name.'
    );
  }

  let url =
    `${NOMINATIM_BASE}/search?format=jsonv2&q=${encodeURIComponent(query.trim())}` +
    `&addressdetails=1&limit=1`;

  if (opts.countryCodes) {
    url += `&countrycodes=${encodeURIComponent(opts.countryCodes)}`;
  }

  try {
    const res = await fetch(url, {
      signal: opts.signal,
      headers: {
        ...getDefaultHeaders(),
        ...opts.headers,
      },
    });
    if (!res.ok) {
      throw new Error(`Forward geocoding request failed with status ${res.status}`);
    }
    const results = await res.json();
    if (!Array.isArray(results) || results.length === 0) return null;

    const top = results[0];
    const parsed = parseNominatimResult(
      { address: top.address, display_name: top.display_name },
      parseFloat(top.lat),
      parseFloat(top.lon)
    );
    return {
      ...parsed,
      source: 'remote',
    };
  } catch (err) {
    if (err instanceof LocationError) throw err;
    throw new LocationError(
      LOCATION_ERROR_CODES.GEOCODING_FAILED,
      `Could not find a location matching "${query}".`,
      err
    );
  }
}

/**
 * @typedef {Object} NormalizedLocation
 * @property {string} name
 * @property {string|null} district
 * @property {string|null} state
 * @property {string|null} country
 * @property {string|null} formattedAddress
 * @property {number} latitude
 * @property {number} longitude
 * @property {'gps'|'ip'|'local'|'remote'} [source]
 */

function parseNominatimResult(data, latitude, longitude) {
  const addr = data.address || {};
  const district =
    addr.state_district || addr.county || addr.city_district || addr.district || null;
  const state = addr.state || addr.province || addr.region || null;
  const name =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.hamlet ||
    addr.suburb ||
    district ||
    state ||
    (data.display_name ? data.display_name.split(',')[0].trim() : 'Unknown location');

  return {
    name,
    district,
    state,
    country: addr.country || null,
    formattedAddress: data.display_name || null,
    latitude,
    longitude,
  };
}
