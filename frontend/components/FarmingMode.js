/**
 * FarmingMode Component
 * Asks for land location, soil type, and crop type.
 * Generates tailored agro-meteorological advisories for:
 * 1. Best Sowing Time
 * 2. Best Irrigation Schedule
 * 3. Best Crop Cutting / Harvest Time
 */

import { ChartEngine } from './ChartEngine.js';

const SOIL_TYPES = [
  { id: 'black_cotton', name: 'Black Cotton Soil (Regur)', retention: 'High water retention, cracks when dry' },
  { id: 'red_loamy', name: 'Red Loamy Soil', retention: 'Moderate retention, well-draining' },
  { id: 'alluvial', name: 'Alluvial Soil', retention: 'High fertility, balanced moisture' },
  { id: 'clayey', name: 'Clayey Soil', retention: 'Very high moisture, prone to waterlogging' },
  { id: 'sandy_loam', name: 'Sandy Loam Soil', retention: 'Low moisture retention, quick drying' }
];

const CROPS = [
  { id: 'cotton', name: 'Cotton (కత్తి / कपास)', type: 'Kharif Commercial' },
  { id: 'paddy', name: 'Paddy / Rice (వరి / धान)', type: 'Kharif Staple' },
  { id: 'maize', name: 'Maize (మొక్కజొన్న / मक्का)', type: 'Kharif/Rabi' },
  { id: 'chili', name: 'Chili (మిరప / मिर्च)', type: 'Commercial Spice' },
  { id: 'soybean', name: 'Soybean (సోయాబీన్ / सोयाबीन)', type: 'Oilseed' },
  { id: 'groundnut', name: 'Groundnut (వేరుశనగ / मूंगफली)', type: 'Kharif Oilseed' },
  { id: 'wheat', name: 'Wheat (గోధుమ / गेहूँ)', type: 'Rabi Staple' }
];

export function createFarmingMode({ onBackToModes, language = 'en' }) {
  const container = document.createElement('div');
  container.className = 'mode-workspace-view';
  container.id = 'farming-mode-view';
  // Carried through from the global language section in the Header, so this
  // mode's future backend-generated advisories respond in the same language
  // selected everywhere else in the app.
  container.dataset.language = language;

  container.innerHTML = `
    <div class="workspace-header-bar">
      <div class="header-left">
        <button type="button" class="btn-back-modes" id="btn-farm-back" title="Back to Chat">
          ⬅ Back to Chat
        </button>
        <div class="mode-active-tag">
          <span class="mode-tag-icon">🌾</span>
          <span class="mode-tag-name">Farming & Agro-Meteorology Mode</span>
        </div>
      </div>
    </div>

    <div class="mode-two-column-layout">
      <!-- Left Column: Inputs Form -->
      <div class="mode-form-card">
        <h3 class="card-section-title">🌱 Farm & Crop Profile</h3>
        <p class="card-section-subtitle">
          Provide your land location, soil characteristics, and crop type to receive precision weather-based farming advisories.
        </p>

        <form id="farm-profile-form" class="mode-form-stack">
          <!-- Land Location -->
          <div class="form-field-group">
            <label for="farm-location-input" class="field-label">Location of Agricultural Land</label>
            <div class="field-input-wrapper">
              <span class="field-icon">📍</span>
              <input type="text" id="farm-location-input" class="text-input" value="Warangal District" placeholder="Enter village, mandal or district..." required />
            </div>
          </div>

          <!-- Soil Type -->
          <div class="form-field-group">
            <label for="farm-soil-select" class="field-label">Type of Soil</label>
            <div class="field-input-wrapper">
              <span class="field-icon">🪨</span>
              <select id="farm-soil-select" class="select-input" required>
                ${SOIL_TYPES.map(s => `
                  <option value="${s.id}">${s.name}</option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- Crop Selection -->
          <div class="form-field-group">
            <label for="farm-crop-select" class="field-label">Target Crop</label>
            <div class="field-input-wrapper">
              <span class="field-icon">🌿</span>
              <select id="farm-crop-select" class="select-input" required>
                ${CROPS.map(c => `
                  <option value="${c.id}">${c.name} (${c.type})</option>
                `).join('')}
              </select>
            </div>
          </div>

          <button type="submit" class="btn-primary-action" id="btn-analyze-farming">
            <span>Generate Agro-Advisory Plan</span>
            <span>🌾</span>
          </button>
        </form>
      </div>

      <!-- Right Column: Agro Advisories Display -->
      <div class="mode-results-card" id="farm-results-display">
        <div class="advisory-loading-state" id="farm-advisory-host">
          <!-- Populated by JS -->
        </div>
      </div>
    </div>
  `;

  const backBtn = container.querySelector('#btn-farm-back');
  backBtn.addEventListener('click', () => {
    if (onBackToModes) onBackToModes();
  });

  const form = container.querySelector('#farm-profile-form');
  const locInput = container.querySelector('#farm-location-input');
  const soilSelect = container.querySelector('#farm-soil-select');
  const cropSelect = container.querySelector('#farm-crop-select');
  const advisoryHost = container.querySelector('#farm-advisory-host');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    renderFarmAdvisory(locInput.value, soilSelect.value, cropSelect.value);
  });

  function renderFarmAdvisory(location, soilId, cropId) {
    const loc = location.trim() || 'Warangal District';
    const soilObj = SOIL_TYPES.find(s => s.id === soilId) || SOIL_TYPES[0];
    const cropObj = CROPS.find(c => c.id === cropId) || CROPS[0];

    // Crop specific logic
    let sowingVerdict = '';
    let irrigationVerdict = '';
    let harvestVerdict = '';
    let soilMoisturePercent = 74;

    if (soilId === 'black_cotton') {
      soilMoisturePercent = 78;
      sowingVerdict = `Wait 2 days for the upcoming thunderstorm spell to pass before sowing. Black cotton soil has high water retention; immediate sowing before rain risks seed rot and soil capping.`;
      irrigationVerdict = `HOLD IRRIGATION for the next 72 hours. Upcoming 18-22mm precipitation will meet crop evapotranspiration needs. Clear field drainage furrows to avoid stagnation.`;
      harvestVerdict = `Ideal harvest window: Plan crop cutting during the forecasted dry spell between day 12 and 18. Ensure boll/pod moisture is under 12% before picking.`;
    } else if (soilId === 'sandy_loam') {
      soilMoisturePercent = 48;
      sowingVerdict = `Favorable sowing window: Soil has optimal aeration. Complete sowing within 24 hours to take advantage of incoming rain showers.`;
      irrigationVerdict = `Light irrigation recommended 24 hours post-rainfall due to rapid percolation. Schedule 2 hours of drip irrigation next Wednesday.`;
      harvestVerdict = `Safe crop cutting window: Harvest immediately during sunny mornings. Drying is rapid on sandy loam fields.`;
    } else {
      soilMoisturePercent = 65;
      sowingVerdict = `Optimal sowing window is open. Soil temperature and moisture balance are ideal for uniform seed germination.`;
      irrigationVerdict = `Postpone heavy irrigation. Moderate showers will replenish root-zone moisture. Resume light irrigation after 4 days.`;
      harvestVerdict = `Crop cutting should be scheduled in morning hours after dew evaporates. Complete harvesting before next monsoon pulse.`;
    }

    // Chart: 7-Day Rainfall Forecast for Agriculture
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const rainProbabilities = [30, 85, 75, 40, 15, 10, 20];
    const temps = [29, 27, 26, 28, 30, 31, 30];

    const chartSvg = ChartEngine.renderHourlyRainChart({
      hours: days,
      probabilities: rainProbabilities,
      temps: temps
    });

    // Donut: Soil Moisture & Aeration
    const donutSvg = ChartEngine.renderDonutChart({
      title: 'Field Soil Moisture & Field Capacity',
      slices: [
        { label: 'Available Soil Moisture', value: soilMoisturePercent, color: '#06b6d4' },
        { label: 'Soil Aeration / Air Pores', value: 100 - soilMoisturePercent, color: '#10b981' }
      ]
    });

    advisoryHost.innerHTML = `
      <div class="farm-advisory-content">
        <!-- Agro Profile Header -->
        <div class="farm-profile-banner">
          <div class="farm-profile-stat">
            <span class="stat-label">Land Location</span>
            <strong class="stat-val">${loc}</strong>
          </div>
          <div class="farm-profile-stat">
            <span class="stat-label">Soil Profile</span>
            <strong class="stat-val">${soilObj.name.split('(')[0]}</strong>
          </div>
          <div class="farm-profile-stat">
            <span class="stat-label">Selected Crop</span>
            <strong class="stat-val highlight-emerald">${cropObj.name.split('(')[0]}</strong>
          </div>
        </div>

        <!-- 3 Core Advisory Pillars: Sowing, Irrigation, Harvesting -->
        <div class="agro-advisory-cards-grid">
          <!-- 1. Best Sowing Time -->
          <div class="advisory-pill-box sowing-box">
            <div class="advisory-pill-header">
              <span class="pill-icon">🌱</span>
              <h4 class="pill-title">1. Best Sowing Time</h4>
            </div>
            <p class="advisory-pill-body">${sowingVerdict}</p>
            <div class="advisory-action-chip">
              <span>📅 Recommended Window: Within 48-72 hours post-rain</span>
            </div>
          </div>

          <!-- 2. Irrigation Schedule -->
          <div class="advisory-pill-box irrigation-box">
            <div class="advisory-pill-header">
              <span class="pill-icon">💧</span>
              <h4 class="pill-title">2. Best Irrigation Schedule</h4>
            </div>
            <p class="advisory-pill-body">${irrigationVerdict}</p>
            <div class="advisory-action-chip">
              <span>🚰 Irrigation Status: PAUSE for 3 Days (Rain forecasted)</span>
            </div>
          </div>

          <!-- 3. Crop Cutting / Harvest Time -->
          <div class="advisory-pill-box harvest-box">
            <div class="advisory-pill-header">
              <span class="pill-icon">✂️</span>
              <h4 class="pill-title">3. Best Crop Cutting / Harvest Window</h4>
            </div>
            <p class="advisory-pill-body">${harvestVerdict}</p>
            <div class="advisory-action-chip">
              <span>🌾 Safe Harvest Spell: Day 12 to 18 (Dry conditions)</span>
            </div>
          </div>
        </div>

        <!-- Soil Moisture Donut + 7-Day Rainfall Graph -->
        <div class="agro-charts-row">
          <div class="chart-panel-half">
            ${donutSvg}
          </div>
          <div class="chart-panel-half">
            <div class="chart-inner-title">7-Day Rainfall Forecast (Rain Probability %)</div>
            ${chartSvg}
          </div>
        </div>
      </div>
    `;
  }

  // Initial render
  renderFarmAdvisory('Warangal District', 'black_cotton', 'cotton');

  return {
    element: container
  };
}
