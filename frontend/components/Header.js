/**
 * Header Component
 * WeatherGPT Branding, Backend Connectivity status,
 * Global Language Selector, and Theme Toggle.
 * Mode switcher removed — app runs in Chat-only mode.
 */

import { bindLiveDate } from '../utils/dateTime.js';
import { LANGUAGES, DEFAULT_LANGUAGE } from '../utils/languages.js';

export function createHeader({
  currentLanguage = DEFAULT_LANGUAGE,
  onThemeToggle,
  onStatusClick,
  onLanguageChange
}) {
  const header = document.createElement('header');
  header.className = 'app-header';
  header.id = 'app-header';

  header.innerHTML = `
    <!-- Global Language Section: sits above everything else, applies to every mode -->
    <div class="header-language-bar" id="header-language-bar">
      <span class="language-bar-icon">🌐</span>
      <span class="language-bar-label">Language:</span>
      <div class="language-bar-pills" id="language-bar-pills" role="group" aria-label="Select app language">
        ${LANGUAGES.map(lang => `
          <button
            type="button"
            class="lang-pill-btn ${lang.code === currentLanguage ? 'active' : ''}"
            data-lang="${lang.code}"
            id="global-lang-pill-${lang.code}"
          >
            ${lang.label}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Main Row: Branding, Date, Status -->
    <div class="header-main-row" id="header-main-row">
      <div class="brand-section">
        <div class="brand-logo-badge" id="brand-logo" title="WeatherGPT" role="img" aria-label="WeatherGPT">
          ⚡
        </div>
        <div class="brand-info">
          <h1 class="brand-title" id="brand-heading">WeatherGPT</h1>
          <span class="brand-subtitle">Agro &amp; Atmospheric Intelligence</span>
        </div>
      </div>

      <!-- Current Day & Date, visible on every screen -->
      <div class="header-date-display" id="header-date-display" title="Today's date">
        <span class="header-date-icon">📅</span>
        <span class="header-date-text" id="header-date-text"></span>
      </div>

      <div class="header-status-group">
        <button class="connection-pill" id="backend-status-pill" title="Backend connectivity status">
          <span class="status-dot"></span>
          <span id="backend-status-text">Checking Backend...</span>
        </button>

        <button class="theme-toggle-btn" id="theme-toggle-btn" aria-label="Toggle dark/light theme" title="Toggle theme">
          🌙
        </button>
      </div>
    </div>
  `;

  // ---- Global Language Selector ----
  const languagePillsGroup = header.querySelector('#language-bar-pills');
  languagePillsGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.lang-pill-btn');
    if (!btn) return;
    const lang = btn.dataset.lang;
    setActiveLanguage(lang);
    if (onLanguageChange) onLanguageChange(lang);
  });

  function setActiveLanguage(lang) {
    languagePillsGroup.querySelectorAll('.lang-pill-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === lang);
    });
  }

  const themeBtn = header.querySelector('#theme-toggle-btn');
  themeBtn.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const nextTheme = isLight ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', nextTheme);
    themeBtn.textContent = isLight ? '🌙' : '☀️';
    if (onThemeToggle) onThemeToggle(nextTheme);
  });

  const statusPill = header.querySelector('#backend-status-pill');
  if (onStatusClick) {
    statusPill.addEventListener('click', onStatusClick);
  }

  // Live day & date, kept in sync across midnight
  const dateTextEl = header.querySelector('#header-date-text');
  const stopDateBinding = bindLiveDate(dateTextEl);

  return {
    element: header,
    setActiveLanguage,
    destroy: () => {
      stopDateBinding();
      if (header.parentNode) {
        header.parentNode.removeChild(header);
      }
    },
    setStatus: ({ available, reason }) => {
      const textEl = header.querySelector('#backend-status-text');
      if (available) {
        statusPill.className = 'connection-pill';
        textEl.textContent = 'Backend: Connected';
        statusPill.title = reason || 'Live API connection active';
      } else {
        statusPill.className = 'connection-pill offline-mode';
        textEl.textContent = 'Backend: Demo Mode';
        statusPill.title = reason || 'Click to retry connection to live backend';
      }
    }
  };
}
