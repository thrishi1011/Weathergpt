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

async function testMockBackendContract() {
  console.log('\n--- 1. Testing mockAsk.js Backend Contract & Language Fidelity ---');

  // Test 1.1: Returns agreed shape { answer, location, language }
  const resEn = await askBackend('Will it rain tomorrow in Warangal?', 'Warangal', 'en-IN');
  assert(typeof resEn.answer === 'string' && resEn.answer.length > 0, 'en-IN returns non-empty answer string');
  assert(resEn.location === 'Warangal', 'en-IN returns location matching request');
  assert(resEn.language === 'en-IN', 'en-IN returns language field matching request');

  // Test 1.2: Hindi response returns Hindi characters
  const resHi = await askBackend('क्या कल बारिश होगी?', 'वारंगल', 'hi-IN');
  assert(/[\u0900-\u097F]/.test(resHi.answer), 'hi-IN response contains Devanagari script characters');
  assert(resHi.language === 'hi-IN', 'hi-IN response has language code hi-IN');

  // Test 1.3: Telugu response returns Telugu characters
  const resTe = await askBackend('రేపు వర్షం పడుతుందా?', 'వరంగల్', 'te-IN');
  assert(/[\u0C00-\u0C7F]/.test(resTe.answer), 'te-IN response contains Telugu script characters');
  assert(resTe.language === 'te-IN', 'te-IN response has language code te-IN');

  // Test 1.4: Verify USE_MOCK flag default
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

async function run() {
  console.log('====================================================');
  console.log(' WeatherGPT Voice Module — Level 2 Functional Unit Tests');
  console.log('====================================================');

  await testMockBackendContract();
  await testSupportedLanguagesConfig();
  await testEdgeTTSProxySynthesis();
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
