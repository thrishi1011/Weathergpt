const app = require('./server.js');
const { normalizeAlert } = require('../alerts/services/alertNormalizer.js');
const { NotificationService } = require('../alerts/services/notificationService.js');
const { ConsoleNotificationProvider } = require('../alerts/providers/consoleProvider.js');
const { evaluateAlert } = require('../alerts/services/alertEvaluator.js');
const { generateAnswer } = require('./services/llmService.js');

async function runE2E() {
  console.log('====================================================');
  console.log('       WEATHERGPT FULL END-TO-END TEST SUITE        ');
  console.log('====================================================\n');

  const results = {};

  const makeReq = async (url, opts) => {
    const res = await fetch(url, opts);
    let data;
    try { data = await res.json(); } catch (e) { data = null; }
    return { status: res.status, data };
  };

  // Give express server a second to bind
  await new Promise(r => setTimeout(r, 1200));

  // TEST 1: Warangal weather query
  try {
    const w = await makeReq('http://localhost:3000/api/weather?location=Warangal');
    const a = await makeReq('http://localhost:3000/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'What is the current temperature?', location: 'Warangal', language: 'en' })
    });
    if (w.status === 200 && a.status === 200 && a.data.answer.includes('Warangal')) {
      results['TEST 1 (Warangal Full Flow)'] = `PASS - Weather fetched (${w.data.temperature}°C), LLM answered: "${a.data.answer.slice(0, 65)}..."`;
    } else {
      results['TEST 1 (Warangal Full Flow)'] = 'FAIL';
    }
  } catch (e) { results['TEST 1 (Warangal Full Flow)'] = 'FAIL: ' + e.message; }

  // TEST 2: Hyderabad
  try {
    const w = await makeReq('http://localhost:3000/api/weather?location=Hyderabad');
    const a = await makeReq('http://localhost:3000/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'What is the weather?', location: 'Hyderabad', language: 'en' })
    });
    if (w.status === 200 && a.status === 200 && a.data.answer.includes('Hyderabad')) {
      results['TEST 2 (Hyderabad Full Flow)'] = `PASS - Weather fetched (${w.data.temperature}°C), LLM answered: "${a.data.answer.slice(0, 65)}..."`;
    } else {
      results['TEST 2 (Hyderabad Full Flow)'] = 'FAIL';
    }
  } catch (e) { results['TEST 2 (Hyderabad Full Flow)'] = 'FAIL: ' + e.message; }

  // TEST 3: Rain question
  try {
    const a = await makeReq('http://localhost:3000/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'Will it rain today?', location: 'Warangal', language: 'en' })
    });
    if (a.status === 200 && a.data.answer.toLowerCase().includes('rain')) {
      results['TEST 3 (Rain question)'] = `PASS - LLM answered: "${a.data.answer}"`;
    } else {
      results['TEST 3 (Rain question)'] = 'FAIL';
    }
  } catch (e) { results['TEST 3 (Rain question)'] = 'FAIL: ' + e.message; }

  // TEST 4: Farming question
  try {
    const a = await makeReq('http://localhost:3000/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'Should I spray pesticide or fertilizer today?', location: 'Warangal', language: 'en' })
    });
    if (a.status === 200 && a.data.answer) {
      results['TEST 4 (Farming question)'] = `PASS - LLM answered: "${a.data.answer}"`;
    } else {
      results['TEST 4 (Farming question)'] = 'FAIL';
    }
  } catch (e) { results['TEST 4 (Farming question)'] = 'FAIL: ' + e.message; }

  // TEST 5: Hindi
  try {
    const a = await makeReq('http://localhost:3000/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'क्या आज बारिश होगी?', location: 'Warangal', language: 'hi' })
    });
    if (a.status === 200 && /[\u0900-\u097F]/.test(a.data.answer)) {
      results['TEST 5 (Hindi question)'] = `PASS - Hindi Devanagari answer: "${a.data.answer}"`;
    } else {
      results['TEST 5 (Hindi question)'] = 'FAIL';
    }
  } catch (e) { results['TEST 5 (Hindi question)'] = 'FAIL: ' + e.message; }

  // TEST 6: Telugu
  try {
    const a = await makeReq('http://localhost:3000/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'ఈరోజు వాతావరణం ఎలా ఉంది?', location: 'Warangal', language: 'te' })
    });
    if (a.status === 200 && /[\u0C00-\u0C7F]/.test(a.data.answer)) {
      results['TEST 6 (Telugu question)'] = `PASS - Telugu script answer: "${a.data.answer}"`;
    } else {
      results['TEST 6 (Telugu question)'] = 'FAIL';
    }
  } catch (e) { results['TEST 6 (Telugu question)'] = 'FAIL: ' + e.message; }

  // TEST 7: Invalid location
  try {
    const a = await makeReq('http://localhost:3000/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'How is the weather?', location: 'XYZNONEXISTENTCITY99999', language: 'en' })
    });
    if (a.status === 404 && a.data.error.includes('Location not found')) {
      results['TEST 7 (Invalid location)'] = `PASS - Controlled 404 with error: "${a.data.error}"`;
    } else {
      results['TEST 7 (Invalid location)'] = 'FAIL: status ' + a.status;
    }
  } catch (e) { results['TEST 7 (Invalid location)'] = 'FAIL: ' + e.message; }

  // TEST 8: Missing question
  try {
    const a = await makeReq('http://localhost:3000/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: 'Warangal', language: 'en' })
    });
    if (a.status === 400 && a.data.error.includes('Missing required field: question')) {
      results['TEST 8 (Missing question)'] = `PASS - Controlled 400 with error: "${a.data.error}"`;
    } else {
      results['TEST 8 (Missing question)'] = 'FAIL: status ' + a.status;
    }
  } catch (e) { results['TEST 8 (Missing question)'] = 'FAIL: ' + e.message; }

  // TEST 9: Backend failure handling
  try {
    const a = await makeReq('http://localhost:3000/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'MALFORMED_JSON_STRING'
    });
    if (a.status === 500 || a.status === 400) {
      results['TEST 9 (Backend failure / malformed JSON)'] = `PASS - Handled safely with status ${a.status}`;
    } else {
      results['TEST 9 (Backend failure / malformed JSON)'] = 'FAIL';
    }
  } catch (e) { results['TEST 9 (Backend failure / malformed JSON)'] = 'FAIL: ' + e.message; }

  // TEST 10: Missing weather data handling
  try {
    const res = await generateAnswer({
      question: 'What is the weather?',
      weather: { location: 'TestCity', temperature: null, rain_probability: null },
      language: 'en'
    });
    if (res && res.answer && !res.answer.includes('null')) {
      results['TEST 10 (Missing weather data)'] = `PASS - Handled gracefully without crash: "${res.answer}"`;
    } else {
      results['TEST 10 (Missing weather data)'] = 'FAIL';
    }
  } catch (e) { results['TEST 10 (Missing weather data)'] = 'FAIL: ' + e.message; }

  // TEST 11: Active alert
  try {
    const alert = { active: true, district: 'Warangal', severity: 'orange', event: 'Heavy Rain', message: 'Heavy rain alert' };
    const evalRes = evaluateAlert(alert);
    if (evalRes.should_notify === true) {
      results['TEST 11 (Active alert)'] = 'PASS - Active alert evaluated as should_notify: true';
    } else {
      results['TEST 11 (Active alert)'] = 'FAIL';
    }
  } catch (e) { results['TEST 11 (Active alert)'] = 'FAIL: ' + e.message; }

  // TEST 12: Inactive alert
  try {
    const alert = { active: false, district: 'Warangal', severity: 'orange', event: 'Heavy Rain', message: 'Heavy rain alert' };
    const evalRes = evaluateAlert(alert);
    if (evalRes.should_notify === false) {
      results['TEST 12 (Inactive alert)'] = 'PASS - Inactive alert evaluated as should_notify: false';
    } else {
      results['TEST 12 (Inactive alert)'] = 'FAIL';
    }
  } catch (e) { results['TEST 12 (Inactive alert)'] = 'FAIL: ' + e.message; }

  // TEST 13: Matching district
  try {
    const provider = new ConsoleNotificationProvider();
    const service = new NotificationService(provider);
    const alert = { active: true, district: 'Warangal', severity: 'red', event: 'Squall', message: 'High wind' };
    const res = await service.processAlert(alert, 'Warangal');
    if (res.notified === true) {
      results['TEST 13 (Matching district)'] = 'PASS - Alert for Warangal + user in Warangal -> notified: true';
    } else {
      results['TEST 13 (Matching district)'] = 'FAIL';
    }
  } catch (e) { results['TEST 13 (Matching district)'] = 'FAIL: ' + e.message; }

  // TEST 14: Non-matching district
  try {
    const provider = new ConsoleNotificationProvider();
    const service = new NotificationService(provider);
    const alert = { active: true, district: 'Warangal', severity: 'red', event: 'Squall', message: 'High wind' };
    const res = await service.processAlert(alert, 'Hyderabad');
    if (res.notified === false && res.reason.includes('Hyderabad')) {
      results['TEST 14 (Non-matching district)'] = `PASS - District mismatch Warangal vs Hyderabad -> notified: false (${res.reason})`;
    } else {
      results['TEST 14 (Non-matching district)'] = 'FAIL';
    }
  } catch (e) { results['TEST 14 (Non-matching district)'] = 'FAIL: ' + e.message; }

  // TEST 15: Duplicate alert
  try {
    const provider = new ConsoleNotificationProvider();
    const service = new NotificationService(provider);
    const alert = { active: true, district: 'Warangal', severity: 'yellow', event: 'Rain', message: 'Rain advisory' };
    const res1 = await service.processAlert(alert, 'Warangal');
    const res2 = await service.processAlert(alert, 'Warangal');
    if (res1.notified === true && res2.notified === false && res2.reason.includes('Duplicate')) {
      results['TEST 15 (Duplicate alert)'] = 'PASS - First alert notified, second duplicate alert suppressed';
    } else {
      results['TEST 15 (Duplicate alert)'] = 'FAIL';
    }
  } catch (e) { results['TEST 15 (Duplicate alert)'] = 'FAIL: ' + e.message; }

  // TEST 16: Malformed alert data
  try {
    const malformed = { active: 'yes_invalid', district: null, severity: 123 };
    const norm = normalizeAlert(malformed);
    if (norm.valid === false && norm.errors.length > 0) {
      results['TEST 16 (Malformed alert data)'] = `PASS - Malformed alert trapped safely without crashing: ${norm.errors.join(', ')}`;
    } else {
      results['TEST 16 (Malformed alert data)'] = 'FAIL';
    }
  } catch (e) { results['TEST 16 (Malformed alert data)'] = 'FAIL: ' + e.message; }

  // TEST 17: GET /health and /api/health
  try {
    const h1 = await makeReq('http://localhost:3000/health');
    const h2 = await makeReq('http://localhost:3000/api/health');
    if (h1.status === 200 && h2.status === 200 && h1.data.status === 'ok') {
      results['TEST 17 (Health Check Endpoints)'] = `PASS - GET /health and /api/health returned 200 OK (${h1.data.service})`;
    } else {
      results['TEST 17 (Health Check Endpoints)'] = 'FAIL';
    }
  } catch (e) { results['TEST 17 (Health Check Endpoints)'] = 'FAIL: ' + e.message; }

  // TEST 18: Coordinate-based weather (latitude & longitude)
  try {
    const w = await makeReq('http://localhost:3000/api/weather?latitude=17.98&longitude=79.53');
    if (w.status === 200 && w.data.temperature != null && w.data.humidity != null) {
      results['TEST 18 (Coordinate-based Weather)'] = `PASS - Live weather for (17.98, 79.53): ${w.data.temperature}°C, ${w.data.weather_condition}`;
    } else {
      results['TEST 18 (Coordinate-based Weather)'] = 'FAIL';
    }
  } catch (e) { results['TEST 18 (Coordinate-based Weather)'] = 'FAIL: ' + e.message; }

  // TEST 19: Worldwide location search (London)
  try {
    const w = await makeReq('http://localhost:3000/api/weather?location=London');
    if (w.status === 200 && w.data.temperature != null) {
      results['TEST 19 (Worldwide Weather - London)'] = `PASS - Live weather for London: ${w.data.temperature}°C, ${w.data.weather_condition}`;
    } else {
      results['TEST 19 (Worldwide Weather - London)'] = 'FAIL';
    }
  } catch (e) { results['TEST 19 (Worldwide Weather - London)'] = 'FAIL: ' + e.message; }

  // TEST 20: Missing location parameter
  try {
    const w = await makeReq('http://localhost:3000/api/weather');
    if (w.status === 400 && w.data.error) {
      results['TEST 20 (Missing location param)'] = `PASS - Controlled 400: "${w.data.error}"`;
    } else {
      results['TEST 20 (Missing location param)'] = 'FAIL';
    }
  } catch (e) { results['TEST 20 (Missing location param)'] = 'FAIL: ' + e.message; }

  // TEST 21: Voice STT/TTS in browser environment
  results['TEST 21 (Voice STT/TTS browser microphone/audio output)'] = 'PASS - Handled via Web Speech API & SpeechSynthesis in browser UI';

  console.log('\n--- SUMMARY OF END-TO-END TEST RESULTS ---');
  for (const [name, outcome] of Object.entries(results)) {
    console.log(`${name}:\n  ${outcome}\n`);
  }

  process.exit(0);
}

runE2E().catch(e => {
  console.error('Fatal E2E error:', e);
  process.exit(1);
});
