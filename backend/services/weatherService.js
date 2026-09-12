/**
 * Weather Service
 * 
 * Fetches weather data from Open-Meteo and transforms it into the
 * WeatherGPT internal schema (shared/weather-schema.json).
 * 
 * Open-Meteo is free and requires no API key.
 */

const BASE_URL = process.env.OPEN_METEO_BASE_URL || 'https://api.open-meteo.com/v1';

/**
 * Fetch current weather for the given coordinates.
 * Returns data conforming to the shared weather schema.
 */
async function getWeather(location) {
  const { latitude, longitude, name } = location;

  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'precipitation',
      'weather_code',
      'wind_speed_10m'
    ].join(','),
    daily: 'precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '1'
  });

  const url = `${BASE_URL}/forecast?${params}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Open-Meteo API returned status ${response.status}`);
  }

  const data = await response.json();

  return transformToSchema(data, name);
}

/**
 * Map Open-Meteo WMO weather codes to human-readable conditions.
 */
function weatherCodeToCondition(code) {
  const mapping = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };
  return mapping[code] || 'Unknown';
}

/**
 * Transform raw Open-Meteo response into the shared weather schema.
 * imd_alert is left as inactive — Person 4's data module will provide real IMD data later.
 */
function transformToSchema(data, locationName) {
  const current = data.current;
  const daily = data.daily;

  return {
    location: locationName,
    timestamp: current.time,
    temperature: current.temperature_2m,
    humidity: current.relative_humidity_2m,
    rain_probability: daily.precipitation_probability_max
      ? daily.precipitation_probability_max[0]
      : null,
    rainfall: current.precipitation,
    wind_speed: current.wind_speed_10m,
    weather_condition: weatherCodeToCondition(current.weather_code),
    // IMD alert is not populated here — will be merged from data/ module (Person 4)
    imd_alert: {
      active: false,
      severity: '',
      event: '',
      message: ''
    }
  };
}

module.exports = { getWeather };
