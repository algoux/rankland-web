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
    sendJson(res, 200, ok({ content: JSON.stringify(collection) }));
    return;
  }

  if (method === 'GET' && /^\/rank\/[^/]+$/.test(url.pathname)) {
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

function shutdown(signal) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  if (appProcess && !appProcess.killed) {
    appProcess.kill(signal);
  }

  mockServer.close(() => {
    process.exit(signal === 'SIGINT' ? 130 : 0);
  });
}

mockServer.listen(Number(mockPort), '127.0.0.1', () => {
  appProcess = spawn('pnpm', ['run', 'dev:start'], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
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
