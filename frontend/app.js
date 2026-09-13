/**
 * WeatherGPT Application Entry Point
 * Orchestrates Splash Screen, Mode Selection Hub,
 * Specialized Workspaces (Travelling, Farming, Outdoor),
 * and the General Conversational Cockpit.
 */

import { createSplashScreen } from './components/SplashScreen.js';
import { createModeSelection } from './components/ModeSelection.js';
import { createTravellingMode } from './components/TravellingMode.js';
import { createFarmingMode } from './components/FarmingMode.js';
import { createOutdoorMode } from './components/OutdoorMode.js';
import { createHeader } from './components/Header.js';
import { createLocationBar } from './components/LocationBar.js';
import { createWeatherWidget } from './components/WeatherWidget.js';
import { createChatView } from './components/ChatView.js';
import { createInputBar } from './components/InputBar.js';
import { createChatHistory } from './components/ChatHistory.js';
import { createToastManager } from './components/ErrorToast.js';
import { askQuestion, fetchWeather, checkBackendConnection, registerStatusListener } from './services/api.js';
import {
  initAuthSession,
  fetchSessionMessages,
  createChatSession,
  saveChatMessage
} from './services/supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
  const appRoot = document.getElementById('app');
  if (!appRoot) return;

  const toasts = createToastManager();

  // Initialize Supabase Anonymous Auth silently in background
  initAuthSession().catch(err => console.debug('Supabase anonymous auth init:', err));

  // Application State
  const state = {
    currentScreen: 'splash', // 'splash' | 'mode-selection' | 'workspace'
    activeMode: 'chat',      // 'travel' | 'farm' | 'outdoor' | 'chat'
    location: 'Warangal',
    coordinates: null,       // { latitude, longitude }
    locationSource: 'preset',
    language: 'en',
    isProcessing: false,
    weatherData: null,
    currentSessionId: null
  };

  // Restore saved theme
  const savedTheme = localStorage.getItem('weathergpt_theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  // View Containers
  let headerComponent = null;
  let activeWorkspaceEl = null;

  // 1. Initialize Header
  headerComponent = createHeader({
    currentMode: state.activeMode,
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
    onSwitchMode: (newMode) => {
      navigateToMode(newMode);
    },
    onOpenModesHub: () => {
      navigateToModesHub();
    }
  });

  registerStatusListener((status) => {
    headerComponent.setStatus(status);
  });

  // 2. Setup Splash Screen
  const splash = createSplashScreen({
    onContinue: () => {
      splash.destroy();
      navigateToModesHub();
    }
  });

  appRoot.appendChild(splash.element);

  /**
   * Navigate to Mode Selection Hub
   */
  function navigateToModesHub() {
    state.currentScreen = 'mode-selection';
    state.activeMode = 'all';
    headerComponent.setActiveMode('all');
    appRoot.innerHTML = '';
    appRoot.appendChild(headerComponent.element);

    const modeSelection = createModeSelection({
      onSelectMode: (chosenMode) => {
        navigateToMode(chosenMode);
      }
    });

    appRoot.appendChild(modeSelection.element);
  }

  /**
   * Navigate to a Specific Mode Workspace
   */
  function navigateToMode(mode) {
    state.currentScreen = 'workspace';
    state.activeMode = mode;
    headerComponent.setActiveMode(mode);

    appRoot.innerHTML = '';
    appRoot.appendChild(headerComponent.element);

    if (mode === 'travel') {
      const travelView = createTravellingMode({
        onBackToModes: () => navigateToModesHub()
      });
      activeWorkspaceEl = travelView.element;
      appRoot.appendChild(activeWorkspaceEl);
    } else if (mode === 'farm') {
      const farmView = createFarmingMode({
        onBackToModes: () => navigateToModesHub()
      });
      activeWorkspaceEl = farmView.element;
      appRoot.appendChild(activeWorkspaceEl);
    } else if (mode === 'outdoor') {
      const outdoorView = createOutdoorMode({
        onBackToModes: () => navigateToModesHub()
      });
      activeWorkspaceEl = outdoorView.element;
      appRoot.appendChild(activeWorkspaceEl);
    } else {
      // General / Chat Mode (Full dual cockpit with persistent history)
      renderChatWorkspace();
    }
  }

  /**
   * Render General Chat Cockpit Layout
   */
  function renderChatWorkspace() {
    const mainLayout = document.createElement('div');
    mainLayout.className = 'main-layout';

    // Left Sidebar: Location & Weather Telemetry + IMD Alert + Chat History
    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar-panel';
    sidebar.id = 'sidebar-panel';

    const locationBar = createLocationBar({
      initialLocation: state.location,
      initialCoords: state.coordinates,
      onLocationChange: async (locData) => {
        if (typeof locData === 'string') {
          state.location = locData;
          state.coordinates = null;
          state.locationSource = 'manual';
        } else {
          state.location = locData.name;
          state.coordinates = locData.coordinates || null;
          state.locationSource = locData.source || 'manual';
        }
        await reloadWeatherData();
      }
    });

    const weatherWidget = createWeatherWidget();

    // Right Panel: Chat Cockpit
    const chatSection = document.createElement('main');
    chatSection.className = 'chat-viewport-section';
    chatSection.id = 'chat-viewport-section';

    const chatView = createChatView({
      onSuggestionClick: (promptText) => {
        handleUserQuery(promptText);
      },
      onSwitchMode: (targetMode) => {
        navigateToMode(targetMode);
      }
    });

    // Chat History Component
    const chatHistory = createChatHistory({
      onSelectSession: async (session) => {
        state.currentSessionId = session.id;
        try {
          const messages = await fetchSessionMessages(session.id);
          chatView.loadSessionMessages(messages, state.location);
        } catch (err) {
          console.warn('Error loading session messages:', err);
        }
      },
      onNewChat: () => {
        state.currentSessionId = null;
        chatView.clearMessages();
      },
      onSessionDeleted: (deletedId) => {
        if (state.currentSessionId === deletedId) {
          state.currentSessionId = null;
          chatView.clearMessages();
        }
      },
      onRecoverySuccess: async () => {
        // After restoring history, reload sessions and activate the top session if available
        await chatHistory.loadSessions();
      },
      onToast: (msg, type) => {
        if (type === 'success') toasts.showSuccess(msg, 'Chat History');
        else toasts.showInfo(msg, 'Chat History');
      }
    });

    sidebar.appendChild(locationBar.element);
    sidebar.appendChild(weatherWidget.element);
    sidebar.appendChild(chatHistory.element);

    const inputBar = createInputBar({
      onLanguageChange: (lang) => {
        state.language = lang;
      },
      onSend: ({ question, language }) => {
        state.language = language;
        handleUserQuery(question);
      },
      onError: (msg) => {
        toasts.showWarning(msg, 'Voice Input');
      }
    });

    chatSection.appendChild(chatView.element);
    chatSection.appendChild(inputBar.element);

    mainLayout.appendChild(sidebar);
    mainLayout.appendChild(chatSection);

    activeWorkspaceEl = mainLayout;
    appRoot.appendChild(activeWorkspaceEl);

    // Load initial user chat sessions from Supabase
    chatHistory.loadSessions();

    // Auto-detect GPS if permission already granted or prompt gently
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          locationBar.detectGps();
        }
      }).catch(() => {});
    }

    // Initial weather data load
    if (state.weatherData) {
      weatherWidget.update(state.weatherData);
    } else {
      reloadWeatherData();
    }

    async function handleUserQuery(questionText) {
      if (!questionText || state.isProcessing) return;

      state.isProcessing = true;
      inputBar.setDisabled(true);

      // Collect recent conversation context before adding new question
      const recentHistory = chatView.getRecentConversationHistory ? chatView.getRecentConversationHistory(6) : [];

      // 1. Add user message to UI
      chatView.addUserMessage(questionText, state.location);

      // 2. Ensure active Supabase chat session exists
      try {
        if (!state.currentSessionId) {
          const newSession = await createChatSession(questionText);
          if (newSession && newSession.id) {
            state.currentSessionId = newSession.id;
            chatHistory.setActiveSessionId(state.currentSessionId);
            chatHistory.loadSessions(state.currentSessionId);
          }
        }

        // 3. Persist user message in Supabase
        if (state.currentSessionId) {
          await saveChatMessage({
            sessionId: state.currentSessionId,
            role: 'user',
            message: questionText,
            language: state.language
          });
        }
      } catch (dbErr) {
        console.warn('[WeatherGPT Supabase] Session/message save error:', dbErr.message);
      }

      // 4. Show loading animation
      chatView.showLoadingState();

      try {
        // 5. POST /api/ask with location and conversational context
        const result = await askQuestion({
          question: questionText,
          location: state.location,
          coordinates: state.coordinates,
          language: state.language,
          conversation_context: recentHistory
        });

        // 6. Hide loading & present localized answer with real telemetry
        chatView.hideLoadingState();
        chatView.addAssistantMessage(result.answer, result.language, result.isDemo, {
          question: questionText,
          location: state.location,
          weatherData: state.weatherData
        });

        // 7. Persist assistant response in Supabase
        if (state.currentSessionId && !result.isDemo) {
          try {
            await saveChatMessage({
              sessionId: state.currentSessionId,
              role: 'assistant',
              message: result.answer,
              language: result.language || state.language
            });
            // Refresh history order in sidebar
            chatHistory.loadSessions(state.currentSessionId);
          } catch (dbErr) {
            console.warn('[WeatherGPT Supabase] Assistant message save error:', dbErr.message);
          }
        }

        // Sync detected language from Gemini to UI state & input bar
        if (result.language && result.language !== state.language) {
          state.language = result.language;
          inputBar.setLanguage(result.language);
        }

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

    async function reloadWeatherData() {
      try {
        const data = await fetchWeather(state.location, state.coordinates);
        state.weatherData = data;
        weatherWidget.update(data);
      } catch (err) {
        console.warn('Weather telemetry update error:', err);
      }
    }
  }

  // Check Backend Connection immediately and continuously monitor health
  await checkBackendConnection();
  setInterval(checkBackendConnection, 3500);
});
