const express = require('express');
const router = express.Router();

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const BIGDATACLOUD_BASE = 'https://api.bigdatacloud.net/data/reverse-geocode-client';
const OPEN_METEO_GEO_BASE = 'https://geocoding-api.open-meteo.com/v1/search';

/**
 * GET /api/location/reverse?lat=...&lon=...
 * Reverse geocodes coordinates to a human-readable place name and district.
 */
router.get('/reverse', async (req, res) => {
  const { lat, lon } = req.query;

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({
      error: 'Invalid or missing coordinates. Provide numeric lat and lon parameters.'
    });
  }

  // Attempt 1: Nominatim with proper User-Agent header
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const nomUrl = `${NOMINATIM_BASE}/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2&addressdetails=1`;
    const response = await fetch(nomUrl, {
      headers: {
        'User-Agent': 'WeatherGPT/2.0 (LocationReverseService)',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};
      const cityName = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || addr.county || 'Detected Location';
      const district = addr.state_district || addr.county || addr.district || cityName;
      const state = addr.state || '';
      const country = addr.country || '';

      return res.json({
        name: cityName,
        district,
        state,
        country,
        latitude,
        longitude,
        formattedAddress: data.display_name || `${cityName}, ${state}`,
        source: 'gps'
      });
    }
  } catch (nomErr) {
    console.warn('[Location API] Nominatim reverse geocode failed, trying BigDataCloud:', nomErr.message);
  }

  // Attempt 2: BigDataCloud fallback (fast, free, no key required)
  try {
    const bdcUrl = `${BIGDATACLOUD_BASE}?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const response = await fetch(bdcUrl);
    if (response.ok) {
      const data = await response.json();
      const cityName = data.city || data.locality || data.principalSubdivision || 'Detected Location';
      return res.json({
        name: cityName,
        district: data.locality || cityName,
        state: data.principalSubdivision || '',
        country: data.countryName || '',
        latitude,
        longitude,
        formattedAddress: `${cityName}, ${data.principalSubdivision || ''}, ${data.countryName || ''}`.replace(/^, |, $/g, ''),
        source: 'gps'
      });
    }
  } catch (bdcErr) {
    console.warn('[Location API] BigDataCloud reverse geocode failed:', bdcErr.message);
  }

  // Fallback: Return raw coordinates with formatted label
  return res.json({
    name: `Location (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`,
    district: null,
    state: null,
    country: null,
    latitude,
    longitude,
    formattedAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    source: 'gps'
  });
});

/**
 * GET /api/location/search?query=...
 * Search places worldwide using Open-Meteo and Nominatim.
 */
router.get('/search', async (req, res) => {
  const query = (req.query.query || req.query.q || '').trim();
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const url = `${OPEN_METEO_GEO_BASE}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const results = (data.results || []).map(r => ({
        name: r.name,
        district: r.admin2 || r.name,
        state: r.admin1 || '',
        country: r.country || '',
        latitude: r.latitude,
        longitude: r.longitude,
        formattedAddress: [r.name, r.admin1, r.country].filter(Boolean).join(', ')
      }));
      return res.json({ results });
    }
  } catch (err) {
    console.error('[Location API] Search failed:', err.message);
  }

  return res.status(500).json({ error: 'Failed to search locations' });
});

/**
 * GET /api/location/ip
 * IP-based location fallback
 */
router.get('/ip', async (req, res) => {
  try {
    const response = await fetch('http://ip-api.com/json/?fields=status,message,country,regionName,city,lat,lon,query');
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success') {
        return res.json({
          name: data.city || 'Local Region',
          district: data.city,
          state: data.regionName,
          country: data.country,
          latitude: data.lat,
          longitude: data.lon,
          formattedAddress: `${data.city}, ${data.regionName}, ${data.country}`,
          source: 'ip'
        });
      }
    }
  } catch (err) {
    console.warn('[Location API] IP geolocation failed:', err.message);
  }

  // Safe default fallback
  return res.json({
    name: 'Hyderabad',
    district: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    latitude: 17.3850,
    longitude: 78.4867,
    formattedAddress: 'Hyderabad, Telangana, India',
    source: 'fallback'
  });
});

module.exports = router;
