const express = require('express');
const router = express.Router();
const { resolveLocation } = require('../services/locationService');
const { getWeather } = require('../services/weatherService');

/**
 * GET /api/weather?location=Warangal
 * 
 * Returns weather data conforming to shared/weather-schema.json.
 */
router.get('/', async (req, res) => {
  try {
    const locationName = req.query.location;
    const lat = req.query.lat || req.query.latitude;
    const lon = req.query.lon || req.query.longitude;

    let location = null;

    if (lat != null && lon != null && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lon))) {
      location = {
        name: locationName && locationName.trim() ? locationName.trim() : 'Detected Location',
        latitude: parseFloat(lat),
        longitude: parseFloat(lon)
      };
    } else if (locationName && locationName.trim() !== '') {
      // Resolve location name to coordinates
      location = await resolveLocation(locationName.trim());
      if (!location) {
        return res.status(404).json({
          error: `Location not found: "${locationName}"`,
          message: 'Please check the spelling or try a different location name.'
        });
      }
    } else {
      return res.status(400).json({
        error: 'Missing required parameter: location or lat/lon',
        example: 'GET /api/weather?location=Warangal or GET /api/weather?lat=17.9689&lon=79.5941'
      });
    }

    // Fetch weather data
    const weather = await getWeather(location);

    return res.json(weather);
  } catch (err) {
    console.error('Error in GET /api/weather:', err.message);

    // External API failure — controlled error
    return res.status(502).json({
      error: 'Failed to fetch weather data',
      message: 'The external weather service is currently unavailable. Please try again later.'
    });
  }
});

module.exports = router;
