/**
 * LLM Service — Integration Interface
 * 
 * Connects the Node.js backend to the Python multilingual LLM intelligence layer (llm/service.py).
 * 
 * Strategy:
 * 1. Primary: Fast HTTP microservice call to LLM_SERVICE_URL (default: http://127.0.0.1:8001/ask).
 * 2. Fallback: Direct Python invocation via `python -m llm.runner` child process.
 * 3. Safe Guardrail: Clean deterministic template answer if Python runtime is unavailable.
 */

const { spawn } = require('child_process');
const path = require('path');

const LLM_SERVICE_URL = process.env.LLM_SERVICE_URL || 'http://127.0.0.1:8001/ask';

/**
 * Generate an answer to a weather-related question using weather context.
 * 
 * @param {Object} params
 * @param {string} params.question  - User's natural-language question
 * @param {Object} params.weather   - Weather data (shared schema)
 * @param {Object} params.imdAlert  - IMD alert data
 * @param {string} params.language  - Response language code (e.g., 'en', 'hi', 'te')
 * @returns {Promise<{answer: string, language: string}>}
 */
async function generateAnswer({ question, weather, imdAlert, language = 'en' }) {
  const payload = {
    question: (question || '').trim(),
    weather_data: {
      ...weather,
      imd_alert: imdAlert || weather.imd_alert || { active: false }
    },
    location: weather.location,
    language: language || 'en'
  };

  // Attempt 1: Call LLM HTTP service if running
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(LLM_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'close'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.answer) {
        return {
          answer: data.answer,
          language: data.language || language
        };
      }
    }
  } catch (httpErr) {
    // HTTP service not running or timed out — proceed to CLI runner fallback
  }

  // Attempt 2: Direct Python process execution
  try {
    const result = await invokePythonRunner(payload);
    if (result && result.answer) {
      return {
        answer: result.answer,
        language: result.language || language
      };
    }
  } catch (cliErr) {
    console.warn('Direct Python LLM invocation failed:', cliErr.message);
  }

  // Attempt 3: Deterministic Data-grounded Fallback (conforming to shared/api-contract.md)
  const condition = weather.weather_condition || 'Clear';
  const temp = weather.temperature != null ? `${weather.temperature}°C` : 'N/A';
  const rainProb = weather.rain_probability != null ? `${weather.rain_probability}%` : 'N/A';
  const hasAlert = imdAlert && imdAlert.active;

  let fallbackAnswer = `Current weather in ${weather.location} is ${condition} with a temperature of ${temp} and rain probability of ${rainProb}.`;
  if (hasAlert) {
    fallbackAnswer += ` Note: An active ${imdAlert.severity.toUpperCase()} alert is in effect: ${imdAlert.event || imdAlert.message}.`;
  }

  return {
    answer: fallbackAnswer,
    language: language || 'en'
  };
}

/**
 * Helper to invoke Python CLI runner with UTF-8 encoding
 */
function invokePythonRunner(payload) {
  return new Promise((resolve, reject) => {
    const repoRoot = path.resolve(__dirname, '..', '..');
    const pyProcess = spawn('python', ['-m', 'llm.runner'], {
      cwd: repoRoot,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    let stdout = '';
    let stderr = '';

    pyProcess.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf-8');
    });

    pyProcess.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf-8');
    });

    pyProcess.on('close', (code) => {
      if (code === 0 && stdout.trim()) {
        try {
          const parsed = JSON.parse(stdout.trim());
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Failed to parse LLM JSON: ${e.message}`));
        }
      } else {
        reject(new Error(`Python process exited with code ${code}: ${stderr}`));
      }
    });

    pyProcess.on('error', (err) => {
      reject(err);
    });

    pyProcess.stdin.write(JSON.stringify(payload));
    pyProcess.stdin.end();
  });
}

module.exports = { generateAnswer };
