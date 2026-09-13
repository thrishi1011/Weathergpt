const path = require('path');
const dotenv = require('dotenv');

// Load .env files in priority order: voice/.env, root .env, backend/.env
dotenv.config({ path: path.resolve(__dirname, '../voice/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const weatherRoutes = require('./routes/weather');
const askRoutes = require('./routes/ask');
const locationRoutes = require('./routes/location');
const ttsRoutes = require('./routes/tts');

const app = express();
const PORT = process.env.PORT || 3000;
const LLM_PORT = process.env.LLM_PORT || 8001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'WeatherGPT Backend' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'WeatherGPT Backend' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'WeatherGPT Backend' });
});

// Gemini Language Detection Route
app.post('/api/detect-language', async (req, res) => {
  const { text, question } = req.body || {};
  const queryText = (text || question || '').trim();
  if (!queryText) {
    return res.status(400).json({ error: 'Missing text parameter' });
  }

  try {
    const llmRes = await fetch(`http://127.0.0.1:${LLM_PORT}/detect-language`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: queryText })
    });
    if (llmRes.ok) {
      const data = await llmRes.json();
      return res.json(data);
    }
  } catch (err) {
    console.warn('Gemini detect-language proxy error:', err.message);
  }

  return res.json({ language: 'en', language_name: 'English', fallback: true });
});

// Ultra-Fast Google Translate + Gemini Translation Engine
async function translateTextWithGoogle(text, targetLang) {
  if (!text || !text.trim()) return text;
  const clean = text.trim();
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(clean)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Google translate returned ${response.status}`);
  const data = await response.json();
  if (Array.isArray(data) && Array.isArray(data[0])) {
    return data[0].map(item => item[0]).join('');
  }
  return clean;
}

app.post('/api/translate', async (req, res) => {
  const { texts, text, target_language, language } = req.body || {};
  const query = texts || text;
  const targetLang = target_language || language || 'en';

  if (!query) {
    return res.status(400).json({ error: 'Missing texts parameter' });
  }

  const isSingle = typeof query === 'string';
  const items = isSingle ? [query] : Array.isArray(query) ? query : [String(query)];

  // 1. Try Google Translate for sub-100ms instant translations
  try {
    const translations = await Promise.all(
      items.map(t => translateTextWithGoogle(t, targetLang).catch(err => {
        console.warn('Single text Google translate failure:', err.message);
        return t;
      }))
    );
    return res.json({
      translations: isSingle ? translations[0] : translations,
      language: targetLang,
      engine: 'google'
    });
  } catch (err) {
    console.warn('Google translate batch failed, attempting Gemini LLM fallback:', err.message);
  }

  // 2. Gemini LLM Fallback
  try {
    const llmRes = await fetch(`http://127.0.0.1:${LLM_PORT}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: items, target_language: targetLang })
    });
    if (llmRes.ok) {
      const data = await llmRes.json();
      return res.json({
        translations: isSingle && Array.isArray(data.translations) ? data.translations[0] : data.translations,
        language: targetLang,
        engine: 'gemini'
      });
    }
  } catch (err) {
    console.warn('Gemini translate fallback error:', err.message);
  }

  return res.json({ translations: query, language: targetLang, fallback: true });
});

// Gemini Audio Speech-to-Text Route (Transcribes actual audio via Gemini)
const handleAudioTranscription = async (req, res) => {
  const { audio, audioBase64, mime_type, mimeType } = req.body || {};
  const audioData = audio || audioBase64;
  const mime = mime_type || mimeType || 'audio/webm';

  if (!audioData) {
    return res.status(400).json({ error: 'Missing audio parameter' });
  }

  try {
    const llmRes = await fetch(`http://127.0.0.1:${LLM_PORT}/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio: audioData, mime_type: mime })
    });
    if (llmRes.ok) {
      const data = await llmRes.json();
      // Ensure both text and transcript fields exist
      if (data.transcript && !data.text) data.text = data.transcript;
      if (data.text && !data.transcript) data.transcript = data.text;
      return res.json(data);
    }
  } catch (err) {
    console.warn('Gemini transcribe proxy error:', err.message);
  }

  return res.json({ text: '', transcript: '', language: 'en', language_name: 'English' });
};

app.post('/api/transcribe', handleAudioTranscription);
app.post('/api/gemini-stt', handleAudioTranscription);

// API routes
app.use('/api/weather', weatherRoutes);
app.use('/api/ask', askRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/tts', ttsRoutes);

// Global error handler — catches unhandled errors so the server never crashes silently
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`WeatherGPT Backend running on port ${PORT}`);
  });
}

module.exports = app;
