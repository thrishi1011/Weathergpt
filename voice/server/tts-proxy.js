import http from 'http';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const PORT = process.env.PORT || 5050;

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
  'te-IN': 'te-IN-ShrutiNeural'
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

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` WeatherGPT Edge TTS Proxy Server Running`);
  console.log(` Port: http://localhost:${PORT}`);
  console.log(` Health: http://localhost:${PORT}/health`);
  console.log(` TTS: POST http://localhost:${PORT}/api/tts`);
  console.log(`=========================================`);
});

export default server;
