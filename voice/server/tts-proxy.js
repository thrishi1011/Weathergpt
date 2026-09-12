import http from 'http';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

// Load voice/.env so GEMINI_API_KEY stays server-side
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const _require = createRequire(import.meta.url);
const dotenv = _require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PORT = process.env.PORT || 5050;

// Supported Gemini models in priority order for audio transcription.
// If the primary model encounters a rate limit (429) or is unavailable,
// the server automatically attempts the next candidate model in the chain.
const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
  'gemini-3.6-flash'
].filter(Boolean);
const GEMINI_MODELS = [...new Set(CANDIDATE_MODELS)];
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Transcribes audio using the Gemini API (server-side only) with multi-model fallback.
 * The API key is read from process.env.GEMINI_API_KEY and NEVER returned to clients.
 *
 * @param {string} audioBase64 - Base64-encoded audio data
 * @param {string} mimeType    - Audio MIME type (e.g. 'audio/webm', 'audio/mp3')
 * @returns {Promise<{ text: string, language: string, source: 'gemini', model: string }>}
 */
async function callGeminiTranscribe(audioBase64, mimeType) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Add it to voice/.env or the environment.');
  }

  const requestBody = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType || 'audio/webm',
              data: audioBase64
            }
          },
          {
            text: [
              'Listen to the audio carefully and do the following:',
              '1. Transcribe the spoken words exactly as heard (including any native script like Telugu or Devanagari).',
              '2. Identify the primary spoken language (e.g., Telugu, Hindi, English, Tamil).',
              'Respond ONLY with a JSON object in this exact format (no markdown, no extra text):',
              '{"transcript": "<exact transcription>", "language": "<language name in English>"}'
            ].join(' ')
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 2048
    }
  };

  let lastError = null;

  for (const model of GEMINI_MODELS) {
    const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`;
    try {
      console.log(`[Gemini STT] Calling model: ${model}...`);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errBody = await response.text();
        let errDetail = errBody;
        try {
          const parsed = JSON.parse(errBody);
          errDetail = parsed?.error?.message || errBody;
        } catch (_) {}

        // If rate limit (429) or server overload (503), try next model in fallback list
        if (response.status === 429 || response.status === 503) {
          console.warn(`[Gemini STT] Model ${model} returned ${response.status} (${errDetail.slice(0, 90)}). Trying fallback model...`);
          lastError = new Error(`Model ${model} error (${response.status}): ${errDetail}`);
          continue;
        }

        throw new Error(`Gemini API error (${response.status}): ${errDetail}`);
      }

      const data = await response.json();

      // Extract text from Gemini's response (handles reasoning parts)
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const rawText = parts.map(p => p.text || '').filter(Boolean).join('\n').trim();
      if (!rawText) {
        throw new Error(`Gemini model ${model} returned empty content.`);
      }

      // Robust parsing for Gemini response (handles markdown fences and unescaped newlines)
      let transcript = '';
      let languageName = 'English';

      // 1. Try regex extraction first (immune to unescaped newlines inside strings)
      const transcriptMatch = rawText.match(/"transcript"\s*:\s*"([\s\S]*?)"\s*,\s*"language"/i)
                           || rawText.match(/"transcript"\s*:\s*"([\s\S]*?)"/i);
      const languageMatch = rawText.match(/"language"\s*:\s*"([^"\r\n]+)"/i);

      if (transcriptMatch && transcriptMatch[1]) {
        transcript = transcriptMatch[1].replace(/\\n/g, ' ').replace(/\r?\n/g, ' ').trim();
      }
      if (languageMatch && languageMatch[1]) {
        languageName = languageMatch[1].trim();
      }

      // 2. If regex didn't find both, try sanitized JSON.parse
      if (!transcript) {
        try {
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const sanitized = jsonMatch[0].replace(/[\u0000-\u001F]+/g, m => (m === '\n' || m === '\r' ? ' ' : ''));
            const parsed = JSON.parse(sanitized);
            transcript = (parsed.transcript || parsed.text || '').trim();
            languageName = (parsed.language || languageName).trim();
          }
        } catch (_) {}
      }

      // 3. Fallback: use rawText minus markdown fences
      if (!transcript) {
        transcript = rawText.replace(/```(?:json)?|```/gi, '').trim();
      }

      if (!transcript) {
        throw new Error('Gemini transcription was empty.');
      }

      // Normalize language name to BCP-47 locale (also checks script in transcript)
      const normalizedLang = normalizeLanguageName(languageName, transcript);

      console.log(`[Gemini STT (${model})] transcript: "${transcript.slice(0, 60)}" | language: ${languageName} (${normalizedLang})`);

      return { text: transcript, language: normalizedLang, source: 'gemini', model };
    } catch (err) {
      lastError = err;
      if (err.message.includes('429') || err.message.includes('503')) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('All candidate Gemini models failed.');
}

/** Minimal server-side language name → BCP-47 normalizer (mirrors client utils/languageDetector.js) */
function normalizeLanguageName(name, text = '') {
  // First check if text has explicit Indic scripts
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN'; // Telugu
  if (/[\u0900-\u097F]/.test(text)) return 'hi-IN'; // Devanagari (Hindi)
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN'; // Tamil
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn-IN'; // Kannada
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml-IN'; // Malayalam
  if (/[\u0980-\u09FF]/.test(text)) return 'bn-IN'; // Bengali
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gu-IN'; // Gujarati

  const n = (name || '').trim().toLowerCase();
  const map = {
    'telugu': 'te-IN', 'tel': 'te-IN', 'te': 'te-IN',
    'hindi': 'hi-IN', 'hin': 'hi-IN', 'hi': 'hi-IN',
    'english': 'en-IN', 'eng': 'en-IN', 'en': 'en-IN',
    'tamil': 'ta-IN', 'tam': 'ta-IN', 'ta': 'ta-IN',
    'kannada': 'kn-IN', 'kan': 'kn-IN', 'kn': 'kn-IN',
    'malayalam': 'ml-IN', 'mal': 'ml-IN', 'ml': 'ml-IN',
    'bengali': 'bn-IN', 'ben': 'bn-IN', 'bn': 'bn-IN',
    'marathi': 'mr-IN', 'mar': 'mr-IN', 'mr': 'mr-IN',
    'gujarati': 'gu-IN', 'guj': 'gu-IN', 'gu': 'gu-IN'
  };
  if (map[n]) return map[n];
  // BCP-47 already? e.g. "te-IN"
  if (/^[a-z]{2,3}-[a-z]{2,3}$/i.test(n)) {
    const prefix = n.split('-')[0];
    return map[prefix] || n.toLowerCase();
  }
  return 'en-IN'; // safe fallback
}

// Helper: server-side Google Translate TTS fallback
async function fallbackGoogleTTS(text, language, res) {
  const langPrefix = (language || 'te-IN').split('-')[0].toLowerCase();
  const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${langPrefix}&client=tw-ob&q=${encodeURIComponent(text)}`;
  console.log(`[EdgeTTS Proxy Fallback] Fetching server-side Google Indic TTS for [${language}]...`);
  
  const googleRes = await fetch(googleUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  if (!googleRes.ok) {
    throw new Error(`Google TTS fallback returned ${googleRes.status}: ${googleRes.statusText}`);
  }

  res.writeHead(200, {
    'Content-Type': 'audio/mpeg',
    'Transfer-Encoding': 'chunked'
  });

  const arrayBuf = await googleRes.arrayBuffer();
  res.end(Buffer.from(arrayBuf));
}

// Voice map fallback per requested language/voice
const DEFAULT_VOICES = {
  'en-IN': 'en-IN-NeerjaNeural',
  'hi-IN': 'hi-IN-SwaraNeural',
  'te-IN': 'te-IN-ShrutiNeural',
  'ta-IN': 'ta-IN-PallaviNeural',
  'kn-IN': 'kn-IN-SapnaNeural',
  'ml-IN': 'ml-IN-SobhanaNeural',
  'bn-IN': 'bn-IN-TanishaaNeural',
  'mr-IN': 'mr-IN-AarohiNeural',
  'gu-IN': 'gu-IN-DhwaniNeural'
};

async function handleSynthesis(text, language = 'en-IN', voice, res) {
  const selectedVoice = voice || DEFAULT_VOICES[language] || DEFAULT_VOICES['en-IN'];
  console.log(`[EdgeTTS Proxy] Synthesizing speech (${language} -> ${selectedVoice}): "${text.slice(0, 40)}..."`);

  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(selectedVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text);

    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Transfer-Encoding': 'chunked'
    });

    audioStream.pipe(res);

    audioStream.on('error', async (streamErr) => {
      console.warn('[EdgeTTS Proxy Stream Error - Falling back]:', streamErr.message);
      if (!res.headersSent) {
        try {
          await fallbackGoogleTTS(text, language, res);
        } catch (fbErr) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Speech synthesis failed', details: streamErr.message }));
        }
      }
    });
  } catch (err) {
    console.warn('[EdgeTTS Setup Error - Falling back]:', err.message);
    try {
      await fallbackGoogleTTS(text, language, res);
    } catch (fbErr) {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Speech synthesis failed', details: err.message }));
      }
    }
  }
}

const server = http.createServer(async (req, res) => {
  // Enable CORS for local testing from any frontend port or static HTML file
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // Health check
  if (req.method === 'GET' && parsedUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'weathergpt-edge-tts-proxy' }));
    return;
  }

  // Voice list endpoint
  if (req.method === 'GET' && parsedUrl.pathname === '/api/voices') {
    try {
      const tts = new MsEdgeTTS();
      const voices = await tts.getVoices();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ voices }));
    } catch (err) {
      console.error('Error fetching voices:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch Edge TTS voice list', details: err.message }));
    }
    return;
  }

  // TTS Synthesis endpoint: GET /api/tts?text=...&language=te-IN
  if (req.method === 'GET' && parsedUrl.pathname === '/api/tts') {
    const text = parsedUrl.searchParams.get('text');
    const language = parsedUrl.searchParams.get('language') || 'te-IN';
    const voice = parsedUrl.searchParams.get('voice');

    if (!text || !text.trim()) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Query parameter "text" is required' }));
      return;
    }

    await handleSynthesis(text, language, voice, res);
    return;
  }

  // TTS Synthesis endpoint: POST /api/tts
  if (req.method === 'POST' && parsedUrl.pathname === '/api/tts') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        if (!body) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Request body is empty' }));
          return;
        }

        const data = JSON.parse(body);
        const { text, language = 'en-IN', voice } = data;

        if (!text || typeof text !== 'string' || !text.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Field "text" is required and must be non-empty' }));
          return;
        }

        await handleSynthesis(text, language, voice, res);
      } catch (err) {
        console.error('[EdgeTTS Proxy Body Error]:', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to process request', details: err.message }));
        }
      }
    });
    return;
  }

  // POST /api/gemini-stt — Transcribes audio via Gemini. Key stays server-side.
  if (req.method === 'POST' && parsedUrl.pathname === '/api/gemini-stt') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        if (!body) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Request body is empty' }));
          return;
        }

        const { audioBase64, mimeType } = JSON.parse(body);

        if (!audioBase64 || typeof audioBase64 !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Field "audioBase64" is required' }));
          return;
        }

        if (!process.env.GEMINI_API_KEY) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Gemini STT is not configured. Set GEMINI_API_KEY in voice/.env',
            details: 'GEMINI_API_KEY environment variable is missing'
          }));
          return;
        }

        const result = await callGeminiTranscribe(audioBase64, mimeType || 'audio/webm');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        console.error('[Gemini STT Endpoint Error]:', err.message);
        if (!res.headersSent) {
          const isRateLimit = err.message.includes('429') || err.message.toLowerCase().includes('quota');
          const statusCode = isRateLimit ? 429 : 500;
          res.writeHead(statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: err.message,
            details: err.message
          }));
        }
      }
    });
    return;
  }


  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, () => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  console.log(`=========================================`);
  console.log(` WeatherGPT Voice Proxy Server Running`);
  console.log(` Port:       http://localhost:${PORT}`);
  console.log(` Health:     http://localhost:${PORT}/health`);
  console.log(` Edge TTS:   POST http://localhost:${PORT}/api/tts`);
  console.log(` Gemini STT: POST http://localhost:${PORT}/api/gemini-stt`);
  console.log(` Gemini key: ${hasGeminiKey ? '✓ loaded from environment' : '✗ NOT SET — Gemini STT disabled'}`);
  console.log(`=========================================`);
});

export default server;
