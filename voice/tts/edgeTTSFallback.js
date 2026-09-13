/**
 * Edge TTS Proxy Fallback Client (TTS Tier 2)
 * Fetches neural speech audio from the local Edge TTS proxy server and plays it back.
 */

const DEFAULT_PROXY_URL = 'http://localhost:5050/api/tts';

let currentAudio = null;

/**
 * Checks if the Edge TTS Proxy server is running and responsive.
 * @param {string} [baseUrl='http://localhost:5050']
 * @returns {Promise<boolean>}
 */
export async function isEdgeProxyAvailable(baseUrl = 'http://localhost:5050') {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return data.status === 'ok';
    }
    return false;
  } catch (err) {
    return false;
  }
}

/**
 * Synthesizes and plays speech via the local Edge TTS Proxy.
 *
 * @param {string} text - Text to speak
 * @param {string} langCode - 'en-IN', 'hi-IN', 'te-IN'
 * @param {Object} [options]
 * @param {string} [options.proxyUrl] - Custom proxy URL
 * @param {Function} [options.onStart] - Callback when audio playback starts
 * @param {Function} [options.onEnd] - Callback when audio playback finishes
 * @param {Function} [options.onError] - Callback on error
 * @returns {Promise<void>}
 */
export async function speakEdgeTTS(text, langCode = 'en-IN', options = {}) {
  const proxyUrl = options.proxyUrl || DEFAULT_PROXY_URL;

  // Stop any active playback
  stopEdgeTTS();

  let response;
  try {
    response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        language: langCode
      })
    });
  } catch (networkErr) {
    const friendlyError = new Error('Edge TTS proxy server is unreachable. Please ensure "npm start" is running in the voice/ directory.');
    friendlyError.originalError = networkErr;
    if (options.onError) options.onError(friendlyError);
    throw friendlyError;
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.details || errJson.error || response.statusText;
    } catch (_) {
      errorDetail = response.statusText;
    }
    const err = new Error(`Edge TTS Proxy synthesis failed: ${errorDetail}`);
    if (options.onError) options.onError(err);
    throw err;
  }

  const blob = await response.blob();
  const audioUrl = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const audio = new Audio(audioUrl);
    currentAudio = audio;

    audio.onplay = () => {
      if (options.onStart) options.onStart();
    };

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      if (options.onEnd) options.onEnd();
      resolve();
    };

    audio.onerror = (errEvent) => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      const err = new Error('Audio playback failed for Edge TTS stream');
      if (options.onError) options.onError(err);
      reject(err);
    };

    audio.play().catch(playbackErr => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      if (options.onError) options.onError(playbackErr);
      reject(playbackErr);
    });
  });
}

/**
 * Stops any ongoing Edge TTS audio playback.
 */
export function stopEdgeTTS() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch (_) {}
    currentAudio = null;
  }
}
