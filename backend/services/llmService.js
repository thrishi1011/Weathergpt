/**
 * LLM Service — Integration Interface
 * 
 * This service defines the integration point for Person 3's LLM module.
 * 
 * Current state: STUB — returns a placeholder response indicating that
 * the LLM module is not yet connected.
 * 
 * Future integration:
 * Person 3 will implement the LLM module in llm/ which the backend will
 * import/call here. The flow is:
 *   question + weather data + IMD data → LLM → natural language answer
 * 
 * The interface is designed so that swapping the stub for a real LLM call
 * requires changes only in this file.
 */

/**
 * Generate an answer to a weather-related question using weather context.
 * 
 * @param {Object} params
 * @param {string} params.question  - User's natural-language question
 * @param {Object} params.weather   - Weather data (shared schema)
 * @param {Object} params.imdAlert  - IMD alert data (from data/ module)
 * @param {string} params.language  - Response language code (e.g., 'en', 'hi', 'te')
 * @returns {Promise<{answer: string, language: string}>}
 */
async function generateAnswer({ question, weather, imdAlert, language }) {
  // STUB: Build a basic contextual response from available weather data.
  // This will be replaced by a real LLM call once Person 3's module is ready.

  const condition = weather.weather_condition || 'unknown';
  const temp = weather.temperature != null ? `${weather.temperature}°C` : 'N/A';
  const humidity = weather.humidity != null ? `${weather.humidity}%` : 'N/A';
  const rainProb = weather.rain_probability != null ? `${weather.rain_probability}%` : 'N/A';
  const windSpeed = weather.wind_speed != null ? `${weather.wind_speed} km/h` : 'N/A';

  const answer = [
    `[WeatherGPT — LLM not yet connected]`,
    ``,
    `Current weather in ${weather.location}: ${condition}.`,
    `Temperature: ${temp}, Humidity: ${humidity}.`,
    `Rain probability: ${rainProb}, Wind speed: ${windSpeed}.`,
    ``,
    `Your question: "${question}"`,
    ``,
    `Note: This is a placeholder response. Once the LLM module (Person 3) is integrated,`,
    `WeatherGPT will provide intelligent, contextual answers based on weather data and IMD alerts.`
  ].join('\n');

  return {
    answer,
    language: language || 'en'
  };
}

module.exports = { generateAnswer };
