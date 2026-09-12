import { isNativeTTSAvailable, speakNative, stopNativeTTS } from './nativeTTS.js';
import { speakEdgeTTS, stopEdgeTTS } from './edgeTTSFallback.js';
import { speakCloudTTS, stopCloudTTS } from './cloudTTS.js';

let activeTier = null; // 'native' | 'edge' | 'cloud' | null

/**
 * Speaks text using the best available TTS engine for the requested language.
 *
 * @param {string} text - Text to speak
 * @param {string} langCode - 'en-IN', 'hi-IN', 'te-IN'
 * @param {Object} [options]
 * @param {boolean} [options.forceEdge=false] - Force Tier 2 Edge TTS even if native voice is present
 * @param {Function} [options.onStart] - Callback when speech playback starts
 * @param {Function} [options.onEnd] - Callback when speech playback finishes
 * @param {Function} [options.onError] - Callback on error
 * @param {Function} [options.onTierSelect] - Callback informing which tier was chosen ('native' | 'edge' | 'cloud')
 * @returns {Promise<{ tier: 'native' | 'edge' | 'cloud' }>}
 */
export async function speak(text, langCode = 'en-IN', options = {}) {
  // Cancel any ongoing speech across all tiers
  stopSpeech();

  if (!text || !text.trim()) {
    return { tier: null };
  }

  const { forceEdge = false, onTierSelect, onStart, onEnd, onError } = options;

  let canUseNative = false;
  if (!forceEdge) {
    canUseNative = await isNativeTTSAvailable(langCode);
  }

  // Tier 1: Dedicated native browser voice (if installed locally)
  if (canUseNative) {
    try {
      activeTier = 'native';
      if (onTierSelect) onTierSelect('native');
      console.log(`[TTSRouter] Using Tier 1 (Native SpeechSynthesis) for [${langCode}]`);
      await speakNative(text, langCode, { onStart, onEnd, onError });
      activeTier = null;
      return { tier: 'native' };
    } catch (nativeErr) {
      console.warn(`[TTSRouter] Tier 1 failed for [${langCode}], attempting fallback. Reason:`, nativeErr.message);
    }
  }

  // Tier 2: Edge TTS Proxy (if local backend proxy is running)
  try {
    activeTier = 'edge';
    if (onTierSelect) onTierSelect('edge');
    console.log(`[TTSRouter] Attempting Tier 2 (Edge TTS Proxy) for [${langCode}]`);
    await speakEdgeTTS(text, langCode, { onStart, onEnd, onError });
    activeTier = null;
    return { tier: 'edge' };
  } catch (edgeErr) {
    console.info(`[TTSRouter] Tier 2 (Edge TTS Proxy) unavailable for [${langCode}]. Falling back to Cloud TTS API.`);
  }

  // Tier 3: Direct Cloud TTS API (Native authentic Indic pronunciation, 0 setup required)
  try {
    activeTier = 'cloud';
    if (onTierSelect) onTierSelect('cloud');
    console.log(`[TTSRouter] Using Tier 3 (Direct Cloud TTS API) for [${langCode}]`);
    await speakCloudTTS(text, langCode, { onStart, onEnd, onError });
    activeTier = null;
    return { tier: 'cloud' };
  } catch (cloudErr) {
    console.warn(`[TTSRouter] Tier 3 (Cloud TTS) failed:`, cloudErr.message);
  }

  // Tier 4: Browser SpeechSynthesis best-effort generic utterance
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      console.log(`[TTSRouter] Attempting Tier 4 (Generic Web Speech Fallback) for [${langCode}]`);
      activeTier = 'native-fallback';
      if (onTierSelect) onTierSelect('native-fallback');
      await speakNative(text, langCode, { onStart, onEnd, onError });
      activeTier = null;
      return { tier: 'native-fallback' };
    } catch (tier4Err) {
      console.warn(`[TTSRouter] Tier 4 fallback also failed:`, tier4Err.message);
    }
  }

  activeTier = null;
  const finalError = new Error(`All speech synthesis tiers failed for language [${langCode}].`);
  if (onError) onError(finalError);
  throw finalError;
}

/**
 * Stops any speech currently in progress across all engines.
 */
export function stopSpeech() {
  stopNativeTTS();
  stopEdgeTTS();
  stopCloudTTS();
  activeTier = null;
}

/**
 * Returns current active TTS tier ('native', 'edge', 'cloud', or null).
 */
export function getActiveTier() {
  return activeTier;
}
