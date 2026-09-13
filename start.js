/**
 * WeatherGPT Unified Local Runner
 * Starts all required services in one command:
 *   - Backend Express API (:3000)
 *   - Multilingual LLM microservice (:8001)
 *   - Vite Frontend UI (:5173)
 *
 * Exposes ONE user-facing browser URL: http://localhost:5173
 */

const { spawn } = require('child_process');
const net = require('net');
const path = require('path');

const ROOT_DIR = __dirname;
const children = [];

function checkPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true); // Port is already occupied
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

function startProcess(name, command, args, cwd) {
  const child = spawn(command, args, {
    cwd: cwd || ROOT_DIR,
    stdio: 'pipe',
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  children.push(child);

  child.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (line.trim()) console.log(`[${name}] ${line}`);
    }
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (line.trim()) console.error(`[${name}] ${line}`);
    }
  });

  child.on('error', (err) => {
    console.error(`[${name}] Failed to start:`, err.message);
  });

  child.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.warn(`[${name}] Process exited with code ${code}`);
    }
  });

  return child;
}

async function main() {
  console.log('===========================================================');
  console.log('       WeatherGPT — AI Weather & Atmospheric Cockpit       ');
  console.log('===========================================================');

  // 1. Backend Server (:3000)
  const isBackendRunning = await checkPort(3000);
  if (isBackendRunning) {
    console.log('[BACKEND] Existing instance detected active on port 3000.');
  } else {
    console.log('[BACKEND] Launching Express server on port 3000...');
    startProcess('BACKEND', 'node', ['backend/server.js'], ROOT_DIR);
  }

  // 2. Python LLM Server (:8001)
  const isLLMRunning = await checkPort(8001);
  if (isLLMRunning) {
    console.log('[LLM]     Existing instance detected active on port 8001.');
  } else {
    console.log('[LLM]     Launching Python multilingual LLM microservice on port 8001...');
    startProcess('LLM', 'python', ['-m', 'llm.server'], ROOT_DIR);
  }

  // 3. Frontend Dev Server (:5173)
  const isFrontendRunning = await checkPort(5173);
  if (isFrontendRunning) {
    console.log('[FRONTEND] Existing instance detected active on port 5173.');
  } else {
    console.log('[FRONTEND] Launching Vite development server on port 5173...');
    startProcess('FRONTEND', 'npm', ['--prefix', 'frontend', 'run', 'dev'], ROOT_DIR);
  }

  console.log('-----------------------------------------------------------');
  console.log('✨ All WeatherGPT services are running!');
  console.log('👉 Open your browser at: http://localhost:5173');
  console.log('-----------------------------------------------------------');
  console.log('Press Ctrl+C to terminate all services.');
}

function cleanup() {
  console.log('\nStopping WeatherGPT services...');
  for (const child of children) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', child.pid, '/f', '/t']);
      } else {
        child.kill('SIGTERM');
      }
    } catch {
      // Ignore
    }
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

main().catch(console.error);
