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

  const PLACEHOLDERS = {
    'en': "Ask anything about the weather in English (e.g., 'Will it rain today?')",
    'te': "వాతావరణం గురించి తెలుగులో అడగండి (ఉదా: 'ఈరోజు వర్షం పడుతుందా?')",
    'hi': "मौसम के बारे में हिन्दी में पूछें (उदा: 'आज बारिश होगी क्या?')",
    'ta': "வானிலை பற்றி தமிழில் கேளுங்கள் (எ.கா: 'இன்று மழை பெய்யுமா?')",
    'kn': "ಹವಾಮಾನದ ಬಗ್ಗೆ ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿ (ಉದಾ: 'ಇಂದು ಮಳೆ ಬರುತ್ತದೆಯೇ?')"
  };

  function detectScriptLanguage(str) {
    if (/[\u0C00-\u0C7F]/.test(str)) return 'te';
    if (/[\u0900-\u097F]/.test(str)) return 'hi';
    if (/[\u0B80-\u0BFF]/.test(str)) return 'ta';
    if (/[\u0C80-\u0CFF]/.test(str)) return 'kn';
    if (/[\u0980-\u09FF]/.test(str)) return 'bn';
    if (/[\u0D00-\u0D7F]/.test(str)) return 'ml';
    return null;
  }

  function setActiveLanguage(lang) {
    selectedLanguage = lang;
    langGroup.querySelectorAll('.lang-pill-btn').forEach(b => {
      if (b.dataset.lang === lang) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
    textarea.placeholder = PLACEHOLDERS[lang] || PLACEHOLDERS['en'];
    if (onLanguageChange) onLanguageChange(selectedLanguage);
  }

  // Auto-resize textarea & detect language script
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';

    const detected = detectScriptLanguage(textarea.value);
    if (detected && detected !== selectedLanguage) {
      setActiveLanguage(detected);
    }
  });

  // Language switch
  langGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.lang-pill-btn');
    if (btn) {
      setActiveLanguage(btn.dataset.lang);
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

    // Auto-detect language from question text if native script is typed, else use active pill
    const detected = detectScriptLanguage(text);
    const finalLang = detected || selectedLanguage || 'en';
    if (detected && detected !== selectedLanguage) {
      setActiveLanguage(detected);
    }

    textarea.value = '';
    textarea.style.height = 'auto';

    if (onSend) {
      onSend({ question: text, language: finalLang });
    }
  }

  // Voice Input (Speech-to-Text)
  micBtn.addEventListener('click', async () => {
    if (isListening) {
      speechService.stopListening();
      return;
    }

    micBtn.classList.add('listening');
    voiceBar.classList.add('active');

    const started = await speechService.startListening({
      language: selectedLanguage,
      onTranscript: (transcript) => {
        textarea.value = transcript;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        const detected = detectScriptLanguage(transcript);
        if (detected && detected !== selectedLanguage) {
          setActiveLanguage(detected);
        }
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
        isListening = false;
        micBtn.classList.remove('listening');
        voiceBar.classList.remove('active');
        if (onError) onError(errMsg);
      }
    });

    if (!started) {
      isListening = false;
      micBtn.classList.remove('listening');
      voiceBar.classList.remove('active');
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
