/**
 * InputBar Component
 * Clean input bar: textarea + mic button + send button.
 * Language is auto-detected from voice input or typed script — no manual pills.
 */

import { speechService, detectScriptLanguage } from '../services/speech.js';

export function createInputBar({ onSend, onLanguageChange, onError }) {
  const container = document.createElement('div');
  container.className = 'chat-controls-wrapper';
  container.id = 'chat-controls-area';

  // Default language is English; auto-switches when mic detects Indic script
  let selectedLanguage = 'en';
  let isListening = false;

  container.innerHTML = `
    <!-- Voice Status Banner (hidden when inactive) -->
    <div class="voice-status-bar" id="voice-status-bar">
      <span id="voice-status-text">🎙️ Listening… speak in any language</span>
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
        placeholder="Ask anything about weather… or press 🎤 to speak"
        aria-label="Ask weather question"
      ></textarea>

      <div class="input-action-buttons">
        <button
          type="button"
          id="btn-voice-input"
          class="mic-toggle-btn"
          title="Voice input — speak in any language"
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
      <span class="lang-indicator" id="lang-indicator" title="Detected language">🌐 English</span>
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

  /** Language display names */
  const LANG_NAMES = {
    en: 'English', hi: 'हिन्दी', te: 'తెలుగు', ta: 'தமிழ்',
    kn: 'ಕನ್ನಡ', ml: 'മലയാളം', bn: 'বাংলা', mr: 'मराठी',
    gu: 'ગુજરાતી', pa: 'ਪੰਜਾਬੀ', or: 'ଓଡ଼ିଆ', ur: 'اردو',
  };

  function setLanguage(lang) {
    if (!lang || lang === selectedLanguage) return;
    selectedLanguage = lang;
    langBadge.textContent = '🌐 ' + (LANG_NAMES[lang] || lang.toUpperCase());
    if (onLanguageChange) onLanguageChange(lang);
  }

  // Auto-resize textarea and detect language from typed script
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    const detected = detectScriptLanguage(textarea.value);
    if (detected) setLanguage(detected);
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
  // Voice Input
  // ──────────────────────────────────────────────────────────────────────
  micBtn.addEventListener('click', async () => {
    // If already listening → stop
    if (isListening) {
      speechService.stopListening();
      resetVoiceUI();
      return;
    }

    // Activate mic UI immediately so user gets feedback
    isListening = true;
    micBtn.classList.add('listening');
    voiceBar.classList.add('active');
    voiceText.textContent = '🎙️ Listening… speak in any language';
    voiceWave.style.display = '';

    const started = await speechService.startListening({

      onTranscript: (transcript) => {
        // Live-stream transcript into textarea as user speaks
        textarea.value = transcript;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
      },

      onLanguageDetect: (lang) => {
        // Update language silently as voice reveals the script
        setLanguage(lang);
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
        // Auto-type the final captured text
        textarea.value = finalTranscript;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        textarea.focus();
        try { textarea.setSelectionRange(finalTranscript.length, finalTranscript.length); } catch (_) {}

        // Update language from detected script
        if (detectedLang) setLanguage(detectedLang);

        // Show "ready to send" state
        micBtn.classList.remove('listening');
        voiceBar.classList.add('ready');
        voiceBar.classList.remove('active');
        voiceWave.style.display = 'none';
        voiceText.textContent = '✅ Voice captured — press Enter or ➤ to send';

        // Auto-hide banner after 5 seconds
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
    voiceText.textContent = '🎙️ Listening… speak in any language';
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
