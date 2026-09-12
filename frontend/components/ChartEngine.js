/**
 * WeatherGPT SVG Chart Engine
 * Lightweight, zero-dependency, ultra-crisp SVG chart generator.
 * Fully responsive, high-contrast, and color-adaptive for Dark & Light modes.
 */

export const ChartEngine = {
  /**
   * Render an hourly rain probability and temperature chart
   * @param {Object} options
   * @param {Array<string>} options.hours - e.g. ['2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM']
   * @param {Array<number>} options.probabilities - e.g. [20, 45, 85, 75, 40, 15]
   * @param {Array<number>} [options.temps] - e.g. [31, 30, 27, 26, 27, 28]
   * @returns {string} SVG HTML string
   */
  renderHourlyRainChart({ hours = [], probabilities = [], temps = [] }) {
    if (!hours.length || !probabilities.length) return '';

    const width = 540;
    const height = 180;
    const padding = { top: 28, right: 30, bottom: 35, left: 42 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const barW = Math.min(36, chartW / hours.length * 0.58);
    const stepX = chartW / hours.length;

    // Grid lines for 0%, 50%, 100%
    const gridLevels = [0, 50, 100];
    const gridLinesSvg = gridLevels.map(lvl => {
      const y = padding.top + chartH - (lvl / 100 * chartH);
      return `
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" 
              stroke="var(--border-subtle)" stroke-dasharray="3,3" stroke-width="1" />
        <text x="${padding.left - 8}" y="${y + 4}" font-size="10" fill="var(--text-dim)" 
              text-anchor="end" font-family="var(--font-body)">${lvl}%</text>
      `;
    }).join('');

    // Bars for Rain Probability
    const barsSvg = probabilities.map((prob, i) => {
      const barH = Math.max(4, (prob / 100) * chartH);
      const x = padding.left + (i * stepX) + (stepX - barW) / 2;
      const y = padding.top + chartH - barH;
      const isHigh = prob >= 60;
      const fillColor = isHigh ? 'url(#rainBarHigh)' : 'url(#rainBarNorm)';
      const textColor = isHigh ? 'var(--accent-rose)' : 'var(--accent-cyan)';

      return `
        <g class="chart-bar-group">
          <rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="4" fill="${fillColor}">
            <title>${hours[i]}: ${prob}% Rain Likelihood</title>
          </rect>
          <!-- Percentage label above bar -->
          <text x="${x + barW / 2}" y="${y - 6}" font-size="10" font-weight="700" 
                fill="${textColor}" text-anchor="middle" font-family="var(--font-display)">
            ${prob}%
          </text>
          <!-- Time label below axis -->
          <text x="${x + barW / 2}" y="${padding.top + chartH + 18}" font-size="11" font-weight="500" 
                fill="var(--text-muted)" text-anchor="middle" font-family="var(--font-body)">
            ${hours[i]}
          </text>
        </g>
      `;
    }).join('');

    // Temperature Trend Line (if temps provided)
    let tempPathSvg = '';
    if (temps.length === hours.length) {
      const minTemp = Math.min(...temps) - 2;
      const maxTemp = Math.max(...temps) + 2;
      const tempRange = Math.max(1, maxTemp - minTemp);

      const points = temps.map((t, i) => {
        const x = padding.left + (i * stepX) + stepX / 2;
        const y = padding.top + chartH - ((t - minTemp) / tempRange * (chartH * 0.75)) - 10;
        return { x, y, t };
      });

      const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

      const dots = points.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#f59e0b" stroke="var(--bg-primary)" stroke-width="1.5" />
        <text x="${p.x}" y="${p.y - 8}" font-size="9" font-weight="600" fill="#f59e0b" text-anchor="middle">
          ${p.t}°
        </text>
      `).join('');

      tempPathSvg = `
        <path d="${lineD}" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="4,2" />
        ${dots}
      `;
    }

    return `
      <div class="svg-chart-wrapper" style="width: 100%; overflow-x: auto;">
        <svg viewBox="0 0 ${width} ${height}" class="weather-svg-chart" style="width: 100%; height: auto; min-width: 320px; display: block;">
          <defs>
            <linearGradient id="rainBarNorm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.9" />
              <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.4" />
            </linearGradient>
            <linearGradient id="rainBarHigh" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.95" />
              <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.5" />
            </linearGradient>
          </defs>
          ${gridLinesSvg}
          ${barsSvg}
          ${tempPathSvg}
        </svg>
      </div>
    `;
  },

  /**
   * Render a Donut / Pie chart with high contrast legend
   * @param {Object} options
   * @param {string} options.title - Chart title
   * @param {Array<{label: string, value: number, color: string}>} options.slices
   * @returns {string} SVG HTML string
   */
  renderDonutChart({ title = '', slices = [] }) {
    if (!slices.length) return '';

    const total = slices.reduce((acc, s) => acc + s.value, 0);
    const size = 160;
    const cx = size / 2;
    const cy = size / 2;
    const radius = 58;
    const strokeWidth = 24;
    const circumference = 2 * Math.PI * radius;

    let accumulatedAngle = 0;
    const paths = slices.map((slice) => {
      const fraction = slice.value / total;
      const strokeDasharray = `${fraction * circumference} ${circumference}`;
      const strokeDashoffset = -accumulatedAngle * circumference;
      accumulatedAngle += fraction;

      return `
        <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none"
                stroke="${slice.color}" stroke-width="${strokeWidth}"
                stroke-dasharray="${strokeDasharray}" stroke-dashoffset="${strokeDashoffset}"
                transform="rotate(-90 ${cx} ${cy})">
          <title>${slice.label}: ${slice.value}%</title>
        </circle>
      `;
    }).join('');

    const legendItems = slices.map(s => `
      <div class="donut-legend-item">
        <span class="legend-swatch" style="background: ${s.color};"></span>
        <span class="legend-label">${s.label}</span>
        <strong class="legend-val">${s.value}%</strong>
      </div>
    `).join('');

    return `
      <div class="donut-chart-container">
        ${title ? `<div class="chart-inner-title">${title}</div>` : ''}
        <div class="donut-visual-row">
          <svg viewBox="0 0 ${size} ${size}" class="donut-svg" width="${size}" height="${size}">
            <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="var(--border-subtle)" stroke-width="${strokeWidth}" />
            ${paths}
            <text x="${cx}" y="${cy + 5}" text-anchor="middle" font-family="var(--font-display)" font-size="14" font-weight="700" fill="var(--text-main)">
              ${slices[0] ? `${slices[0].value}%` : ''}
            </text>
          </svg>
          <div class="donut-legend-list">
            ${legendItems}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Render Route Hazard Timeline for Travelling Mode
   * @param {Array<{location: string, distance: string, weather: string, condition: string, safe: boolean, rainProb: number}>} stops
   * @returns {string} HTML string
   */
  renderRouteTimeline(stops = []) {
    if (!stops.length) return '';

    const stopItems = stops.map((stop, i) => {
      const badgeClass = stop.safe ? 'safe-badge' : 'hazard-badge';
      const icon = stop.safe ? '🟢' : '⚠️';
      return `
        <div class="timeline-stop-item ${stop.safe ? 'status-safe' : 'status-hazard'}">
          <div class="timeline-node-marker">
            <span class="node-icon">${icon}</span>
          </div>
          <div class="timeline-stop-content">
            <div class="stop-header-row">
              <span class="stop-name">${stop.location}</span>
              <span class="stop-distance">${stop.distance}</span>
            </div>
            <div class="stop-weather-info">
              <span class="stop-cond">${stop.condition}</span>
              <span class="stop-rain-prob">${stop.rainProb}% rain chance</span>
            </div>
            <div class="stop-advice ${badgeClass}">
              ${stop.weather}
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="route-timeline-container">
        ${stopItems}
      </div>
    `;
  }
};
