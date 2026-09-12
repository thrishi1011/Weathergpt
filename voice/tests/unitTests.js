/**
 * Level 2 Functional Unit Checks for WeatherGPT Voice Module
 * Run with: node voice/tests/unitTests.js
 */

import { askBackend, USE_MOCK } from '../mock/mockAsk.js';
import { SUPPORTED_LANGUAGES } from '../utils/languageSupport.js';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import fs from 'fs';
import path from 'path';

let failedTests = 0;
let passedTests = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    failedTests++;
  } else {
    console.log(`✅ [PASS] ${message}`);
    passedTests++;
  }
}

import { detectLanguage } from '../utils/languageDetector.js';

async function testLanguageDetection() {
  console.log('\n--- 1. Testing languageDetector.js Auto Detection Fidelity ---');

  const cases = [
    { text: 'రేపు వాన పడుతుందా?', expected: 'te-IN' },
    { text: 'వరంగల్‌లో ఉష్ణోగ్రత ఎంత?', expected: 'te-IN' },
    { text: 'क्या कल बारिश होगी?', expected: 'hi-IN' },
    { text: 'वारंगल में तापमान कैसा है?', expected: 'hi-IN' },
    { text: 'நாளை மழை பெய்யுமா?', expected: 'ta-IN' },
    { text: 'ನಾಳೆ ಮಳೆಯಾಗುತ್ತದೆಯೇ?', expected: 'kn-IN' },
    { text: 'আগামীকাল কি বৃষ্টি হবে?', expected: 'bn-IN' },
    { text: 'Will it rain tomorrow in Warangal?', expected: 'en-IN' },
    { text: 'varsham paduthunda', expected: 'te-IN' }, // Transliterated Telugu
    { text: 'kal barish hogi kya', expected: 'hi-IN' }  // Transliterated Hindi
  ];

  for (const tc of cases) {
    const detected = detectLanguage(tc.text);
    assert(detected === tc.expected, `Detected "${tc.text}" -> ${detected} (Expected: ${tc.expected})`);
  }
}

async function testMockBackendContract() {
  console.log('\n--- 2. Testing mockAsk.js Backend Contract & Language Fidelity ---');

  // Test 2.1: Auto mode returns Telugu for Telugu question
  const resAutoTe = await askBackend('రేపు వర్షం పడుతుందా?', 'Warangal', 'auto');
  assert(/[\u0C00-\u0C7F]/.test(resAutoTe.answer), 'Auto mode: Telugu question returns Telugu script answer');
  assert(resAutoTe.language === 'te-IN', 'Auto mode: Telugu question returns language te-IN');

  // Test 2.2: Auto mode returns Hindi for Hindi question
  const resAutoHi = await askBackend('क्या कल बारिश होगी?', 'Warangal', 'auto');
  assert(/[\u0900-\u097F]/.test(resAutoHi.answer), 'Auto mode: Hindi question returns Devanagari script answer');
  assert(resAutoHi.language === 'hi-IN', 'Auto mode: Hindi question returns language hi-IN');

  // Test 2.3: Auto mode returns Tamil for Tamil question
  const resAutoTa = await askBackend('நாளை மழை பெய்யுமா?', 'Warangal', 'auto');
  assert(/[\u0B80-\u0BFF]/.test(resAutoTa.answer), 'Auto mode: Tamil question returns Tamil script answer');
  assert(resAutoTa.language === 'ta-IN', 'Auto mode: Tamil question returns language ta-IN');

  // Test 2.4: English response returns English characters
  const resEn = await askBackend('Will it rain tomorrow in Warangal?', 'Warangal', 'en-IN');
  assert(typeof resEn.answer === 'string' && resEn.answer.length > 0, 'en-IN returns non-empty answer string');
  assert(resEn.language === 'en-IN', 'en-IN returns language field matching request');

  // Test 2.5: Verify USE_MOCK flag default
  assert(USE_MOCK === true, 'USE_MOCK is set to true by default for independent voice testing');
}

async function testSupportedLanguagesConfig() {
  console.log('\n--- 2. Testing languageSupport.js Language Configuration ---');

  const requiredCodes = ['en-IN', 'hi-IN', 'te-IN'];
  requiredCodes.forEach(code => {
    const config = SUPPORTED_LANGUAGES[code];
    assert(config !== undefined, `Language config for ${code} exists`);
    assert(config.code === code, `Config has matching code ${code}`);
    assert(typeof config.label === 'string', `Config has label for ${code}`);
    assert(typeof config.nativeLabel === 'string', `Config has nativeLabel for ${code}`);
    assert(typeof config.defaultEdgeVoice === 'string', `Config has defaultEdgeVoice for ${code}`);
  });
}

async function testEdgeTTSProxySynthesis() {
  console.log('\n--- 3. Testing Tier 2 Edge TTS Neural Speech Generation ---');

  const testVoices = [
    { lang: 'en-IN', voice: 'en-IN-NeerjaNeural', text: 'Rain is likely tomorrow in Warangal.' },
    { lang: 'hi-IN', voice: 'hi-IN-SwaraNeural', text: 'वारंगल में कल बारिश की संभावना है।' },
    { lang: 'te-IN', voice: 'te-IN-ShrutiNeural', text: 'వరంగల్‌లో రేపు వర్షం పడే అవకాశం ఉంది.' }
  ];

  for (const item of testVoices) {
    try {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(item.voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      const { audioStream } = tts.toStream(item.text);

      let chunkCount = 0;
      await new Promise((resolve, reject) => {
        audioStream.on('data', (chunk) => {
          chunkCount += chunk.length;
        });
        audioStream.on('end', resolve);
        audioStream.on('error', reject);
      });

      assert(chunkCount > 1000, `Edge TTS generated valid MP3 stream for ${item.lang} (${item.voice}) [${chunkCount} bytes]`);
    } catch (err) {
      assert(false, `Edge TTS failed for ${item.lang}: ${err.message}`);
    }
  }
}

async function testBoundaryEnforcement() {
  console.log('\n--- 4. Testing Scope Boundary Isolation ---');

  // Verify askBackend is the single point of contact
  const voiceDir = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let files = [];
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(scanDir(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.jsx'))) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const jsFiles = scanDir(voiceDir);
  let directBackendCalls = 0;

  for (const file of jsFiles) {
    if (file.includes('mockAsk.js')) continue; // mockAsk is allowed to define it
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes('/api/ask') && !content.includes('import { askBackend }')) {
      directBackendCalls++;
    }
  }

  assert(directBackendCalls === 0, 'No direct un-abstracted calls to /api/ask found outside mockAsk.js');
}

async function testGeminiSTTEndpoint() {
  console.log('\n--- 4. Testing Gemini STT Proxy Endpoint ---');
  try {
    // 1. Synthesize Telugu speech via Edge TTS
    const tts = new MsEdgeTTS();
    await tts.setMetadata('te-IN-ShrutiNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream('నమస్కారం వాతావరణం బాగుంది');

    const chunks = [];
    await new Promise((resolve, reject) => {
      audioStream.on('data', chunk => chunks.push(chunk));
      audioStream.on('end', resolve);
      audioStream.on('error', reject);
    });

    const audioBuf = Buffer.concat(chunks);
    const audioBase64 = audioBuf.toString('base64');

    // 2. Send to proxy /api/gemini-stt
    const res = await fetch('http://localhost:5050/api/gemini-stt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBase64, mimeType: 'audio/mp3' })
    });

    assert(res.ok, `POST /api/gemini-stt returned status 200 (Got ${res.status})`);
    const data = await res.json();
    assert(data.text && data.text.length > 0, `Gemini transcribed audio text: "${data.text}"`);
    assert(data.language === 'te-IN', `Gemini detected Telugu language as te-IN (Got "${data.language}")`);
    assert(data.source === 'gemini', `Result source is 'gemini'`);
  } catch (err) {
    console.warn(`[SKIP/WARN] Gemini STT test skipped or failed: ${err.message}`);
  }
}


async function run() {
  console.log('====================================================');
  console.log(' WeatherGPT Voice Module — Level 2 Functional Unit Tests');
  console.log('====================================================');

  await testLanguageDetection();
  await testMockBackendContract();
  await testSupportedLanguagesConfig();
  await testEdgeTTSProxySynthesis();
  await testGeminiSTTEndpoint();
  await testBoundaryEnforcement();

  console.log('\n====================================================');
  console.log(` SUMMARY: ${passedTests} Passed, ${failedTests} Failed`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
