/**
 * Cloud TTS Engine
 * Proxies neural speech requests via the local high-fidelity TTS backend.
 */

let activeAudio = null;

export async function speakCloudTTS(text, langCode = 'te-IN', options = {}) {
  stopCloudTTS();

  if (!text || !text.trim()) {
    return;
  }

  const cleanText = text.trim();
  const proxyUrl = `http://localhost:5050/api/tts?text=${encodeURIComponent(cleanText)}&language=${encodeURIComponent(langCode)}`;

  return new Promise((resolve, reject) => {
    const audio = new Audio(proxyUrl);
    activeAudio = audio;

    audio.onplay = () => {
      if (options.onStart) options.onStart();
    };

    audio.onended = () => {
      activeAudio = null;
      if (options.onEnd) options.onEnd();
      resolve();
    };

    audio.onerror = (e) => {
      activeAudio = null;
      const err = new Error('Cloud TTS playback failed. Please ensure the proxy service is running.');
      if (options.onError) options.onError(err);
      reject(err);
    };

    audio.play().catch((playbackErr) => {
      activeAudio = null;
      if (options.onError) options.onError(playbackErr);
      reject(playbackErr);
    });
  });
}

export function stopCloudTTS() {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch (_) {}
    activeAudio = null;
  }
}

