const express = require('express');
const router = express.Router();
const { resolveLocation } = require('../services/locationService');
const { getWeather } = require('../services/weatherService');
const { generateAnswer } = require('../services/llmService');

/**
 * POST /api/ask
 * 
 * Request:  { question, location, language }
 * Response: { answer, language }
 * 
 * Flow: question → location → weather data → (IMD data) → LLM → answer
 */
router.post('/', async (req, res) => {
  try {
    const { question, location: locationName, coordinates, language } = req.body;

    // Validate required fields
    if (!question || typeof question !== 'string' || question.trim() === '') {
      return res.status(400).json({
        error: 'Missing required field: question'
      });
    }

    if (!locationName || typeof locationName !== 'string' || locationName.trim() === '') {
      return res.status(400).json({
        error: 'Missing required field: location'
      });
    }

    let location = null;
    if (coordinates && coordinates.latitude != null && coordinates.longitude != null) {
      location = {
        name: locationName.trim(),
        latitude: parseFloat(coordinates.latitude),
        longitude: parseFloat(coordinates.longitude)
      };
    } else {
      // Resolve location name
      location = await resolveLocation(locationName.trim());
    }

    if (!location) {
      return res.status(404).json({
        error: `Location not found: "${locationName}"`,
        message: 'Please check the spelling or try a different location name.'
      });
    }

    // Fetch weather data
    const weather = await getWeather(location);

    // IMD data: will be merged from data/ module (Person 4) in future integration.
    // For now, use the imd_alert already in the weather schema (inactive).
    const imdAlert = weather.imd_alert;

    // Generate answer via LLM service (currently stubbed)
    const result = await generateAnswer({
      question: question.trim(),
      weather,
      imdAlert,
      language: language || 'en'
    });

    return res.json(result);
  } catch (err) {
    console.error('Error in POST /api/ask:', err.message);

    return res.status(502).json({
      error: 'Failed to generate answer',
      message: 'An error occurred while processing your question. Please try again later.'
    });
  }
});

module.exports = router;
