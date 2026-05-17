const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const appPort = process.env.FULL_CHAIN_APP_PORT || '3100';
const mockPort = process.env.FULL_CHAIN_MOCK_PORT || '3101';
const mockBaseURL = `http://127.0.0.1:${mockPort}`;
const projectRoot = path.resolve(__dirname, '../../..');
const fixturesRoot = path.join(projectRoot, 'tests/fixtures');

const ranklistInfo = require(path.join(fixturesRoot, 'ranklist-info.json'));
const srk = require(path.join(fixturesRoot, 'ranklist.srk.json'));
const statistics = require(path.join(fixturesRoot, 'statistics.json'));
const listall = require(path.join(fixturesRoot, 'listall.json'));
const collection = require(path.join(fixturesRoot, 'collection.json'));
const liveInfo = require(path.join(fixturesRoot, 'live-info.json'));

const requests = [];
let appProcess;
let cleanupWatcherProcess;
let shuttingDown = false;

function ok(data) {
  return { code: 0, message: 'success', data };
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    'access-control-allow-headers': 'content-type',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-origin': '*',
    'content-type': 'application/json',
  });
  res.end(JSON.stringify(body));
}

function routeRequest(req, res) {
  const url = new URL(req.url || '/', mockBaseURL);
  const method = req.method || 'GET';
  const requestRecord = { method, path: url.pathname, search: url.search };

  if (method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (method === 'GET' && url.pathname === '/__requests') {
    sendJson(res, 200, requests);
    return;
  }

  if (method === 'POST' && url.pathname === '/__reset') {
    requests.length = 0;
    sendJson(res, 200, { ok: true });
    return;
  }

  requests.push(requestRecord);

  if (method === 'GET' && url.pathname === '/rank/listall') {
    sendJson(res, 200, ok(listall));
    return;
  }

  if (method === 'GET' && url.pathname === '/rank/search') {
    sendJson(res, 200, ok(listall));
    return;
  }

  if (method === 'GET' && /^\/rank\/group\/[^/]+$/.test(url.pathname)) {
    if (url.pathname === '/rank/group/missing-collection') {
      sendJson(res, 200, { code: 11, message: 'Collection not found' });
      return;
    }

    sendJson(res, 200, ok({ content: JSON.stringify(collection) }));
    return;
  }

  if (method === 'GET' && /^\/rank\/[^/]+$/.test(url.pathname)) {
    if (url.pathname === '/rank/missing-key') {
      sendJson(res, 200, { code: 11, message: 'Ranklist not found' });
      return;
    }

    sendJson(res, 200, ok(ranklistInfo));
    return;
  }

  if (method === 'GET' && url.pathname === '/file/download') {
    sendJson(res, 200, srk);
    return;
  }

  if (method === 'GET' && url.pathname === '/statistics') {
    sendJson(res, 200, ok(statistics));
    return;
  }

  if (method === 'GET' && /^\/ranking\/config\/[^/]+$/.test(url.pathname)) {
    sendJson(res, 200, ok(liveInfo));
    return;
  }

  if (method === 'GET' && /^\/ranking\/[^/]+$/.test(url.pathname)) {
    sendJson(res, 200, ok(srk));
    return;
  }

  sendJson(res, 404, { code: 11, message: `No mock route for ${method} ${url.pathname}` });
}

const mockServer = http.createServer(routeRequest);

function startCleanupWatcher(appPid) {
  const watcherScript = `
const parentPid = Number(process.argv[1]);
const appPid = Number(process.argv[2]);
function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}
function killApp(signal) {
  try {
    if (process.platform === 'win32') {
      process.kill(appPid, signal);
    } else {
      process.kill(-appPid, signal);
    }
  } catch (error) {
    if (error.code !== 'ESRCH') {
      throw error;
    }
  }
}
const interval = setInterval(() => {
  if (isAlive(parentPid)) {
    return;
  }
  clearInterval(interval);
  killApp('SIGTERM');
  setTimeout(() => {
    if (isAlive(appPid)) {
      killApp('SIGKILL');
    }
    process.exit(0);
  }, 2000);
}, 250);
`;

  cleanupWatcherProcess = spawn(process.execPath, ['-e', watcherScript, String(process.pid), String(appPid)], {
    detached: true,
    stdio: 'ignore',
  });
  cleanupWatcherProcess.unref();
}

function stopAppProcess(signal) {
  if (!appProcess || appProcess.killed) {
    return;
  }

  if (process.platform === 'win32') {
    appProcess.kill(signal);
    return;
  }

  try {
    process.kill(-appProcess.pid, signal);
  } catch (error) {
    if (error.code !== 'ESRCH') {
      throw error;
    }
  }
}

function waitForAppExit(timeoutMs) {
  return new Promise((resolve) => {
    if (!appProcess || appProcess.exitCode !== null || appProcess.signalCode !== null) {
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      stopAppProcess('SIGKILL');
      resolve();
    }, timeoutMs);

    appProcess.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

function closeMockServer() {
  return new Promise((resolve) => {
    mockServer.close(() => resolve());
  });
}

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  stopAppProcess(signal);
  await waitForAppExit(2500);
  await closeMockServer();

  process.exit(signal === 'SIGINT' ? 130 : 0);
}

mockServer.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Mock backend failed to start: port ${mockPort} is already in use. Set FULL_CHAIN_MOCK_PORT to a free port.`);
    process.exit(1);
  }
  throw error;
});

mockServer.listen(Number(mockPort), '127.0.0.1', () => {
  appProcess = spawn('corepack', ['pnpm', 'run', 'dev:start'], {
    cwd: projectRoot,
    detached: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      RANKLAND_E2E_HEALTH: '1',
      RANKLAND_E2E_PROBE: '1',
      RANKLAND_E2E_SKIP_MONGO: '1',
      RANKLAND_E2E_SKIP_SOCKET: '1',
      SERVER_HOST: '127.0.0.1',
      SERVER_PORT: appPort,
      RANKLAND_API_BASE_SERVER: mockBaseURL,
      RANKLAND_CDN_API_BASE_SERVER: mockBaseURL,
      RANKLAND_API_BASE_CLIENT: mockBaseURL,
      RANKLAND_CDN_API_BASE_CLIENT: mockBaseURL,
    },
  });
  startCleanupWatcher(appProcess.pid);

  appProcess.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    mockServer.close(() => {
      process.exit(code || 1);
    });
  });
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
