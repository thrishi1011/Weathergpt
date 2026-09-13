/**
 * Location Service
 * 
 * Provides geocoding (location name → coordinates) for the backend.
 * 
 * Current implementation: Uses Open-Meteo's geocoding API for coordinate resolution.
 * Future integration: Person 6's location module will provide normalized location
 * objects with name, district, state, latitude, longitude. This service is designed
 * so that it can be swapped to consume data/location from the location module.
 */

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

/**
 * Resolve a location name to coordinates.
 * Returns: { name, latitude, longitude, country, admin1 (state/region) }
 */
async function resolveLocation(locationName) {
  if (!locationName || typeof locationName !== 'string' || locationName.trim() === '') {
    throw new Error('Location name is required');
  }

  const url = `${GEOCODING_URL}?name=${encodeURIComponent(locationName.trim())}&count=1&language=en&format=json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Geocoding API returned status ${response.status}`);
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    return null; // Location not found
  }

  const result = data.results[0];

  // Return in a shape compatible with the future location module contract:
  // { name, district, state, latitude, longitude }
  return {
    name: result.name,
    district: result.admin2 || result.name,
    state: result.admin1 || '',
    country: result.country || '',
    latitude: result.latitude,
    longitude: result.longitude
  };
}

module.exports = { resolveLocation };
