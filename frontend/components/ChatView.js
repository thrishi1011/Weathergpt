/**
 * ChatView Component
 * Manages the message stream, speech readout triggers, copy actions,
 * quick starter questions, and humanoid direct response cards with SVG charts.
 */

import { speechService } from '../services/speech.js';
import { ChartEngine } from './ChartEngine.js';

export function createChatView({ onSuggestionClick, onSwitchMode }) {
  const container = document.createElement('div');
  container.className = 'chat-messages-container';
  container.id = 'chat-messages-viewport';

  let hasMessages = false;
  let currentlyPlayingBtn = null;

  function renderEmptyState() {
    container.innerHTML = `
      <div class="empty-chat-state" id="chat-empty-state">
        <div class="empty-state-icon">⚡</div>
        <h2 class="empty-state-title">What would you like to know?</h2>
        <p class="empty-state-desc">
          Ask direct questions about rainfall, storms, or temperature. WeatherGPT provides direct humanoid answers, clear advice on what you can and cannot do, and precise charts.
        </p>

        <div class="suggestion-prompts-grid" id="suggestion-prompts">
          <button type="button" class="suggestion-pill-card" data-prompt="Will it rain today?">
            <span class="suggestion-pill-icon">🌧️</span>
            <span class="suggestion-pill-text">"Will it rain today?"</span>
          </button>
          <button type="button" class="suggestion-pill-card" data-prompt="I am a fisherman, is it safe to go out to sea today?">
            <span class="suggestion-pill-icon">🎣</span>
            <span class="suggestion-pill-text">"Is it safe for fishing / sea?"</span>
          </button>
          <button type="button" class="suggestion-pill-card" data-prompt="Can we do outdoor construction or painting work today?">
            <span class="suggestion-pill-icon">🏗️</span>
            <span class="suggestion-pill-text">"Outdoor construction / work?"</span>
          </button>
          <button type="button" class="suggestion-pill-card" data-prompt="Should I spray pesticide on my crops today?">
            <span class="suggestion-pill-icon">🌾</span>
            <span class="suggestion-pill-text">"Should I spray pesticide?"</span>
          </button>
        </div>
      </div>
    `;

    container.querySelectorAll('.suggestion-pill-card').forEach(btn => {
      btn.addEventListener('click', () => {
        if (onSuggestionClick) onSuggestionClick(btn.dataset.prompt);
      });
    });
  }

  renderEmptyState();

  function scrollToBottom() {
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }

  function clearEmptyStateIfNeeded() {
    if (!hasMessages) {
      hasMessages = true;
      container.innerHTML = '';
    }
  }

  /**
   * Add a message sent by the user
   */
  function addUserMessage(text, location = '') {
    clearEmptyStateIfNeeded();

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const row = document.createElement('div');
    row.className = 'message-row user-row';
    row.dataset.originalText = text;

    row.innerHTML = `
      <div class="message-avatar user-avatar" title="You">👤</div>
      <div class="message-bubble-wrapper">
        <div class="message-bubble user-bubble">
          ${escapeHtml(text)}
        </div>
        <div class="message-meta-row">
          <span>${escapeHtml(location ? `📍 ${location} • ` : '')}${timeString}</span>
        </div>
      </div>
    `;

    container.appendChild(row);
    scrollToBottom();
    return row;
  }

  /**
   * Add assistant response bubble with Humanoid structuring
   */
  function addAssistantMessage(answerText, language = 'en', isDemo = false, options = {}) {
    clearEmptyStateIfNeeded();

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const row = document.createElement('div');
    row.className = 'message-row assistant-row';
    row.dataset.originalText = answerText;
    row.dataset.originalLanguage = language;
    row.dataset.currentLanguage = language;
    row.dataset[`trans_${language}`] = answerText;

    // Optional telemetry snippet if real weatherData was passed in options
    const weatherData = options.weatherData;
    let telemetrySnippetHtml = '';

    if (weatherData && weatherData.temperature != null) {
      const rainProb = weatherData.rain_probability != null ? `${weatherData.rain_probability}%` : '--';
      const cond = weatherData.weather_condition || 'Moderate';
      const temp = `${weatherData.temperature.toFixed(1)}°C`;
      const loc = weatherData.location || options.location || '';

      telemetrySnippetHtml = `
        <div class="assistant-telemetry-badge">
          <span class="telemetry-pill">📍 ${escapeHtml(loc)}</span>
          <span class="telemetry-pill">🌡️ ${temp}</span>
          <span class="telemetry-pill">🌧️ ${rainProb} Rain</span>
          <span class="telemetry-pill">⛅ ${escapeHtml(cond)}</span>
        </div>
      `;
    }

    const contentHtml = `
      <div class="standard-answer-body">
        <p class="assistant-answer-text">${escapeHtml(answerText).replace(/\n/g, '<br/>')}</p>
        ${telemetrySnippetHtml}
      </div>
    `;

    row.innerHTML = `
      <div class="message-avatar assistant-avatar" title="WeatherGPT">⚡</div>
      <div class="message-bubble-wrapper">
        <div class="message-bubble assistant-bubble">
          ${contentHtml}
        </div>
        <div class="message-meta-row">
          <span>${timeString}</span>
          ${isDemo ? '<span style="color: var(--accent-amber);">• [Simulated Fallback]</span>' : ''}
          <button type="button" class="bubble-action-btn copy-btn" title="Copy answer">
            📋 Copy
          </button>
          <button type="button" class="bubble-action-btn speak-btn" title="Listen aloud">
            🔊 Listen
          </button>
        </div>
      </div>
    `;

    // Copy to clipboard listener (always copies current translated text)
    const copyBtn = row.querySelector('.copy-btn');
    copyBtn.addEventListener('click', async () => {
      try {
        const textToCopy = row.querySelector('.assistant-answer-text')?.innerText || answerText;
        await navigator.clipboard.writeText(textToCopy);
        copyBtn.textContent = '✅ Copied';
        setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 2000);
      } catch (err) {
        console.warn('Clipboard write failed:', err);
      }
    });

    // TTS Voice Playback listener (always speaks current translated text in current language)
    const speakBtn = row.querySelector('.speak-btn');
    speakBtn.addEventListener('click', () => {
      const textToSpeak = row.querySelector('.assistant-answer-text')?.innerText || answerText;
      const activeSpeakLang = row.dataset.currentLanguage || language;

      if (currentlyPlayingBtn === speakBtn) {
        speechService.stopSpeaking();
        speakBtn.classList.remove('speaking');
        speakBtn.textContent = '🔊 Listen';
        currentlyPlayingBtn = null;
        return;
      }

      if (currentlyPlayingBtn) {
        currentlyPlayingBtn.classList.remove('speaking');
        currentlyPlayingBtn.textContent = '🔊 Listen';
      }

      speakBtn.classList.add('speaking');
      speakBtn.textContent = '⏹️ Stop';
      currentlyPlayingBtn = speakBtn;

      speechService.speakText({
        text: textToSpeak,
        language: activeSpeakLang,
        onStart: () => {
          speakBtn.classList.add('speaking');
        },
        onEnd: () => {
          speakBtn.classList.remove('speaking');
          speakBtn.textContent = '🔊 Listen';
          if (currentlyPlayingBtn === speakBtn) currentlyPlayingBtn = null;
        }
      });
    });

    container.appendChild(row);
    scrollToBottom();
    return row;
  }

  const translationCache = new Map();

  /**
   * Translate every visible user question and assistant answer in the conversation to targetLang
   */
  async function translateAllVisibleMessages(targetLang, batchTranslateFunc) {
    const rows = container.querySelectorAll('.message-row');
    if (rows.length === 0) return;

    const itemsToFetch = [];
    const targetsToFetch = [];

    rows.forEach(row => {
      const isUser = row.classList.contains('user-row');
      const textEl = isUser ? row.querySelector('.user-bubble') : row.querySelector('.assistant-answer-text');
      if (!textEl) return;

      const currentText = (textEl.innerText || textEl.textContent || '').trim();
      const baseText = row.dataset.originalText || currentText;
      if (!row.dataset.originalText) {
        row.dataset.originalText = baseText;
      }

      // Check if we already have this exact target language cached on the row or global cache
      const cachedLangText = row.dataset[`trans_${targetLang}`];
      const cacheKey = `${targetLang}:${baseText}`;

      if (cachedLangText) {
        if (isUser) {
          textEl.textContent = cachedLangText;
        } else {
          textEl.innerHTML = escapeHtml(cachedLangText).replace(/\n/g, '<br/>');
        }
        row.dataset.currentLanguage = targetLang;
      } else if (translationCache.has(cacheKey)) {
        const cached = translationCache.get(cacheKey);
        row.dataset[`trans_${targetLang}`] = cached;
        if (isUser) {
          textEl.textContent = cached;
        } else {
          textEl.innerHTML = escapeHtml(cached).replace(/\n/g, '<br/>');
        }
        row.dataset.currentLanguage = targetLang;
      } else {
        // Need translation from baseText to targetLang
        itemsToFetch.push(baseText);
        targetsToFetch.push({ row, textEl, isUser, cacheKey, baseText });
      }
    });

    if (itemsToFetch.length > 0 && typeof batchTranslateFunc === 'function') {
      try {
        const translatedArray = await batchTranslateFunc(itemsToFetch, targetLang);
        targetsToFetch.forEach((target, index) => {
          const trans = translatedArray[index] || itemsToFetch[index];
          translationCache.set(target.cacheKey, trans);
          target.row.dataset[`trans_${targetLang}`] = trans;
          if (target.isUser) {
            target.textEl.textContent = trans;
          } else {
            target.textEl.innerHTML = escapeHtml(trans).replace(/\n/g, '<br/>');
          }
          target.row.dataset.currentLanguage = targetLang;
        });
      } catch (err) {
        console.warn('ChatView message translation error:', err);
      }
    }
  }

  /**
   * Update an existing user message row with translated text
   */
  function updateUserMessage(row, newText) {
    if (!row || !row.isConnected) return;
    const bubble = row.querySelector('.user-bubble');
    if (bubble) bubble.textContent = newText;
  }

  /**
   * Update an existing assistant message row with translated text
   */
  function updateAssistantMessage(row, answerText, language = 'en', isDemo = false, options = {}) {
    if (!row || !row.isConnected) return;
    const answerP = row.querySelector('.assistant-answer-text');
    if (answerP) {
      answerP.innerHTML = escapeHtml(answerText).replace(/\n/g, '<br/>');
      row.dataset.currentLanguage = language;
    }
  }

  /**
   * Show animated thinking / loading state
   */
  let typingRow = null;
  function showLoadingState() {
    clearEmptyStateIfNeeded();
    if (typingRow) return;

    typingRow = document.createElement('div');
    typingRow.className = 'typing-indicator-row';
    typingRow.id = 'chat-typing-indicator';

    typingRow.innerHTML = `
      <div class="message-avatar assistant-avatar">⚡</div>
      <div class="typing-bubble">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <span class="typing-text">WeatherGPT is evaluating radar &amp; meteorological data...</span>
      </div>
    `;

    container.appendChild(typingRow);
    scrollToBottom();
  }

  function hideLoadingState() {
    if (typingRow && typingRow.parentNode) {
      typingRow.parentNode.removeChild(typingRow);
    }
    typingRow = null;
  }

  function clearMessages() {
    hasMessages = false;
    container.innerHTML = '';
    renderEmptyState();
  }

  function loadSessionMessages(messages = [], location = '') {
    hasMessages = false;
    container.innerHTML = '';
    if (!messages || messages.length === 0) {
      renderEmptyState();
      return;
    }

    messages.forEach(msg => {
      if (msg.role === 'user') {
        addUserMessage(msg.message, location);
      } else if (msg.role === 'assistant') {
        addAssistantMessage(msg.message, msg.language || 'en', false);
      }
    });
  }

  function getRecentConversationHistory(maxTurns = 6) {
    const bubbles = container.querySelectorAll('.message-row');
    const history = [];
    bubbles.forEach(row => {
      if (row.classList.contains('user-row')) {
        const text = row.querySelector('.user-bubble')?.innerText?.trim();
        if (text) history.push({ role: 'user', content: text });
      } else if (row.classList.contains('assistant-row')) {
        const text = row.querySelector('.assistant-answer-text')?.innerText?.trim();
        if (text) history.push({ role: 'assistant', content: text });
      }
    });
    return history.slice(-maxTurns);
  }

  return {
    element: container,
    addUserMessage,
    addAssistantMessage,
    updateUserMessage,
    updateAssistantMessage,
    translateAllVisibleMessages,
    showLoadingState,
    hideLoadingState,
    clearMessages,
    loadSessionMessages,
    getRecentConversationHistory
  };
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
