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

    // Validate: location is required
    if (!locationName || locationName.trim() === '') {
      return res.status(400).json({
        error: 'Missing required parameter: location',
        example: 'GET /api/weather?location=Warangal'
      });
    }

    // Resolve location name to coordinates
    const location = await resolveLocation(locationName);

    if (!location) {
      return res.status(404).json({
        error: `Location not found: "${locationName}"`,
        message: 'Please check the spelling or try a different location name.'
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
