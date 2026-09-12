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

        <!-- Mode Quick Nav Pills -->
        <div class="empty-modes-nav">
          <span class="nav-label">Switch to specialized mode:</span>
          <div class="empty-modes-row">
            <button type="button" class="empty-mode-btn" data-target="travel">🚗 Travelling Mode</button>
            <button type="button" class="empty-mode-btn" data-target="farm">🌾 Farming Mode</button>
            <button type="button" class="empty-mode-btn" data-target="outdoor">⛅ Outdoor Mode</button>
          </div>
        </div>

        <div class="suggestion-prompts-grid" id="suggestion-prompts">
          <button type="button" class="suggestion-pill-card" data-prompt="Will it rain today?">
            <span class="suggestion-pill-icon">🌧️</span>
            <span class="suggestion-pill-text">"Will it rain today?"</span>
          </button>
          <button type="button" class="suggestion-pill-card" data-prompt="Will it rain tomorrow?">
            <span class="suggestion-pill-icon">🌦️</span>
            <span class="suggestion-pill-text">"Will it rain tomorrow?"</span>
          </button>
          <button type="button" class="suggestion-pill-card" data-prompt="Should I spray pesticide today?">
            <span class="suggestion-pill-icon">🌾</span>
            <span class="suggestion-pill-text">"Should I spray pesticide today?"</span>
          </button>
          <button type="button" class="suggestion-pill-card" data-prompt="Show me the 24-hour temperature and rain graph.">
            <span class="suggestion-pill-icon">📊</span>
            <span class="suggestion-pill-text">"Show 24-hour rain graph"</span>
          </button>
        </div>
      </div>
    `;

    container.querySelectorAll('.suggestion-pill-card').forEach(btn => {
      btn.addEventListener('click', () => {
        if (onSuggestionClick) onSuggestionClick(btn.dataset.prompt);
      });
    });

    container.querySelectorAll('.empty-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (onSwitchMode) onSwitchMode(btn.dataset.target);
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
  }

  /**
   * Add assistant response bubble with Humanoid structuring
   */
  function addAssistantMessage(answerText, language = 'en', isDemo = false, options = {}) {
    clearEmptyStateIfNeeded();

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const row = document.createElement('div');
    row.className = 'message-row assistant-row';

    // Real answer text from LLM pipeline
    const speechPlainText = answerText;

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

    // Copy to clipboard listener
    const copyBtn = row.querySelector('.copy-btn');
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(speechPlainText);
        copyBtn.textContent = '✅ Copied';
        setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 2000);
      } catch (err) {
        console.warn('Clipboard write failed:', err);
      }
    });

    // TTS Voice Playback listener
    const speakBtn = row.querySelector('.speak-btn');
    speakBtn.addEventListener('click', () => {
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
        text: speechPlainText,
        language: language,
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
        <span class="typing-text">WeatherGPT is evaluating radar & meteorological data...</span>
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

  return {
    element: container,
    addUserMessage,
    addAssistantMessage,
    showLoadingState,
    hideLoadingState
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
