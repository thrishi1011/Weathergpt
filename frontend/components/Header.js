/**
 * Header Component
 * WeatherGPT Branding, Interactive Mode Switcher, Backend Connectivity status, and Theme Toggle
 */

export function createHeader({ currentMode = 'chat', onThemeToggle, onStatusClick, onSwitchMode, onOpenModesHub, onSaveRecoveryLink }) {
  const header = document.createElement('header');
  header.className = 'app-header';
  header.id = 'app-header';

  header.innerHTML = `
    <div class="brand-section">
      <div class="brand-logo-badge" id="brand-logo" title="Return to Modes Hub" role="button" tabindex="0">
        ⚡
      </div>
      <div class="brand-info">
        <h1 class="brand-title" id="brand-heading">WeatherGPT</h1>
        <span class="brand-subtitle">Agro & Atmospheric Intelligence</span>
      </div>
    </div>

    <!-- Mode Switcher Navigation Pills -->
    <nav class="header-mode-nav" id="header-mode-nav" aria-label="Workflow Modes">
      <button type="button" class="mode-nav-btn ${currentMode === 'travel' ? 'active' : ''}" data-mode="travel" title="Travelling Mode">
        <span class="nav-icon">🚗</span>
        <span class="nav-text">Travel</span>
      </button>
      <button type="button" class="mode-nav-btn ${currentMode === 'farm' ? 'active' : ''}" data-mode="farm" title="Farming Mode">
        <span class="nav-icon">🌾</span>
        <span class="nav-text">Farming</span>
      </button>
      <button type="button" class="mode-nav-btn ${currentMode === 'outdoor' ? 'active' : ''}" data-mode="outdoor" title="Outdoor Mode">
        <span class="nav-icon">⛅</span>
        <span class="nav-text">Outdoor</span>
      </button>
      <button type="button" class="mode-nav-btn ${currentMode === 'chat' ? 'active' : ''}" data-mode="chat" title="General Chat Mode">
        <span class="nav-icon">💬</span>
        <span class="nav-text">Chat</span>
      </button>
      <button type="button" class="mode-nav-btn btn-hub ${currentMode === 'all' ? 'active' : ''}" data-mode="all" id="btn-open-modes-hub" title="Browse all modes">
        <span class="nav-icon">🎛️</span>
        <span class="nav-text">All Modes</span>
      </button>
    </nav>

    <div class="header-status-group">
      <button type="button" class="recovery-link-header-btn" id="header-recovery-link-btn" title="Save recovery link to restore chats if browser data is cleared">
        🔗 Save recovery link
      </button>

      <button class="connection-pill" id="backend-status-pill" title="Backend connectivity status">
        <span class="status-dot"></span>
        <span id="backend-status-text">Checking Backend...</span>
      </button>

      <button class="theme-toggle-btn" id="theme-toggle-btn" aria-label="Toggle dark/light theme" title="Toggle theme">
        🌙
      </button>
    </div>
  `;

  // Logo click returns to Modes Hub
  const logoBadge = header.querySelector('#brand-logo');
  logoBadge.addEventListener('click', () => {
    setActiveMode('all');
    if (onOpenModesHub) onOpenModesHub();
  });

  const hubBtn = header.querySelector('#btn-open-modes-hub');
  hubBtn.addEventListener('click', () => {
    setActiveMode('all');
    if (onOpenModesHub) onOpenModesHub();
  });

  // Mode Nav Buttons
  header.querySelectorAll('.mode-nav-btn[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      setActiveMode(mode);
      if (onSwitchMode) onSwitchMode(mode);
    });
  });

  function setActiveMode(mode) {
    header.querySelectorAll('.mode-nav-btn[data-mode]').forEach(b => {
      if (b.dataset.mode === mode) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
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

  const recoveryLinkBtn = header.querySelector('#header-recovery-link-btn');
  if (recoveryLinkBtn && onSaveRecoveryLink) {
    recoveryLinkBtn.addEventListener('click', onSaveRecoveryLink);
  }

  return {
    element: header,
    setActiveMode,
    setStatus: ({ available, reason }) => {
      const textEl = header.querySelector('#backend-status-text');
      if (available) {
        statusPill.className = 'connection-pill connected';
        textEl.textContent = 'Backend Connected';
        statusPill.title = reason || 'Live API connection active';
      } else {
        statusPill.className = 'connection-pill offline';
        textEl.textContent = 'Backend Offline';
        statusPill.title = reason || 'Backend is currently offline';
      }
    }
  };
}
