/**
 * Header Component
 * WeatherGPT Branding, Global Language Selector, Recovery Link, and Theme Toggle.
 */

import { LANGUAGES, DEFAULT_LANGUAGE } from '../utils/languages.js';

export function createHeader({
  currentLanguage = DEFAULT_LANGUAGE,
  onThemeToggle,
  onSaveRecoveryLink,
  onLanguageChange
}) {
  const header = document.createElement('header');
  header.className = 'app-header';
  header.id = 'app-header';

  header.innerHTML = `
    <!-- Global Language Section: sits at the top -->
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

    <!-- Main Row: Branding, Recovery Link, Theme Toggle -->
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

      <div class="header-status-group">
        <button type="button" class="recovery-link-header-btn" id="header-recovery-link-btn" title="Save recovery link to restore chats if browser data is cleared">
          🔗 Save recovery link
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

  const recoveryLinkBtn = header.querySelector('#header-recovery-link-btn');
  if (recoveryLinkBtn && onSaveRecoveryLink) {
    recoveryLinkBtn.addEventListener('click', onSaveRecoveryLink);
  }

  return {
    element: header,
    setActiveLanguage,
    destroy: () => {
      if (header.parentNode) {
        header.parentNode.removeChild(header);
      }
    },
    setStatus: () => {}
  };
}
