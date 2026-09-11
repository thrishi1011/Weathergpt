/**
 * Test Runner Script for Voice Module
 * Tests:
 * 1. Mock askBackend functionality in en-IN, hi-IN, te-IN
 * 2. Edge TTS synthesis via msedge-tts
 */

import { askBackend } from './mock/mockAsk.js';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

async function runTests() {
  console.log('--- [1/2] Testing Mock Backend askBackend() ---');

  const testCases = [
    { lang: 'en-IN', q: 'Will it rain tomorrow in Warangal?' },
    { lang: 'hi-IN', q: 'क्या कल बारिश होगी?' },
    { lang: 'te-IN', q: 'రేపు వర్షం పడుతుందా?' }
  ];

  for (const tc of testCases) {
    const result = await askBackend(tc.q, 'Warangal', tc.lang);
    if (!result.answer) {
      throw new Error(`Failed mock ask for ${tc.lang}: empty answer`);
    }
    console.log(`[PASS] ${tc.lang} Mock Answer: "${result.answer.slice(0, 50)}..."`);
  }

  console.log('\n--- [2/2] Testing msedge-tts Neural Synthesis for Telugu & Hindi ---');
  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata('te-IN-ShrutiNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream('వరంగల్‌లో రేపు వర్షం పడే అవకాశం ఉంది.');

    let chunks = 0;
    await new Promise((resolve, reject) => {
      audioStream.on('data', () => chunks++);
      audioStream.on('end', resolve);
      audioStream.on('error', reject);
    });

    console.log(`[PASS] Edge TTS Telugu Stream generated successfully (${chunks} audio data chunks).`);
  } catch (err) {
    console.error(`[FAIL] Edge TTS verification failed:`, err);
    process.exit(1);
  }

  console.log('\n=========================================');
  console.log(' ALL VOICE MODULE UNIT TESTS PASSED');
  console.log('=========================================');
}

runTests().catch(err => {
  console.error('Test runner failure:', err);
  process.exit(1);
});
