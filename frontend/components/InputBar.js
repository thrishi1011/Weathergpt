/**
 * InputBar Component
 * Question input, language selection pills, voice STT hooks, and send button
 */

import { speechService } from '../services/speech.js';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'kn', label: 'ಕನ್ನಡ' }
];

export function createInputBar({ onSend, onLanguageChange, onError }) {
  const container = document.createElement('div');
  container.className = 'chat-controls-wrapper';
  container.id = 'chat-controls-area';

  let selectedLanguage = 'en';
  let isListening = false;

  container.innerHTML = `
    <!-- Top Row: Language Pills & Keyboard Hints -->
    <div class="controls-top-row">
      <div class="language-selector-group" id="language-selector-group">
        <span class="language-label">Language:</span>
        ${LANGUAGES.map(lang => `
          <button 
            type="button" 
            class="lang-pill-btn ${lang.code === selectedLanguage ? 'active' : ''}" 
            data-lang="${lang.code}"
            id="lang-pill-${lang.code}"
          >
            ${lang.label}
          </button>
        `).join('')}
      </div>

      <div class="input-hint-text">
        Press <strong>Enter</strong> to send • <strong>Shift+Enter</strong> for newline
      </div>
    </div>

    <!-- Active Voice Banner -->
    <div class="voice-status-bar" id="voice-status-bar">
      <span>🎙️ Listening... Speak your weather question</span>
      <div class="voice-wave-indicator">
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
        placeholder="Ask anything about the weather (e.g., 'Will it rain tomorrow?')"
        aria-label="Ask weather question"
      ></textarea>

      <div class="input-action-buttons">
        <button 
          type="button" 
          id="btn-voice-input" 
          class="mic-toggle-btn" 
          title="Voice input (Speech to text)"
          aria-label="Voice input"
        >
          🎤
        </button>

        <button 
          type="submit" 
          id="btn-send-query" 
          class="send-query-btn" 
          title="Send query"
          aria-label="Send query"
        >
          ➤
        </button>
      </div>
    </form>
  `;

  const form = container.querySelector('#chat-input-form');
  const textarea = container.querySelector('#question-input');
  const sendBtn = container.querySelector('#btn-send-query');
  const micBtn = container.querySelector('#btn-voice-input');
  const voiceBar = container.querySelector('#voice-status-bar');
  const langGroup = container.querySelector('#language-selector-group');

  // Auto-resize textarea
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  });

  // Language switch
  langGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.lang-pill-btn');
    if (btn) {
      langGroup.querySelectorAll('.lang-pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedLanguage = btn.dataset.lang;
      if (onLanguageChange) onLanguageChange(selectedLanguage);
    }
  });

  // Keyboard Enter to submit
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitQuery();
    }
  });

  // Form submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitQuery();
  });

  function submitQuery() {
    const text = textarea.value.trim();
    if (!text) return;

    if (isListening) {
      speechService.stopListening();
    }

    textarea.value = '';
    textarea.style.height = 'auto';

    if (onSend) {
      onSend({ question: text, language: selectedLanguage });
    }
  }

  // Voice Input (Speech-to-Text)
  micBtn.addEventListener('click', () => {
    if (isListening) {
      speechService.stopListening();
      return;
    }

    const started = speechService.startListening({
      language: selectedLanguage,
      onTranscript: (transcript) => {
        textarea.value = transcript;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
      },
      onListeningChange: (listening) => {
        isListening = listening;
        if (listening) {
          micBtn.classList.add('listening');
          voiceBar.classList.add('active');
        } else {
          micBtn.classList.remove('listening');
          voiceBar.classList.remove('active');
        }
      },
      onError: (errMsg) => {
        if (onError) onError(errMsg);
      }
    });

    if (!started && !speechService.isSttSupported()) {
      if (onError) onError('Speech Recognition is not available in your browser.');
    }
  });

  return {
    element: container,
    setInputValue: (val) => {
      textarea.value = val;
      textarea.focus();
    },
    getLanguage: () => selectedLanguage,
    setLanguage: (lang) => {
      selectedLanguage = lang;
      const btn = langGroup.querySelector(`[data-lang="${lang}"]`);
      if (btn) {
        langGroup.querySelectorAll('.lang-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
    },
    setDisabled: (disabled) => {
      textarea.disabled = disabled;
      sendBtn.disabled = disabled;
    }
  };
}
