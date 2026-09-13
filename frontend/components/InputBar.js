/**
 * InputBar Component
 * Question input, voice STT hooks, and send button.
 *
 * NOTE: Language selection used to live here as its own set of pills,
 * duplicated per mode. It has been replaced by a single global language
 * section in the Header - this component now just receives the currently
 * selected language (via the `language` option / `setLanguage()`) and uses
 * it for speech recognition and for tagging outgoing questions.
 */

import { speechService } from '../services/speech.js';
import { DEFAULT_LANGUAGE } from '../utils/languages.js';

export function createInputBar({ onSend, onError, language = DEFAULT_LANGUAGE }) {
  const container = document.createElement('div');
  container.className = 'chat-controls-wrapper';
  container.id = 'chat-controls-area';

  let selectedLanguage = language;
  let isListening = false;

  container.innerHTML = `
    <!-- Top Row: Keyboard Hints -->
    <div class="controls-top-row">
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
          <svg class="mic-icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M12 15a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 0 0-7 0v5.5A3.5 3.5 0 0 0 12 15Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6.5 10.5v1a5.5 5.5 0 0 0 11 0v-1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 19.5v2.25M9 21.75h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
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

  // Auto-resize textarea
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
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
    // Called by app.js when the global language section (in the Header)
    // changes, so this input bar - and any voice input it triggers - stays
    // in sync without needing its own language controls.
    setLanguage: (lang) => {
      selectedLanguage = lang;
    },
    setDisabled: (disabled) => {
      textarea.disabled = disabled;
      sendBtn.disabled = disabled;
    }
  };
}
