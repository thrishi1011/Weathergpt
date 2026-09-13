/**
 * normalize.js
 * Turns free-text place names ("Warangal", "Mumbai", "Paris", "Tokyo") into
 * a consistent normalized shape worldwide:
 *
 *   { name, district, state, country, formattedAddress, latitude, longitude, source }
 *
 * Lookup order:
 *   1. Local INDIA_DISTRICTS table (fast, offline, zero rate limits across India)
 *   2. Remote forward-geocoding fallback (worldwide, covers any place name on Earth),
 *      unless explicitly disabled
 */

import { INDIA_DISTRICTS } from './india.js';
import { forwardGeocode } from './geocoding.js';
import { LocationError, LOCATION_ERROR_CODES } from './geolocation.js';

function cleanString(value) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Look up a name against the local offline dataset (all India districts and IMD places).
 * @param {string} query
 * @returns {object|null} raw dataset entry, or null if no match
 */
export function findLocalMatch(query) {
  if (!query || typeof query !== 'string') return null;
  const normalized = cleanString(query);
  return (
    INDIA_DISTRICTS.find(
      (entry) =>
        cleanString(entry.name) === normalized ||
        (entry.aliases || []).some((alias) => cleanString(alias) === normalized)
    ) || null
  );
}

/**
 * Normalize a free-text location name into a structured location object worldwide.
 * Checks the local offline table first as a fast-path optimization.
 *
 * @param {string} query e.g. "Warangal", "Paris", "Tokyo", "London"
 * @param {{ useRemoteFallback?: boolean, countryCodes?: string, signal?: AbortSignal }} [opts]
 * @returns {Promise<{
 *   name: string, district: string|null, state: string|null, country: string|null,
 *   formattedAddress: string|null, latitude: number, longitude: number, source: 'local'|'remote'
 * }>}
 */
export async function normalizeLocationName(query, opts = {}) {
  const { useRemoteFallback = true, countryCodes, signal } = opts;

  if (!query || typeof query !== 'string' || !query.trim()) {
    throw new LocationError(
      LOCATION_ERROR_CODES.INVALID_INPUT,
      'Location name must be a non-empty string.'
    );
  }

  const local = findLocalMatch(query);
  if (local) {
    return {
      name: local.name,
      district: local.district,
      state: local.state,
      country: 'India',
      formattedAddress: `${local.name}, ${local.district}, ${local.state}, India`,
      latitude: local.latitude,
      longitude: local.longitude,
      source: 'local',
    };
  }

  if (useRemoteFallback) {
    const remote = await forwardGeocode(query, { countryCodes, signal });
    if (remote) {
      return { ...remote, source: 'remote' };
    }
  }

  throw new LocationError(
    LOCATION_ERROR_CODES.LOCATION_NOT_FOUND,
    `Could not normalize location "${query}". It wasn't found locally or via geocoding.`
  );
}
