/**
 * ipLocation.js
 * IP-based approximate geolocation fallback.
 *
 * Design choices:
 * - City-level accuracy only — this is strictly a fallback when GPS
 *   is unavailable, denied, or timed out.
 * - Zero-dependency, fetch-based provider. Primary endpoint is ipapi.co/json/,
 *   with automatic fallback to ipwho.is if rate-limited (429 / error response).
 * - Normalizes data into the same shape as geocoding.js, with source: 'ip'.
 * - Any failure throws LocationError with code IP_LOOKUP_FAILED.
 */

import { LocationError, LOCATION_ERROR_CODES } from './geolocation.js';

const PRIMARY_IP_ENDPOINT = 'https://ipapi.co/json/';
const FALLBACK_IP_ENDPOINT = 'https://ipwho.is/';

/**
 * Fetch approximate location based on the client's public IP address.
 *
 * NOTE: IP geolocation provides approximate, city-level accuracy.
 * It is intended as a fallback when device GPS is unavailable or denied.
 *
 * @param {{ signal?: AbortSignal, endpoint?: string, headers?: Record<string, string> }} [opts]
 * @returns {Promise<import('./geocoding.js').NormalizedLocation>}
 */
export async function getLocationByIP(opts = {}) {
  const customEndpoint = opts.endpoint;

  if (customEndpoint) {
    return fetchAndParseIP(customEndpoint, opts);
  }

  // Try primary endpoint (ipapi.co); if rate-limited or fails, try fallback (ipwho.is)
  try {
    return await fetchAndParseIP(PRIMARY_IP_ENDPOINT, opts);
  } catch (primaryErr) {
    try {
      return await fetchAndParseIP(FALLBACK_IP_ENDPOINT, opts);
    } catch (fallbackErr) {
      throw new LocationError(
        LOCATION_ERROR_CODES.IP_LOOKUP_FAILED,
        'Could not determine location from IP address.',
        primaryErr
      );
    }
  }
}

async function fetchAndParseIP(url, opts = {}) {
  try {
    const res = await fetch(url, {
      signal: opts.signal,
      headers: {
        Accept: 'application/json',
        ...opts.headers,
      },
    });

    if (!res.ok) {
      throw new Error(`IP lookup request failed with status ${res.status}`);
    }

    const data = await res.json();

    // Provider-specific error indicators
    if (data.error || data.success === false) {
      const msg = data.reason || data.message || 'IP provider returned an error';
      throw new Error(msg);
    }

    const lat = parseFloat(data.latitude);
    const lon = parseFloat(data.longitude);

    if (isNaN(lat) || isNaN(lon)) {
      throw new Error('IP lookup returned invalid or missing coordinates.');
    }

    const city = data.city || null;
    const region = data.region || null;
    const country = data.country_name || data.country || null;
    const district = data.district || city || null;
    const name = city || region || 'Unknown location';

    const formattedAddress =
      [city, region, country].filter(Boolean).join(', ') || null;

    return {
      name,
      district,
      state: region,
      country,
      formattedAddress,
      latitude: lat,
      longitude: lon,
      source: 'ip',
    };
  } catch (err) {
    if (err instanceof LocationError) throw err;
    throw new LocationError(
      LOCATION_ERROR_CODES.IP_LOOKUP_FAILED,
      `IP geolocation lookup failed: ${err.message}`,
      err
    );
  }
}
