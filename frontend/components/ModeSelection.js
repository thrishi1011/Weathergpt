/**
 * ModeSelection Component
 * Curated hub where users select their intended mode:
 * 1. Travelling Mode
 * 2. Farming Mode
 * 3. Outdoor Mode
 * 4. General / Chat Mode
 *
 * Includes top quick-jump navigation buttons that smoothly scroll/lead to the cards,
 * clear prominent launch buttons on all cards, and keyboard accessibility.
 */

export function createModeSelection({ onSelectMode }) {
  const container = document.createElement('div');
  container.className = 'mode-selection-page';
  container.id = 'mode-selection-screen';

  container.innerHTML = `
    <div class="mode-selection-wrapper">
      <div class="mode-header-text">
        <div class="mode-badge-pill">⚡ Choose Your Experience</div>
        <h2 class="mode-selection-title">What would you like to plan today?</h2>
        <p class="mode-selection-subtitle">
          Select a specialized intelligence mode below, or jump directly using the buttons.
        </p>
      </div>

      <div class="modes-grid-container" id="modes-grid">
        <!-- 1. Travelling Mode Card -->
        <div class="mode-card-item card-travel" id="card-mode-travel" data-mode="travel" tabindex="0" role="button" aria-label="Select Travelling Mode">
          <div class="mode-card-banner">
            <div class="mode-icon-circle icon-travel">🚗</div>
            <span class="mode-pill-tag">Route Optimizer</span>
          </div>
          <div class="mode-card-body">
            <h3 class="mode-card-title">Travelling Mode</h3>
            <p class="mode-card-desc">
              Calculate expected journey duration, detect highway weather hazards, and get <strong>the most accurate time to start your journey</strong> to avoid storms.
            </p>
            <ul class="mode-feature-list">
              <li>🛣️ Origin to Destination Route Check</li>
              <li>⏰ Best Departure Window Recommendation</li>
              <li>⚠️ Fog, Squall & Waterlogging Warnings</li>
            </ul>
          </div>
          <div class="mode-card-footer">
            <button type="button" class="btn-card-launch" data-mode="travel">
              <span>Enter Travelling Mode</span>
              <span class="btn-arrow">➔</span>
            </button>
          </div>
        </div>

        <!-- 2. Farming Mode Card -->
        <div class="mode-card-item card-farm" id="card-mode-farm" data-mode="farm" tabindex="0" role="button" aria-label="Select Farming Mode">
          <div class="mode-card-banner">
            <div class="mode-icon-circle icon-farm">🌾</div>
            <span class="mode-pill-tag">Agro-Meteorology</span>
          </div>
          <div class="mode-card-body">
            <h3 class="mode-card-title">Farming Mode</h3>
            <p class="mode-card-desc">
              Input land location, soil type, and target crop to receive precision advisories on <strong>best sowing time, irrigation schedules, and safe harvesting windows</strong>.
            </p>
            <ul class="mode-feature-list">
              <li>🌱 Soil-Moisture Sowing Index</li>
              <li>💧 Rain-Aware Irrigation Timing</li>
              <li>✂️ Safe Crop Cutting / Harvest Spell</li>
            </ul>
          </div>
          <div class="mode-card-footer">
            <button type="button" class="btn-card-launch" data-mode="farm">
              <span>Enter Farming Mode</span>
              <span class="btn-arrow">➔</span>
            </button>
          </div>
        </div>

        <!-- 3. Outdoor Mode Card -->
        <div class="mode-card-item card-outdoor" id="card-mode-outdoor" data-mode="outdoor" tabindex="0" role="button" aria-label="Select Outdoor Mode">
          <div class="mode-card-banner">
            <div class="mode-icon-circle icon-outdoor">⛅</div>
            <span class="mode-pill-tag">Activities & Gear</span>
          </div>
          <div class="mode-card-body">
            <h3 class="mode-card-title">Outdoor Mode</h3>
            <p class="mode-card-desc">
              Get an instant <strong>Umbrella Verdict (YES/NO)</strong>, tailored clothing recommendations, and smart schedule adjustments according to rain probability.
            </p>
            <ul class="mode-feature-list">
              <li>☔ Umbrella Verdict: Carry or Not?</li>
              <li>👕 What Clothes & Footwear to Wear</li>
              <li>⏰ Optimal Time Shift Recommendations</li>
            </ul>
          </div>
          <div class="mode-card-footer">
            <button type="button" class="btn-card-launch" data-mode="outdoor">
              <span>Enter Outdoor Mode</span>
              <span class="btn-arrow">➔</span>
            </button>
          </div>
        </div>

        <!-- 4. General / Chat Mode Card -->
        <div class="mode-card-item card-chat" id="card-mode-chat" data-mode="chat" tabindex="0" role="button" aria-label="Select General Weather Mode">
          <div class="mode-card-banner">
            <div class="mode-icon-circle icon-chat">💬</div>
            <span class="mode-pill-tag">Conversational AI</span>
          </div>
          <div class="mode-card-body">
            <h3 class="mode-card-title">General WeatherGPT</h3>
            <p class="mode-card-desc">
              Ask natural questions like <em>"Will it rain today?"</em> with clear, humanoid answers, actionable CAN/AVOID lists, and interactive SVG charts.
            </p>
            <ul class="mode-feature-list">
              <li>🗣️ Direct Humanoid Verdicts on Rain</li>
              <li>📊 24h Rain Likelihood & Temp Graphs</li>
              <li>🎙️ Voice Input & Multilingual Speech</li>
            </ul>
          </div>
          <div class="mode-card-footer">
            <button type="button" class="btn-card-launch" data-mode="chat">
              <span>Enter Chat Mode</span>
              <span class="btn-arrow">➔</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;


  // Card & Button Launch Handlers
  container.querySelectorAll('.btn-card-launch').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const mode = btn.dataset.mode;
      if (onSelectMode) onSelectMode(mode);
    });
  });

  container.querySelectorAll('.mode-card-item').forEach(card => {
    const handleSelect = () => {
      const mode = card.dataset.mode;
      if (onSelectMode) onSelectMode(mode);
    };

    card.addEventListener('click', handleSelect);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSelect();
      }
    });
  });

  return {
    element: container
  };
}
