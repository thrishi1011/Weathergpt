/**
 * SplashScreen Component
 * Displays an eye-catching, unique animated WeatherGPT logo,
 * feature badges, and smooth transition into Mode Selection.
 */

export function createSplashScreen({ onContinue }) {
  const container = document.createElement('div');
  container.className = 'splash-screen-container';
  container.id = 'splash-screen';

  container.innerHTML = `
    <div class="splash-content-wrapper">
      <!-- Unique Animated WeatherGPT Emblem -->
      <div class="splash-logo-host" id="splash-animated-logo">
        <svg viewBox="0 0 200 200" class="unique-weathergpt-logo" width="170" height="170">
          <defs>
            <!-- Gradients -->
            <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#38bdf8" />
              <stop offset="50%" stop-color="#0284c7" />
              <stop offset="100%" stop-color="#1e3a8a" />
            </linearGradient>

            <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fbbf24" />
              <stop offset="100%" stop-color="#f97316" />
            </linearGradient>

            <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ffffff" />
              <stop offset="40%" stop-color="#22d3ee" />
              <stop offset="100%" stop-color="#06b6d4" />
            </linearGradient>

            <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="boltGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <!-- Rotating Atmospheric Orbital Ring -->
          <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(56, 189, 248, 0.22)" 
                  stroke-width="1.8" stroke-dasharray="8 6" class="anim-orbit-spin" />

          <!-- Orbit Nodes -->
          <circle cx="100" cy="12" r="4.5" fill="#38bdf8" class="anim-orbit-spin" filter="url(#logoGlow)" />
          <circle cx="188" cy="100" r="3.5" fill="#fbbf24" class="anim-orbit-spin" />
          <circle cx="12" cy="100" r="3.5" fill="#34d399" class="anim-orbit-spin" />

          <!-- Radiant Sun Disc behind Cloud -->
          <circle cx="134" cy="66" r="32" fill="url(#sunGrad)" filter="url(#logoGlow)" class="anim-sun-pulse" />

          <!-- Corona Solar Rays -->
          <g stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" opacity="0.75" class="anim-sun-rays">
            <line x1="134" y1="24" x2="134" y2="16" />
            <line x1="166" y1="34" x2="172" y2="28" />
            <line x1="176" y1="66" x2="184" y2="66" />
            <line x1="166" y1="98" x2="172" y2="104" />
          </g>

          <!-- Atmospheric Storm Cloud -->
          <path d="M62 134 
                   A 26 26 0 0 1 68 84 
                   A 34 34 0 0 1 128 72 
                   A 28 28 0 0 1 156 104 
                   A 24 24 0 0 1 148 134 
                   Z" 
                fill="url(#cloudGrad)" 
                filter="url(#logoGlow)" />

          <!-- Stylized Electric Lightning Bolt -->
          <polygon points="106,86 86,124 102,124 92,156 122,114 104,114" 
                   fill="url(#boltGrad)" 
                   filter="url(#boltGlow)" 
                   class="anim-lightning-flash" />

          <!-- Falling Neon Rain Drops -->
          <line x1="68" y1="146" x2="62" y2="160" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" class="anim-raindrop-1" />
          <line x1="84" y1="148" x2="78" y2="164" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" class="anim-raindrop-2" />
          <line x1="132" y1="146" x2="126" y2="160" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" class="anim-raindrop-3" />
        </svg>
      </div>

      <!-- App Title & Tagline -->
      <div class="splash-typography">
        <h1 class="splash-brand-title">Weather<span class="gradient-text">GPT</span></h1>
        <p class="splash-tagline">AI-Powered Agro-Meteorological & Atmospheric Intelligence</p>
      </div>

      <!-- Capability Badges -->
      <div class="splash-modes-preview">
        <div class="mode-pill-badge">
          <span>🚗 Travelling Mode</span>
        </div>
        <div class="mode-pill-badge">
          <span>🌾 Farming Mode</span>
        </div>
        <div class="mode-pill-badge">
          <span>⛅ Outdoor Mode</span>
        </div>
        <div class="mode-pill-badge">
          <span>💬 Conversational AI</span>
        </div>
      </div>

      <!-- Launch Action & Auto-Timer -->
      <div class="splash-action-container">
        <button type="button" class="btn-splash-launch" id="btn-splash-launch">
          <span>Select Mode & Explore</span>
          <span class="arrow-icon">➔</span>
        </button>

        <div class="splash-timer-track">
          <div class="splash-timer-fill" id="splash-timer-fill"></div>
        </div>
        <span class="splash-skip-hint">Click anywhere or wait to enter...</span>
      </div>
    </div>
  `;

  let transitioned = false;
  function triggerContinue() {
    if (transitioned) return;
    transitioned = true;
    container.classList.add('fade-out');
    setTimeout(() => {
      if (onContinue) onContinue();
    }, 400);
  }

  const launchBtn = container.querySelector('#btn-splash-launch');
  launchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    triggerContinue();
  });

  container.addEventListener('click', () => {
    triggerContinue();
  });

  // 3-second auto-transition
  setTimeout(() => {
    triggerContinue();
  }, 3200);

  return {
    element: container,
    destroy: () => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  };
}
