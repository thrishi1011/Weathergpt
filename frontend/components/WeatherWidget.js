/**
 * WeatherWidget Component
 * Displays live weather metrics and IMD alerts adhering strictly to shared/weather-schema.json
 */

function getConditionIcon(condition = '') {
  const c = condition.toLowerCase();
  if (c.includes('thunder') || c.includes('lightning')) return '⛈️';
  if (c.includes('heavy rain') || c.includes('downpour')) return '🌧️';
  if (c.includes('rain') || c.includes('shower')) return '🌦️';
  if (c.includes('cloud') || c.includes('overcast')) return '⛅';
  if (c.includes('haze') || c.includes('fog') || c.includes('smoke')) return '🌫️';
  return '☀️';
}

function formatTime(isoString) {
  if (!isoString) return 'Just now';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Just now';
  }
}

export function createWeatherWidget() {
  const container = document.createElement('div');
  container.className = 'weather-telemetry-card';
  container.id = 'weather-telemetry-widget';

  container.innerHTML = `
    <div class="weather-card-top">
      <div>
        <h2 class="weather-place-title" id="weather-location-name">--</h2>
        <div class="weather-timestamp" id="weather-timestamp-label">Updating...</div>
      </div>
      <div class="weather-condition-badge" id="weather-condition-icon">🌤️</div>
    </div>

    <div class="weather-primary-stats">
      <div class="weather-temperature" id="weather-temp-value">--°C</div>
      <div class="weather-condition-text" id="weather-condition-desc">Loading telemetry...</div>
    </div>

    <div class="rain-probability-container">
      <div class="rain-label-row">
        <span>🌧️ Rain Probability</span>
        <span id="weather-rain-prob-label">--%</span>
      </div>
      <div class="rain-progress-track">
        <div class="rain-progress-bar" id="weather-rain-bar" style="width: 0%;"></div>
      </div>
    </div>

    <div class="weather-metrics-grid">
      <div class="metric-pill" title="Relative Humidity">
        <span class="metric-icon">💧</span>
        <span class="metric-label">Humidity</span>
        <span class="metric-value" id="weather-humidity-val">--%</span>
      </div>
      <div class="metric-pill" title="Wind Velocity">
        <span class="metric-icon">💨</span>
        <span class="metric-label">Wind</span>
        <span class="metric-value" id="weather-wind-val">-- km/h</span>
      </div>
      <div class="metric-pill" title="24h Rainfall">
        <span class="metric-icon">☔</span>
        <span class="metric-label">Rainfall</span>
        <span class="metric-value" id="weather-rainfall-val">-- mm</span>
      </div>
    </div>

    <!-- IMD Alert Container -->
    <div id="imd-alert-host"></div>
  `;

  const locEl = container.querySelector('#weather-location-name');
  const timeEl = container.querySelector('#weather-timestamp-label');
  const iconEl = container.querySelector('#weather-condition-icon');
  const tempEl = container.querySelector('#weather-temp-value');
  const descEl = container.querySelector('#weather-condition-desc');
  const rainLabel = container.querySelector('#weather-rain-prob-label');
  const rainBar = container.querySelector('#weather-rain-bar');
  const humidityEl = container.querySelector('#weather-humidity-val');
  const windEl = container.querySelector('#weather-wind-val');
  const rainfallEl = container.querySelector('#weather-rainfall-val');
  const alertHost = container.querySelector('#imd-alert-host');

  function updateData(weatherData) {
    if (!weatherData) return;

    locEl.textContent = weatherData.location || 'Unknown Station';
    timeEl.textContent = `Updated: ${formatTime(weatherData.timestamp)}`;
    iconEl.textContent = getConditionIcon(weatherData.weather_condition);

    const temp = weatherData.temperature !== null ? `${weatherData.temperature.toFixed(1)}°C` : '--';
    tempEl.textContent = temp;

    descEl.textContent = weatherData.weather_condition || 'Normal';

    const rainProb = weatherData.rain_probability ?? 0;
    rainLabel.textContent = `${rainProb}%`;
    rainBar.style.width = `${Math.min(100, Math.max(0, rainProb))}%`;

    humidityEl.textContent = weatherData.humidity !== null ? `${weatherData.humidity}%` : '--';
    windEl.textContent = weatherData.wind_speed !== null ? `${weatherData.wind_speed} km/h` : '--';
    rainfallEl.textContent = weatherData.rainfall !== null ? `${weatherData.rainfall} mm` : '0 mm';

    // Render IMD Alert
    const alert = weatherData.imd_alert;
    if (alert && alert.active) {
      const severityClass = (alert.severity || '').toLowerCase() === 'red' 
        ? 'severity-red' 
        : (alert.severity || '').toLowerCase() === 'yellow' 
          ? 'severity-yellow' 
          : 'severity-orange';

      alertHost.innerHTML = `
        <div class="imd-alert-card ${severityClass}" id="active-imd-alert">
          <div class="imd-alert-header">
            <div class="imd-tag-group">
              <span class="imd-severity-badge">${alert.severity || 'ALERT'}</span>
              <span class="imd-event-title">${alert.event || 'Weather Warning'}</span>
            </div>
          </div>
          <p class="imd-message">${alert.message || 'Advisory issued by India Meteorological Department.'}</p>
        </div>
      `;
    } else {
      alertHost.innerHTML = `
        <div class="imd-inactive-banner" id="active-imd-alert">
          <span>🛡️</span>
          <span>IMD Status: No severe weather warnings active.</span>
        </div>
      `;
    }
  }

  return {
    element: container,
    update: updateData
  };
}
