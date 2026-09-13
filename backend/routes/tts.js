const express = require('express');
const router = express.Router();

// Supported BCP-47 / ISO language codes for Google TTS
const LANG_MAP = {
  'en': 'en',
  'en-in': 'en',
  'hi': 'hi',
  'hi-in': 'hi',
  'te': 'te',
  'te-in': 'te',
  'ta': 'ta',
  'ta-in': 'ta',
  'kn': 'kn',
  'kn-in': 'kn',
  'ml': 'ml',
  'ml-in': 'ml',
  'bn': 'bn',
  'bn-in': 'bn',
  'mr': 'mr',
  'mr-in': 'mr',
  'gu': 'gu',
  'gu-in': 'gu',
  'pa': 'pa',
  'ur': 'ur'
};

/**
 * Split text into chunks safe for TTS API (max 180 chars per chunk, splitting on sentence boundaries)
 */
function splitTextIntoChunks(text, maxLen = 170) {
  // Remove markdown formatting
  const clean = text
    .replace(/[*_#`~]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) return [];
  if (clean.length <= maxLen) return [clean];

  const sentences = clean.split(/([।!?.,;\n]+)/);
  const chunks = [];
  let current = '';

  for (let i = 0; i < sentences.length; i++) {
    const part = sentences[i];
    if (!part) continue;

    if ((current + part).length <= maxLen) {
      current += part;
    } else {
      if (current.trim()) chunks.push(current.trim());
      if (part.length > maxLen) {
        // Force split long words or chunks
        for (let j = 0; j < part.length; j += maxLen) {
          chunks.push(part.slice(j, j + maxLen).trim());
        }
        current = '';
      } else {
        current = part;
      }
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(c => c.length > 0);
}

/**
 * Fetch a single MP3 audio chunk from Google Neural TTS
 */
async function fetchTTSChunk(text, langCode) {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(langCode)}&client=tw-ob&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'audio/mpeg, audio/*;q=0.9, */*;q=0.8'
    },
    signal: AbortSignal.timeout(8000)
  });

  if (!res.ok) {
    throw new Error(`TTS provider returned HTTP ${res.status}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

/**
 * GET /api/tts?text=...&language=te
 * Returns high-fidelity neural MP3 audio for the given text and language.
 */
router.get('/', async (req, res) => {
  try {
    const rawText = req.query.text;
    const rawLang = (req.query.language || req.query.lang || 'en').toLowerCase().trim();

    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: 'Missing required query parameter: text' });
    }

    const langCode = LANG_MAP[rawLang] || rawLang.split('-')[0] || 'en';
    const chunks = splitTextIntoChunks(rawText);

    if (chunks.length === 0) {
      return res.status(400).json({ error: 'Empty text provided' });
    }

    // Fetch audio chunks sequentially to maintain sentence order
    const audioBuffers = [];
    for (const chunk of chunks) {
      try {
        const buf = await fetchTTSChunk(chunk, langCode);
        if (buf && buf.length > 0) {
          audioBuffers.push(buf);
        }
      } catch (chunkErr) {
        console.warn(`[TTS] Chunk synthesis warning for [${langCode}]:`, chunkErr.message);
      }
    }

    if (audioBuffers.length === 0) {
      return res.status(502).json({ error: 'Failed to synthesize speech audio from upstream TTS provider' });
    }

    const finalAudio = Buffer.concat(audioBuffers);

    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': finalAudio.length,
      'Cache-Control': 'public, max-age=86400',
      'Accept-Ranges': 'bytes'
    });

    res.end(finalAudio);
  } catch (err) {
    console.error('Error in /api/tts:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal TTS error', message: err.message });
    }
  }
});

module.exports = router;
