/**
 * Gemini STT Client — voice/stt/geminiSTT.js
 *
 * Records microphone audio via MediaRecorder and sends it to the local
 * voice proxy (POST /api/gemini-stt) for Gemini-backed transcription
 * and language detection.
 *
 * The Gemini API key NEVER appears in this file.
 * The key lives server-side in voice/server/tts-proxy.js / voice/.env.
 *
 * Returns: { text: string, language: string, source: 'gemini' }
 */

const GEMINI_STT_PROXY_URL = 'http://localhost:5050/api/gemini-stt';
const MAX_RECORDING_MS = 12000; // 12s max per utterance

/**
 * Determines the best supported audio MIME type for MediaRecorder.
 * @returns {string}
 */
function getSupportedMimeType() {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4'
  ];
  for (const type of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}

/**
 * Converts an ArrayBuffer to a base64 string.
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Requests microphone access and returns a MediaStream.
 * @returns {Promise<MediaStream>}
 */
async function getMicrophoneStream() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Microphone access is not supported in this browser. Please use Chrome or Edge.');
  }
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  } catch (err) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      throw new Error('Microphone access was denied. Please allow microphone permissions and try again.');
    }
    if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      throw new Error('No microphone found. Please connect a microphone and try again.');
    }
    throw new Error(`Microphone error: ${err.message}`);
  }
}

/**
 * Sends audio blob to the local proxy which forwards it to Gemini.
 * The API key is NEVER sent to the browser — it lives only on the server.
 *
 * @param {Blob} audioBlob
 * @param {string} mimeType
 * @returns {Promise<{ text: string, language: string, source: 'gemini' }>}
 */
async function callGeminiSttProxy(audioBlob, mimeType) {
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBase64 = arrayBufferToBase64(arrayBuffer);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

  let response;
  try {
    response = await fetch(GEMINI_STT_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBase64, mimeType }),
      signal: controller.signal
    });
  } catch (fetchErr) {
    clearTimeout(timeout);
    if (fetchErr.name === 'AbortError') {
      throw new Error('Gemini STT request timed out. Falling back to browser STT.');
    }
    throw new Error('Gemini STT proxy is unreachable. Is "npm start" running in voice/?');
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    let detail = '';
    try {
      const errJson = await response.json();
      detail = errJson.details || errJson.error || response.statusText;
    } catch (_) {
      detail = response.statusText;
    }
    throw new Error(`Gemini STT failed (${response.status}): ${detail}`);
  }

  const data = await response.json();

  if (!data.text || !data.text.trim()) {
    throw new Error('Gemini returned empty transcript. No speech detected.');
  }

  return {
    text: data.text.trim(),
    language: data.language || 'en-IN',
    source: 'gemini'
  };
}

/**
 * GeminiSTTManager — manages recording lifecycle and Gemini transcription.
 */
class GeminiSTTManager {
  constructor() {
    this.mediaRecorder = null;
    this.stream = null;
    this.isRecording = false;
    this._stopRequested = false;
  }

  /**
   * Starts recording microphone audio and transcribes via Gemini.
   *
   * @param {Object} config
   * @param {Function} [config.onStart]      - Called when mic opens
   * @param {Function} [config.onInterim]    - Called with interim status string
   * @param {Function} [config.onResult]     - Called with { text, language, source }
   * @param {Function} [config.onError]      - Called with Error object
   * @param {Function} [config.onEnd]        - Called when recording+transcription ends
   */
  async startRecording({ onStart, onInterim, onResult, onError, onEnd } = {}) {
    if (this.isRecording) {
      this.stopRecording();
    }

    this._stopRequested = false;

    // Check MediaRecorder support
    if (typeof MediaRecorder === 'undefined') {
      const err = new Error('MediaRecorder is not supported in this browser. Please use Chrome or Edge.');
      if (onError) onError(err);
      return;
    }

    let stream;
    try {
      stream = await getMicrophoneStream();
    } catch (micErr) {
      if (onError) onError(micErr);
      return;
    }

    this.stream = stream;
    const mimeType = getSupportedMimeType();
    const recorderOptions = mimeType ? { mimeType } : {};

    let recorder;
    try {
      recorder = new MediaRecorder(stream, recorderOptions);
    } catch (recErr) {
      this._stopStream();
      const err = new Error(`Could not initialize MediaRecorder: ${recErr.message}`);
      if (onError) onError(err);
      return;
    }

    this.mediaRecorder = recorder;
    this.isRecording = true;
    const chunks = [];

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstart = () => {
      console.log(`[GeminiSTT] Recording started. MIME: ${mimeType || 'browser default'}`);
      if (onStart) onStart();
      if (onInterim) onInterim('Listening... speak now');
    };

    recorder.onstop = async () => {
      this.isRecording = false;
      this._stopStream();

      if (chunks.length === 0) {
        const err = new Error('No audio was captured. Please try speaking again.');
        if (onError) onError(err);
        if (onEnd) onEnd();
        return;
      }

      const audioBlob = new Blob(chunks, { type: mimeType || 'audio/webm' });
      console.log(`[GeminiSTT] Audio captured: ${(audioBlob.size / 1024).toFixed(1)} KB`);

      if (onInterim) onInterim('Transcribing...');

      try {
        const result = await callGeminiSttProxy(audioBlob, mimeType || 'audio/webm');
        console.log(`[GeminiSTT] transcript: "${result.text}" | language: ${result.language}`);
        if (onResult) onResult(result);
      } catch (transcribeErr) {
        console.warn('[GeminiSTT] Transcription failed:', transcribeErr.message);
        if (onError) onError(transcribeErr);
      }

      if (onEnd) onEnd();
    };

    recorder.onerror = (event) => {
      this.isRecording = false;
      this._stopStream();
      const err = new Error(`MediaRecorder error: ${event.error?.message || 'unknown'}`);
      if (onError) onError(err);
      if (onEnd) onEnd();
    };

    recorder.start(250); // collect in 250ms chunks

    // Auto-stop after max duration
    this._autoStopTimer = setTimeout(() => {
      if (this.isRecording) {
        console.log('[GeminiSTT] Max recording duration reached, stopping.');
        this.stopRecording();
      }
    }, MAX_RECORDING_MS);
  }

  /**
   * Stops the ongoing recording and triggers transcription.
   */
  stopRecording() {
    if (this._autoStopTimer) {
      clearTimeout(this._autoStopTimer);
      this._autoStopTimer = null;
    }
    if (this.mediaRecorder && this.isRecording) {
      try {
        this.mediaRecorder.stop();
      } catch (_) {}
    }
    this.isRecording = false;
  }

  /**
   * Aborts recording without triggering transcription.
   */
  abort() {
    if (this._autoStopTimer) {
      clearTimeout(this._autoStopTimer);
      this._autoStopTimer = null;
    }
    this._stopRequested = true;
    if (this.mediaRecorder) {
      try { this.mediaRecorder.ondataavailable = null; } catch (_) {}
      try { this.mediaRecorder.onstop = null; } catch (_) {}
      try { this.mediaRecorder.stop(); } catch (_) {}
    }
    this._stopStream();
    this.isRecording = false;
  }

  _stopStream() {
    if (this.stream) {
      try {
        this.stream.getTracks().forEach(t => t.stop());
      } catch (_) {}
      this.stream = null;
    }
  }

  getIsRecording() {
    return this.isRecording;
  }
}

export const geminiSTT = new GeminiSTTManager();
export default geminiSTT;
