import React, { useState, useEffect, useRef } from 'react';
import { speechToText } from '../stt/speechToText.js';
import { speak, stopSpeech } from '../tts/ttsRouter.js';
import { askBackend } from '../mock/mockAsk.js';
import { SUPPORTED_LANGUAGES, isSTTSupported, getBrowserCompatibilityNotice } from '../utils/languageSupport.js';
import './VoiceControls.css';

/**
 * VoiceControls Component
 * Provides complete spoken interface UI for WeatherGPT.
 * Supports:
 * - English (India) - en-IN
 * - Hindi - hi-IN
 * - Telugu - te-IN
 */
export default function VoiceControls({ location = 'Warangal', onAskComplete }) {
  const [selectedLang, setSelectedLang] = useState('auto');
  const [detectedLang, setDetectedLang] = useState(null);
  const [voiceState, setVoiceState] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'speaking'
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [answer, setAnswer] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTTSTier, setActiveTTSTier] = useState(null); // 'native' | 'edge' | 'cloud'
  const [compatNotice, setCompatNotice] = useState(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    if (selectedLang !== 'auto') {
      setCompatNotice(getBrowserCompatibilityNotice(selectedLang));
    } else {
      setCompatNotice(null);
    }

    return () => {
      isMountedRef.current = false;
      speechToText.abort();
      stopSpeech();
    };
  }, [selectedLang]);

  // Handle language switch
  const handleLangSelect = (langCode) => {
    if (voiceState === 'listening') {
      speechToText.stopListening();
    }
    if (voiceState === 'speaking') {
      stopSpeech();
    }
    setSelectedLang(langCode);
    setDetectedLang(null);
    setVoiceState('idle');
    setErrorMsg('');
  };

  // Trigger conversational STT -> Backend -> TTS loop
  const handleToggleListening = () => {
    setErrorMsg('');

    if (voiceState === 'speaking') {
      stopSpeech();
      setVoiceState('idle');
      return;
    }

    if (voiceState === 'listening') {
      speechToText.stopListening();
      setVoiceState('idle');
      return;
    }

    if (!isSTTSupported()) {
      setErrorMsg('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    setTranscript('');
    setInterimTranscript('');
    setAnswer('');
    setDetectedLang(null);
    setVoiceState('listening');

    speechToText.startListening({
      language: selectedLang === 'auto' ? 'en-IN' : selectedLang,
      onStart: () => {
        if (isMountedRef.current) setVoiceState('listening');
      },
      onInterim: (interim) => {
        if (isMountedRef.current) setInterimTranscript(interim);
      },
      onResult: async (finalText) => {
        if (!isMountedRef.current) return;
        setTranscript(finalText);
        setInterimTranscript('');
        setVoiceState('processing');

        try {
          // Send transcribed question to askBackend (mock or live)
          const response = await askBackend(finalText, location, selectedLang);
          if (!isMountedRef.current) return;

          const replyLang = response.language || (selectedLang === 'auto' ? 'te-IN' : selectedLang);
          setDetectedLang(replyLang);
          setAnswer(response.answer);
          if (onAskComplete) onAskComplete(response);

          // Speak back response in the exact detected language via TTS
          setVoiceState('speaking');
          await speak(response.answer, replyLang, {
          await speak(response.answer, selectedLang, {
>>>>>>> e28a13939c820df01a16e9f97bd1103f4984bd4a
            onTierSelect: (tier) => {
              if (isMountedRef.current) setActiveTTSTier(tier);
            },
            onEnd: () => {
              if (isMountedRef.current) setVoiceState('idle');
            },
            onError: (ttsErr) => {
              console.warn('[VoiceControls] TTS playback error:', ttsErr);
              if (isMountedRef.current) {
                setVoiceState('idle');
                setErrorMsg(ttsErr.message || "Couldn't generate speech right now");
              }
            }
          });
        } catch (err) {
          console.error('[VoiceControls] Backend / ask error:', err);
          if (isMountedRef.current) {
            setVoiceState('idle');
            setErrorMsg(err.message || 'Failed to get answer from WeatherGPT.');
          }
        }
      },
      onError: (err) => {
        if (!isMountedRef.current) return;
        setVoiceState('idle');
        setErrorMsg(err.message);
      },
      onEnd: () => {
        if (isMountedRef.current && voiceState === 'listening') {
          setVoiceState('idle');
        }
      }
    });
  };

  const handleStopSpeaking = () => {
    stopSpeech();
    setVoiceState('idle');
  };

  return (
    <div className="weathergpt-voice-container">
      {/* Header with Language Selector */}
      <div className="voice-header">
        <div className="voice-title">
          <span>🎙️</span> WeatherGPT Voice
        </div>
        <div className="voice-lang-selector">
          {Object.values(SUPPORTED_LANGUAGES).map((lang) => (
            <button
              key={lang.code}
              className={`lang-btn ${selectedLang === lang.code ? 'active' : ''}`}
              onClick={() => handleLangSelect(lang.code)}
              type="button"
            >
              {lang.nativeLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Status Badge */}
      <div className={`voice-status-badge ${voiceState}`}>
        <span className="status-dot"></span>
        {voiceState === 'idle' && 'Ready to Listen'}
        {voiceState === 'listening' && 'Listening... Speak now'}
        {voiceState === 'processing' && 'Thinking...'}
        {voiceState === 'speaking' && (
          <>
            Speaking {activeTTSTier ? `(${activeTTSTier === 'edge' ? 'Edge Neural' : activeTTSTier === 'cloud' ? 'Cloud Telugu TTS' : 'Native'})` : ''}
          </>
        )}
      </div>

      {/* Main Microphone Button */}
      <div className="voice-action-center">
        <div className="mic-button-wrapper">
          {voiceState === 'listening' && <div className="mic-pulse-wave"></div>}
          <button
            className={`mic-btn ${voiceState}`}
            onClick={handleToggleListening}
            aria-label={voiceState === 'listening' ? 'Stop listening' : 'Start speaking'}
            type="button"
          >
            {voiceState === 'listening' && (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            )}
            {voiceState === 'speaking' && (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zm-2.5 9.77l-4.5-4.5H3v6h4l4.5 4.5v-6z" />
              </svg>
            )}
            {(voiceState === 'idle' || voiceState === 'processing') && (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
              </svg>
            )}
          </button>
        </div>
        <div className="mic-caption">
          {voiceState === 'idle' && 'Click the microphone and ask a weather question'}
          {voiceState === 'listening' && 'Listening to your question...'}
          {voiceState === 'processing' && 'Analyzing forecast...'}
          {voiceState === 'speaking' && 'Speaking answer...'}
        </div>
      </div>

      {/* Visualizer during speaking */}
      {voiceState === 'speaking' && (
        <div className="voice-visualizer">
          <span className="visualizer-bar"></span>
          <span className="visualizer-bar"></span>
          <span className="visualizer-bar"></span>
          <span className="visualizer-bar"></span>
          <span className="visualizer-bar"></span>
        </div>
      )}

      {/* Question & Answer Display */}
      {(transcript || interimTranscript || answer) && (
        <div className="voice-content-box">
          {(transcript || interimTranscript) && (
            <div className="voice-turn">
              <div className="turn-label">Your Question:</div>
              <div className={`turn-text ${!transcript && interimTranscript ? 'interim' : ''}`}>
                {transcript || interimTranscript}
              </div>
            </div>
          )}

          {answer && (
            <div className="voice-turn">
              <div className="turn-label">
                <span>WeatherGPT {detectedLang && SUPPORTED_LANGUAGES[detectedLang] ? `(${SUPPORTED_LANGUAGES[detectedLang].nativeLabel})` : ''}:</span>
                {voiceState === 'speaking' && (
                  <button className="stop-btn" onClick={handleStopSpeaking} type="button">
                    Stop Audio
                  </button>
                )}
              </div>
              <div className="turn-text">{answer}</div>
            </div>
          )}
        </div>
      )}

      {/* Browser Compatibility Notice */}
      {compatNotice && !errorMsg && (
        <div className="voice-notice">
          ℹ️ {compatNotice}
        </div>
      )}

      {/* Error Alert Display */}
      {errorMsg && (
        <div className="voice-alert">
          <span>⚠️</span>
          <div>{errorMsg}</div>
        </div>
      )}
    </div>
  );
}
