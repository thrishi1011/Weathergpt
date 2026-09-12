/**
 * InputBar Component
 * Clean input bar: textarea + mic button + send button.
 * Language is auto-detected from voice input or typed script — no manual pills.
 * Clicking the mic button immediately focuses the text bar, listens, and auto-types.
 */

import { speechService, detectScriptLanguage } from '../services/speech.js';

export function createInputBar({ onSend, onLanguageChange, onError }) {
  const container = document.createElement('div');
  container.className = 'chat-controls-wrapper';
  container.id = 'chat-controls-area';

  // Default language is English; auto-switches when mic or typing detects Indic script
  let selectedLanguage = 'en';
  let isListening = false;

  const PLACEHOLDERS = {
    en: 'Ask anything about weather… or press 🎤 to speak',
    te: 'వాతావరణం గురించి ఏదైనా అడగండి… లేదా మాట్లాడటానికి 🎤 నొక్కండి',
    hi: 'मौसम के बारे में कुछ भी पूछें… या बोलने के लिए 🎤 दबाएं',
  };

  const LANG_NAMES = {
    en: 'English',
    hi: 'हिन्दी',
    te: 'తెలుగు',
    ta: 'தமிழ்',
    kn: 'ಕನ್ನಡ',
    ml: 'മലയാളം',
    bn: 'বাংলা',
    mr: 'मराठी',
    gu: 'ગુજરાતી',
    pa: 'ਪੰਜਾਬੀ',
    or: 'ଓଡ଼ିଆ',
    ur: 'اردو',
  };

  container.innerHTML = `
    <!-- Voice Status Banner (hidden when inactive) -->
    <div class="voice-status-bar" id="voice-status-bar">
      <span id="voice-status-text">🎙️ Listening… speak now</span>
      <div class="voice-wave-indicator" id="voice-wave">
        <div class="wave-bar"></div>
        <div class="wave-bar"></div>
        <div class="wave-bar"></div>
        <div class="wave-bar"></div>
      </div>
    </div>

    <!-- Main Input Form -->
    <form class="input-form-container" id="chat-input-form">
      <textarea
        id="question-input"
        class="question-textarea"
        rows="1"
        placeholder="${PLACEHOLDERS.en}"
        aria-label="Ask weather question"
      ></textarea>

      <div class="input-action-buttons">
        <button
          type="button"
          id="btn-voice-input"
          class="mic-toggle-btn"
          title="Voice input — press to speak"
          aria-label="Voice input"
        >
          🎤
        </button>

        <button
          type="submit"
          id="btn-send-query"
          class="send-query-btn"
          title="Send"
          aria-label="Send query"
        >
          ➤
        </button>
      </div>
    </form>

    <!-- Keyboard hint row -->
    <div class="controls-hint-row">
      <span class="input-hint-text">Press <strong>Enter</strong> to send • <strong>Shift+Enter</strong> for newline</span>
      <span class="lang-indicator clickable-lang" id="lang-indicator" title="Click to switch language (English / తెలుగు / हिन्दी)">🌐 English ▾</span>
    </div>
  `;

  const form       = container.querySelector('#chat-input-form');
  const textarea   = container.querySelector('#question-input');
  const sendBtn    = container.querySelector('#btn-send-query');
  const micBtn     = container.querySelector('#btn-voice-input');
  const voiceBar   = container.querySelector('#voice-status-bar');
  const voiceText  = container.querySelector('#voice-status-text');
  const voiceWave  = container.querySelector('#voice-wave');
  const langBadge  = container.querySelector('#lang-indicator');

  function setLanguage(lang) {
    if (!lang) return;
    selectedLanguage = lang;
    const name = LANG_NAMES[lang] || lang.toUpperCase();
    langBadge.textContent = `🌐 ${name} ▾`;
    if (PLACEHOLDERS[lang]) {
      textarea.placeholder = PLACEHOLDERS[lang];
    }
    if (onLanguageChange) onLanguageChange(lang);
  }

  // Click on language badge toggles between English, Telugu, and Hindi
  const LANG_CYCLE = ['en', 'te', 'hi'];
  langBadge.style.cursor = 'pointer';
  langBadge.addEventListener('click', () => {
    const currentIndex = LANG_CYCLE.indexOf(selectedLanguage);
    const nextLang = LANG_CYCLE[(currentIndex + 1) % LANG_CYCLE.length];
    setLanguage(nextLang);
    speechService.setLanguage(nextLang);
  });

  // Auto-resize textarea and detect language from typed script
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    const detected = detectScriptLanguage(textarea.value);
    if (detected && detected !== selectedLanguage) {
      setLanguage(detected);
    }
  });

  // Enter to submit (Shift+Enter = newline)
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitQuery();
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitQuery();
  });

  function submitQuery() {
    const text = textarea.value.trim();
    if (!text) return;

    if (isListening) speechService.stopListening();

    // Final language check from typed content
    const detected = detectScriptLanguage(text);
    if (detected) setLanguage(detected);

    const langToSend = selectedLanguage || 'en';

    textarea.value = '';
    textarea.style.height = 'auto';

    if (onSend) onSend({ question: text, language: langToSend });
  }

  // ──────────────────────────────────────────────────────────────────────
  // Voice Input: Single click on mic immediately listens and auto-types
  // ──────────────────────────────────────────────────────────────────────
  micBtn.addEventListener('click', () => {
    // If already listening → stop
    if (isListening) {
      speechService.stopListening();
      resetVoiceUI();
      return;
    }

    // 1. Immediately focus the textarea so cursor is active (user does NOT need to click text bar)
    textarea.focus();

    // 2. Activate mic UI immediately
    isListening = true;
    micBtn.classList.add('listening');
    voiceBar.classList.add('active');
    voiceBar.classList.remove('ready');
    voiceText.textContent = `🎙️ Listening (${LANG_NAMES[selectedLanguage] || 'Any language'})… speak now`;
    voiceWave.style.display = '';

    // 3. Start listening with current language setting
    const started = speechService.startListening({
      language: selectedLanguage,

      onTranscript: (transcript) => {
        // Auto-type live transcript into textarea as user speaks
        textarea.value = transcript;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        try {
          textarea.setSelectionRange(transcript.length, transcript.length);
        } catch (_) {}
      },

      onLanguageDetect: (lang) => {
        // Auto-detect language from speech and update UI
        setLanguage(lang);
        voiceText.textContent = `🎙️ Listening (${LANG_NAMES[lang] || lang})… speak now`;
      },

      onListeningChange: (listening) => {
        isListening = listening;
        if (listening) {
          micBtn.classList.add('listening');
          voiceBar.classList.add('active');
        } else {
          micBtn.classList.remove('listening');
        }
      },

      onPauseComplete: (finalTranscript, detectedLang) => {
        // Finalize transcript in textarea
        textarea.value = finalTranscript;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        textarea.focus();
        try {
          textarea.setSelectionRange(finalTranscript.length, finalTranscript.length);
        } catch (_) {}

        if (detectedLang) setLanguage(detectedLang);

        // Show ready state
        micBtn.classList.remove('listening');
        voiceBar.classList.add('ready');
        voiceBar.classList.remove('active');
        voiceWave.style.display = 'none';
        voiceText.textContent = '✅ Voice captured — press Enter or ➤ to send';

        setTimeout(() => {
          resetVoiceUI();
        }, 5000);
      },

      onError: (errMsg) => {
        resetVoiceUI();
        if (onError) onError(errMsg);
      },
    });

    if (!started) {
      resetVoiceUI();
    }
  });

  function resetVoiceUI() {
    isListening = false;
    micBtn.classList.remove('listening');
    voiceBar.classList.remove('active', 'ready');
    voiceText.textContent = '🎙️ Listening… speak now';
    voiceWave.style.display = '';
  }

  // ──────────────────────────────────────────────────────────────────────
  return {
    element: container,
    setInputValue: (val) => { textarea.value = val; textarea.focus(); },
    getLanguage: () => selectedLanguage,
    setLanguage,
    setDisabled: (disabled) => {
      textarea.disabled = disabled;
      sendBtn.disabled  = disabled;
    },
  };
}
