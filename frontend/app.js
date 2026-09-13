/**
 * WeatherGPT Application Entry Point
 * Chat-only mode.
 * Travel / Farming / Outdoor modes have been removed.
 */

import { createSplashScreen } from './components/SplashScreen.js';
import { createHeader } from './components/Header.js';
import { createLocationBar } from './components/LocationBar.js';
import { createWeatherWidget } from './components/WeatherWidget.js';
import { createChatView } from './components/ChatView.js';
import { createInputBar } from './components/InputBar.js';
import { createToastManager } from './components/ErrorToast.js';
import { askQuestion, fetchWeather, checkBackendConnection, registerStatusListener, translateFreeText } from './services/api.js';
import { DEFAULT_LANGUAGE } from './utils/languages.js';
import { initI18n, setAppLanguage } from './utils/i18n.js';

document.addEventListener('DOMContentLoaded', async () => {
  const appRoot = document.getElementById('app');
  if (!appRoot) return;

  const toasts = createToastManager();

  // Restore saved language, defaulting to English
  const savedLanguage = localStorage.getItem('weathergpt_language') || DEFAULT_LANGUAGE;
  initI18n(savedLanguage);

  // Application State
  const state = {
    location: 'Warangal',
    language: savedLanguage,
    isProcessing: false,
    weatherData: null
  };

  // Restore saved theme
  const savedTheme = localStorage.getItem('weathergpt_theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  // ── 1. Header ──────────────────────────────────────────────────────────────
  const headerComponent = createHeader({
    currentLanguage: state.language,
    onThemeToggle: (theme) => {
      localStorage.setItem('weathergpt_theme', theme);
    },
    onStatusClick: async () => {
      toasts.showWarning('Pinging WeatherGPT backend service on /api/weather...', 'Health Check');
      const isOnline = await checkBackendConnection();
      if (isOnline) {
        toasts.showSuccess('Connected to live backend successfully!', 'Backend Online');
      } else {
        toasts.showWarning('Live backend is currently offline. Running in interactive demo mode.', 'Demo Mode Active');
      }
    },
    onLanguageChange: (lang) => {
      state.language = lang;
      localStorage.setItem('weathergpt_language', lang);
      setAppLanguage(lang);
      // Update the live input bar language in place
      if (inputBarRef) inputBarRef.setLanguage(lang);
      // Re-translate every earlier turn in this conversation (both the
      // user's own questions and WeatherGPT's answers) into the new language
      retranslateConversationHistory(lang);
    }
  });

  registerStatusListener((status) => {
    headerComponent.setStatus(status);
  });

  // ── 2. Splash Screen ───────────────────────────────────────────────────────
  const splash = createSplashScreen({
    onContinue: () => {
      splash.destroy();
      renderChatWorkspace();
    }
  });

  appRoot.appendChild(headerComponent.element);
  appRoot.appendChild(splash.element);

  // Track the active InputBar/ChatView so language changes update them in-place
  let inputBarRef = null;
  let chatViewRef = null;

  // Ordered record of every question/answer pair asked in this session, so a
  // language switch can re-render each turn instead of only affecting new
  // messages. `originalQuestion` is kept fixed (never overwritten) so repeated
  // language switches always translate from the source wording rather than
  // compounding translations of translations.
  let conversationHistory = [];

  /**
   * Re-render every earlier chat turn in the newly selected language.
   * Assistant answers are re-derived via the same askQuestion() pipeline
   * used for new messages (so demo mode and a live backend behave
   * identically). The user's own question bubble is best-effort translated
   * via translateFreeText(), which only actually changes wording when a
   * live backend/LLM is reachable — otherwise it safely leaves the original
   * text as-is rather than guessing.
   */
  async function retranslateConversationHistory(lang) {
    if (!chatViewRef || conversationHistory.length === 0) return;

    await Promise.all(conversationHistory.map(async (entry) => {
      const [translatedQuestion, result] = await Promise.all([
        translateFreeText(entry.originalQuestion, lang),
        askQuestion({ question: entry.originalQuestion, location: entry.location, language: lang })
      ]);

      chatViewRef.updateUserMessage(entry.userRow, translatedQuestion);
      chatViewRef.updateAssistantMessage(entry.assistantRow, result.answer, result.language, result.isDemo, {
        question: entry.originalQuestion,
        location: entry.location
      });
    }));
  }

  // ── 3. Chat Workspace ──────────────────────────────────────────────────────
  function renderChatWorkspace() {
    // Clear everything except header
    appRoot.innerHTML = '';
    appRoot.appendChild(headerComponent.element);

    // Fresh conversation each time the chat workspace is (re)built
    conversationHistory = [];

    const mainLayout = document.createElement('div');
    mainLayout.className = 'main-layout';

    // ── Sidebar: Location + Weather ────────────────────────────────────────
    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar-panel';
    sidebar.id = 'sidebar-panel';

    const locationBar = createLocationBar({
      initialLocation: state.location,
      onLocationChange: async (newLocation) => {
        state.location = newLocation;
        await reloadWeatherData();
      }
    });

    const weatherWidget = createWeatherWidget();

    sidebar.appendChild(locationBar.element);
    sidebar.appendChild(weatherWidget.element);

    // ── Right Panel: Chat Cockpit ────────────────────────────────────────
    const chatSection = document.createElement('main');
    chatSection.className = 'chat-viewport-section';
    chatSection.id = 'chat-viewport-section';

    const chatView = createChatView({
      onSuggestionClick: (promptText) => {
        handleUserQuery(promptText);
      }
    });

    chatViewRef = chatView;

    const inputBar = createInputBar({
      language: state.language,
      onSend: ({ question }) => {
        handleUserQuery(question);
      },
      onError: (msg) => {
        toasts.showWarning(msg, 'Voice Input');
      }
    });

    inputBarRef = inputBar;

    chatSection.appendChild(chatView.element);
    chatSection.appendChild(inputBar.element);

    mainLayout.appendChild(sidebar);
    mainLayout.appendChild(chatSection);
    appRoot.appendChild(mainLayout);

    // Initial weather data load
    if (state.weatherData) {
      weatherWidget.update(state.weatherData);
    } else {
      reloadWeatherData();
    }

    // ── Query Handler ────────────────────────────────────────────────────
    async function handleUserQuery(questionText) {
      if (!questionText || state.isProcessing) return;

      state.isProcessing = true;
      inputBar.setDisabled(true);

      // 1. Add user message to chat
      const userRow = chatView.addUserMessage(questionText, state.location);

      // 2. Show loading animation
      chatView.showLoadingState();

      try {
        const result = await askQuestion({
          question: questionText,
          location: state.location,
          language: state.language
        });

        chatView.hideLoadingState();
        const assistantRow = chatView.addAssistantMessage(result.answer, result.language, result.isDemo, {
          question: questionText,
          location: state.location
        });

        // Remember this turn so a future language switch can re-render it
        conversationHistory.push({
          originalQuestion: questionText,
          location: state.location,
          userRow,
          assistantRow
        });

        if (result.isDemo && !sessionStorage.getItem('demo_notified')) {
          toasts.showWarning('Backend not detected on :8000. Displaying simulated response adhering to api-contract.', 'Demo Mode Active');
          sessionStorage.setItem('demo_notified', 'true');
        }
      } catch (err) {
        chatView.hideLoadingState();
        toasts.showError(err.message || 'Failed to receive response from WeatherGPT.', 'Query Error');
        chatView.addAssistantMessage(
          'Sorry, I encountered an issue while communicating with the weather services. Please check your network or try again.',
          state.language,
          false
        );
      } finally {
        state.isProcessing = false;
        inputBar.setDisabled(false);
      }
    }

    // ── Weather Reload ───────────────────────────────────────────────────
    async function reloadWeatherData() {
      try {
        const data = await fetchWeather(state.location);
        state.weatherData = data;
        weatherWidget.update(data);
      } catch (err) {
        console.warn('Weather telemetry update error:', err);
      }
    }
  }

  // Check Backend Connection in background
  await checkBackendConnection();
});
