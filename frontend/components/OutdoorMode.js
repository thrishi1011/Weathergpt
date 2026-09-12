/**
 * OutdoorMode Component
 * Prompts user for location, planned outdoor activity, and time slot.
 * Generates:
 * 1. Clear Umbrella Verdict (YES / NO)
 * 2. Clothing & Footwear Recommendation
 * 3. Smart Schedule / Time Modification Suggestion
 * 4. Hourly Rain Probability Chart
 */

import { ChartEngine } from './ChartEngine.js';

const ACTIVITIES = [
  { id: 'sports', name: '🏏 Sports / Cricket / Football', sensitivity: 'High' },
  { id: 'picnic', name: '🧺 Picnic / Park Outing', sensitivity: 'High' },
  { id: 'walk', name: '🚶 Evening Walk / Jogging', sensitivity: 'Medium' },
  { id: 'biking', name: '🚴 Biking / Cycling', sensitivity: 'Very High' },
  { id: 'shopping', name: '🛍️ Market / Street Shopping', sensitivity: 'Medium' },
  { id: 'event', name: '🎪 Open-Air Event / Gathering', sensitivity: 'Critical' }
];

const TIME_SLOTS = [
  { id: 'morning', label: 'Morning (07:00 AM – 10:30 AM)', rainChance: 15, temp: 26 },
  { id: 'afternoon', label: 'Afternoon (12:00 PM – 03:30 PM)', rainChance: 40, temp: 31 },
  { id: 'evening', label: 'Evening (04:00 PM – 07:30 PM)', rainChance: 82, temp: 27 },
  { id: 'night', label: 'Night (08:00 PM – 10:30 PM)', rainChance: 25, temp: 25 }
];

export function createOutdoorMode({ onBackToModes }) {
  const container = document.createElement('div');
  container.className = 'mode-workspace-view';
  container.id = 'outdoor-mode-view';

  container.innerHTML = `
    <div class="workspace-header-bar">
      <div class="header-left">
        <button type="button" class="btn-back-modes" id="btn-outdoor-back" title="Back to mode selection">
          ⬅ Back to Modes
        </button>
        <div class="mode-active-tag">
          <span class="mode-tag-icon">⛅</span>
          <span class="mode-tag-name">Outdoor & Activity Mode</span>
        </div>
      </div>
    </div>

    <div class="mode-two-column-layout">
      <!-- Left Column: Inputs Form -->
      <div class="mode-form-card">
        <h3 class="card-section-title">👟 Outdoor Activity & Timing</h3>
        <p class="card-section-subtitle">
          Tell us where you are going, what you plan to do, and your desired time window for instant clothing, umbrella, and schedule advice.
        </p>

        <form id="outdoor-plan-form" class="mode-form-stack">
          <!-- Location -->
          <div class="form-field-group">
            <label for="outdoor-location-input" class="field-label">Activity Location</label>
            <div class="field-input-wrapper">
              <span class="field-icon">📍</span>
              <input type="text" id="outdoor-location-input" class="text-input" value="Warangal" placeholder="Enter city or area..." required />
            </div>
          </div>

          <!-- Planned Activity -->
          <div class="form-field-group">
            <label for="outdoor-activity-select" class="field-label">What is your planned activity?</label>
            <div class="field-input-wrapper">
              <span class="field-icon">🎯</span>
              <select id="outdoor-activity-select" class="select-input" required>
                ${ACTIVITIES.map(a => `
                  <option value="${a.id}">${a.name}</option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- Planned Time Slot -->
          <div class="form-field-group">
            <label class="field-label">Planned Time Window</label>
            <div class="time-slot-grid" id="outdoor-time-slots">
              ${TIME_SLOTS.map((t, idx) => `
                <button type="button" class="time-slot-chip ${idx === 2 ? 'active' : ''}" data-slot="${t.id}">
                  <span class="chip-label">${t.label.split('(')[0]}</span>
                  <span class="chip-sub">${t.label.split('(')[1].replace(')', '')}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <button type="submit" class="btn-primary-action" id="btn-analyze-outdoor">
            <span>Check Umbrella, Outfit & Schedule</span>
            <span>⛅</span>
          </button>
        </form>
      </div>

      <!-- Right Column: Advisory Display -->
      <div class="mode-results-card" id="outdoor-results-display">
        <div class="advisory-loading-state" id="outdoor-advisory-host">
          <!-- Populated by JS -->
        </div>
      </div>
    </div>
  `;

  const backBtn = container.querySelector('#btn-outdoor-back');
  backBtn.addEventListener('click', () => {
    if (onBackToModes) onBackToModes();
  });

  const form = container.querySelector('#outdoor-plan-form');
  const locInput = container.querySelector('#outdoor-location-input');
  const actSelect = container.querySelector('#outdoor-activity-select');
  const slotChips = container.querySelectorAll('.time-slot-chip');
  const advisoryHost = container.querySelector('#outdoor-advisory-host');

  let activeSlot = 'evening';

  slotChips.forEach(chip => {
    chip.addEventListener('click', () => {
      slotChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeSlot = chip.dataset.slot;
      renderOutdoorAdvisory(locInput.value, actSelect.value, activeSlot);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    renderOutdoorAdvisory(locInput.value, actSelect.value, activeSlot);
  });

  function renderOutdoorAdvisory(location, activityId, slotId) {
    const loc = location.trim() || 'Warangal';
    const actObj = ACTIVITIES.find(a => a.id === activityId) || ACTIVITIES[0];
    const slotObj = TIME_SLOTS.find(t => t.id === slotId) || TIME_SLOTS[2];

    const needsUmbrella = slotObj.rainChance >= 50;

    // Recommendation strings
    const umbrellaBadge = needsUmbrella 
      ? `
        <div class="umbrella-verdict-banner need-umbrella">
          <div class="verdict-icon-big">☔</div>
          <div class="verdict-text-block">
            <span class="verdict-tag red">DEFINITELY CARRY AN UMBRELLA</span>
            <h4 class="verdict-main-text">YES — High Rain Likelihood (${slotObj.rainChance}%)</h4>
            <p class="verdict-detail">Thunderstorm showers are expected during your chosen time slot in ${loc}.</p>
          </div>
        </div>
      ` 
      : `
        <div class="umbrella-verdict-banner no-umbrella">
          <div class="verdict-icon-big">☀️</div>
          <div class="verdict-text-block">
            <span class="verdict-tag green">NO UMBRELLA NEEDED</span>
            <h4 class="verdict-main-text">Clear & Dry Weather (${slotObj.rainChance}% Rain Chance)</h4>
            <p class="verdict-detail">Safe to leave the umbrella behind for this time window in ${loc}.</p>
          </div>
        </div>
      `;

    let clothingAdvice = '';
    if (slotObj.temp > 29) {
      clothingAdvice = `Wear loose, breathable cotton clothes. Light colors are ideal to reflect solar radiation. If rain arrives, pack a thin waterproof windcheater.`;
    } else {
      clothingAdvice = `Light comfortable casuals with water-resistant footwear. Bring an easily packable rain poncho or lightweight hooded windcheater for sudden gusts.`;
    }

    let timeShiftAdvice = '';
    if (needsUmbrella) {
      timeShiftAdvice = `
        <div class="time-shift-card alert-shift">
          <div class="shift-header">
            <span class="shift-icon">⏰</span>
            <strong class="shift-title">Recommended Schedule Modification</strong>
          </div>
          <p class="shift-text">
            Heavy thunderstorm cells are concentrated between <strong>04:00 PM and 05:15 PM</strong>. 
            <strong>Shift your ${actObj.name.split('/')[0]} to 05:45 PM</strong> (or early morning before 10 AM) to enjoy pleasant skies without downpours.
          </p>
        </div>
      `;
    } else {
      timeShiftAdvice = `
        <div class="time-shift-card safe-shift">
          <div class="shift-header">
            <span class="shift-icon">✅</span>
            <strong class="shift-title">Schedule Timing is Optimal</strong>
          </div>
          <p class="shift-text">
            Your chosen time window (${slotObj.label.split('(')[0]}) has steady atmospheric stability. No schedule adjustment required.
          </p>
        </div>
      `;
    }

    const hours = ['1 PM', '3 PM', '5 PM', '7 PM', '9 PM', '11 PM'];
    const probs = [35, 60, 85, 70, 30, 15];
    const temps = [31, 30, 27, 26, 25, 24];

    const chartSvg = ChartEngine.renderHourlyRainChart({
      hours,
      probabilities: probs,
      temps
    });

    advisoryHost.innerHTML = `
      <div class="outdoor-advisory-content">
        <!-- 1. Umbrella Verdict Box -->
        ${umbrellaBadge}

        <!-- 2. Clothing & Outfit Recommendation -->
        <div class="advisory-sub-section">
          <div class="clothing-guide-box">
            <div class="clothing-header">
              <span class="clothing-icon">👕</span>
              <h4 class="clothing-title">Recommended Clothes & Gear</h4>
            </div>
            <p class="clothing-desc">${clothingAdvice}</p>
            <div class="gear-checklist-row">
              <span class="gear-tag">👟 Water-Resistant Shoes</span>
              <span class="gear-tag">🧢 Breathable Cap</span>
              <span class="gear-tag">🕶️ UV Sunglasses</span>
              ${needsUmbrella ? '<span class="gear-tag highlight-rose">🌂 Compact Umbrella</span>' : ''}
            </div>
          </div>
        </div>

        <!-- 3. Smart Schedule Modification -->
        <div class="advisory-sub-section">
          ${timeShiftAdvice}
        </div>

        <!-- 4. Hourly Rain Probability Chart -->
        <div class="advisory-sub-section">
          <div class="section-title-bar">
            <span>📊 Hourly Rain Likelihood Curve for ${loc}</span>
          </div>
          ${chartSvg}
        </div>
      </div>
    `;
  }

  // Initial render
  renderOutdoorAdvisory('Warangal', 'sports', 'evening');

  return {
    element: container
  };
}
