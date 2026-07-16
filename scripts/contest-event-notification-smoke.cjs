#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const { promises: fsPromises } = fs;
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const mysql = require('mysql2/promise');
const Redis = require('ioredis');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const APP_ENTRY = path.join(PROJECT_ROOT, 'app/server/index.js');
const HEALTH_PATH = '/api/checkHealth';
const NOTIFICATION_CHANNEL_SUFFIX = 'contest-event-availability:v1';
const FAST_PATH_BUDGET_MS = 1_000;
const RECONCILE_BUDGET_MS = 6_000;
const SHUTDOWN_BUDGET_MS = 5_000;
const STARTUP_BUDGET_MS = 30_000;

if (process.env.RUN_NOTIFICATION_SMOKE !== 'true') {
  console.log('[notification-smoke] skipped (set RUN_NOTIFICATION_SMOKE=true to run)');
  process.exit(0);
}

const trackedChildren = new Set();
process.on('exit', () => {
  for (const handle of trackedChildren) {
    if (!handle.exitResult) {
      handle.child.kill('SIGKILL');
    }
  }
});

main().catch((error) => {
  console.error('[notification-smoke] failed:', error);
  process.exitCode = 1;
});

async function main() {
  await fsPromises.access(APP_ENTRY, fs.constants.R_OK).catch(() => {
    throw new Error(`Production server build is missing: ${APP_ENTRY}; run pnpm build first`);
  });

  const temporaryDirectory = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'rankland-contest-notification-smoke-'));
  const authToken = process.env.AUTH_TOKEN || `notification-smoke-${process.pid}`;
  const baseNamespace = requireNonBlankEnv('REDIS_NAMESPACE');
  const namespace = `${baseNamespace}:process-smoke:${Date.now().toString(36)}-${process.pid}`;
  const partitionNamespace = `${namespace}:partition`;
  const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: readPort(process.env.REDIS_PORT || '6379', 'REDIS_PORT'),
    db: readNonNegativeInteger(process.env.REDIS_DB || '0', 'REDIS_DB'),
    password: process.env.REDIS_PASS || undefined,
  };
  const mysqlConfig = {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: readPort(process.env.MYSQL_PORT || '3306', 'MYSQL_PORT'),
    user: process.env.MYSQL_USER || 'blue',
    password: process.env.MYSQL_PASS || 'test',
    database: process.env.MYSQL_DB || 'rankland',
    supportBigNumbers: true,
    bigNumberStrings: true,
  };

  const apps = [];
  const sseClients = [];
  let blackhole;
  let database;
  let redis;
  let contest;
  let nginxSse;

  try {
    database = await mysql.createConnection(mysqlConfig);
    redis = new Redis({
      ...redisConfig,
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 1_000,
    });
    await redis.connect();
    contest = await seedContest(database);

    const sharedEnvironment = childEnvironment({
      authToken,
      namespace,
      mysqlConfig,
      redisConfig,
      fsBasePath: path.join(temporaryDirectory, 'files'),
    });
    await fsPromises.mkdir(sharedEnvironment.FS_BASE_PATH, { recursive: true });

    const appA = await startApp('app-a', await getFreePort(), sharedEnvironment);
    const appB = await startApp('app-b', await getFreePort(), sharedEnvironment);
    apps.push(appA, appB);

    const mainChannel = `${namespace}:${NOTIFICATION_CHANNEL_SUFFIX}`;
    const partitionChannel = `${partitionNamespace}:${NOTIFICATION_CHANNEL_SUFFIX}`;
    await waitForSubscriberCounts(redis, { [mainChannel]: 2 }, STARTUP_BUDGET_MS);

    const bSse = await SseClient.connect(appB.port, contest.uk);
    sseClients.push(bSse);
    assertSseHeaders(bSse.headers);
    const initialB = await waitForWatermark(bSse, 1, 0, 5_000);
    assert.equal(initialB.data.uk, contest.uk);
    await waitFor(() => bSse.retryValues.includes(1_000), 2_000, 'SSE retry: 1000 frame');

    const aSse = await SseClient.connect(appA.port, contest.uk);
    sseClients.push(aSse);
    assertSseHeaders(aSse.headers);
    await waitForWatermark(aSse, 1, 0, 5_000);

    const nginxBinary = await resolveNginxBinary();
    if (nginxBinary) {
      const nginx = await startNginx(
        nginxBinary,
        await getFreePort(),
        [appA.port, appB.port],
        path.join(temporaryDirectory, 'nginx'),
      );
      apps.push(nginx);
      nginxSse = await SseClient.connect(nginx.port, contest.uk);
      sseClients.push(nginxSse);
      assertSseHeaders(nginxSse.headers);
      await waitForWatermark(nginxSse, 1, 0, 5_000);
      await waitFor(() => nginxSse.retryValues.includes(1_000), 2_000, 'nginx SSE retry: 1000 frame');
    }

    const a1StartedAt = performance.now();
    const firstAppend = await appendEvent(appA.port, contest.uk, authToken, 1);
    assert.equal(firstAppend.data.lastEventId, 1);
    const firstLocalWatermark = await waitForWatermark(aSse, 1, 1, FAST_PATH_BUDGET_MS);
    const firstRemoteWatermark = await waitForWatermark(bSse, 1, 1, FAST_PATH_BUDGET_MS);
    const a1ElapsedMs = firstLocalWatermark.receivedAt - a1StartedAt;
    const a3ElapsedMs = firstRemoteWatermark.receivedAt - a1StartedAt;
    assert.ok(
      a1ElapsedMs <= FAST_PATH_BUDGET_MS,
      `A1 local watermark took ${formatMilliseconds(a1ElapsedMs)}, budget is ${FAST_PATH_BUDGET_MS}ms`,
    );
    assert.ok(
      a3ElapsedMs <= FAST_PATH_BUDGET_MS,
      `A3 remote watermark took ${formatMilliseconds(a3ElapsedMs)}, budget is ${FAST_PATH_BUDGET_MS}ms`,
    );
    console.log(`[notification-smoke] A1 local post-commit fan-out: ${formatMilliseconds(a1ElapsedMs)}`);
    console.log(`[notification-smoke] A3 Redis cross-process fan-out: ${formatMilliseconds(a3ElapsedMs)}`);

    const barrierPath = path.join(temporaryDirectory, 'commit-before-publish-barrier.json');
    const appD = await startApp('app-d-barrier', await getFreePort(), {
      ...sharedEnvironment,
      RANKLAND_ENABLE_TEST_HOOKS: 'true',
      RANKLAND_TEST_CONTEST_NOTIFICATION_BARRIER_FILE: barrierPath,
    });
    apps.push(appD);
    await waitForSubscriberCounts(redis, { [mainChannel]: 3 }, STARTUP_BUDGET_MS);

    const interruptedAppend = appendEvent(appD.port, contest.uk, authToken, 2, 30_000).then(
      () => ({ completed: true }),
      (error) => ({ completed: false, error }),
    );
    await waitForFile(barrierPath, 10_000);
    const barrierWatermark = JSON.parse(await fsPromises.readFile(barrierPath, 'utf8'));
    assert.deepEqual(
      {
        contestId: barrierWatermark.contestId,
        latestEventId: barrierWatermark.latestEventId,
        streamRevision: barrierWatermark.streamRevision,
      },
      { contestId: contest.id, latestEventId: 2, streamRevision: 1 },
    );
    const a7ObservedCommitAt = performance.now();
    appD.child.kill('SIGKILL');
    await waitForAppExit(appD, 3_000);
    const interruptedResult = await interruptedAppend;
    assert.equal(interruptedResult.completed, false, 'barrier append must be interrupted with its writer process');
    const reconciledAfterKill = await waitForWatermark(bSse, 1, 2, RECONCILE_BUDGET_MS);
    const a7ElapsedMs = Math.max(0, reconciledAfterKill.receivedAt - a7ObservedCommitAt);
    assert.ok(
      a7ElapsedMs <= RECONCILE_BUDGET_MS,
      `A7 reconciliation took ${formatMilliseconds(a7ElapsedMs)}, budget is ${RECONCILE_BUDGET_MS}ms`,
    );
    await waitForSubscriberCounts(redis, { [mainChannel]: 2 }, 5_000);
    console.log(`[notification-smoke] A7 commit-to-publish writer death recovery: ${formatMilliseconds(a7ElapsedMs)}`);

    const appC = await startApp('app-c-partitioned-namespace', await getFreePort(), {
      ...sharedEnvironment,
      REDIS_NAMESPACE: partitionNamespace,
    });
    apps.push(appC);
    await waitForSubscriberCounts(redis, { [mainChannel]: 2, [partitionChannel]: 1 }, STARTUP_BUDGET_MS);
    const cSse = await SseClient.connect(appC.port, contest.uk);
    sseClients.push(cSse);
    await waitForWatermark(cSse, 1, 2, 5_000);

    const a17StartedAt = performance.now();
    const thirdAppend = await appendEvent(appA.port, contest.uk, authToken, 3);
    assert.equal(thirdAppend.data.lastEventId, 3);
    const partitionReconciled = await waitForWatermark(cSse, 1, 3, RECONCILE_BUDGET_MS);
    const a17ElapsedMs = partitionReconciled.receivedAt - a17StartedAt;
    assert.ok(
      a17ElapsedMs <= RECONCILE_BUDGET_MS,
      `A17 namespace-partition reconciliation took ${formatMilliseconds(
        a17ElapsedMs,
      )}, budget is ${RECONCILE_BUDGET_MS}ms`,
    );
    assert.deepEqual(
      await readSubscriberCounts(redis, [mainChannel, partitionChannel]),
      { [mainChannel]: 2, [partitionChannel]: 1 },
      'the partitioned app must only subscribe to its own namespace channel',
    );
    console.log(`[notification-smoke] A17 namespace mismatch recovery: ${formatMilliseconds(a17ElapsedMs)}`);

    blackhole = await createTcpBlackhole();
    const appE = await startApp('app-e-redis-blackhole', await getFreePort(), {
      ...sharedEnvironment,
      REDIS_PORT: String(blackhole.port),
      REDIS_NAMESPACE: `${namespace}:blackhole`,
    });
    apps.push(appE);
    const eSse = await SseClient.connect(appE.port, contest.uk);
    sseClients.push(eSse);
    await waitForWatermark(eSse, 1, 3, 5_000);

    const a2StartedAt = performance.now();
    const blackholeAppend = await appendEvent(appE.port, contest.uk, authToken, 4);
    assert.equal(blackholeAppend.data.lastEventId, 4);
    const blackholeLocalWatermark = await waitForWatermark(eSse, 1, 4, FAST_PATH_BUDGET_MS);
    const a2ElapsedMs = blackholeLocalWatermark.receivedAt - a2StartedAt;
    assert.ok(
      a2ElapsedMs <= FAST_PATH_BUDGET_MS,
      `A2 Redis-blackhole local watermark took ${formatMilliseconds(a2ElapsedMs)}, budget is ${FAST_PATH_BUDGET_MS}ms`,
    );
    console.log(`[notification-smoke] A2 Redis-blackhole local fan-out: ${formatMilliseconds(a2ElapsedMs)}`);

    const a16StartedAt = performance.now();
    appE.child.kill('SIGTERM');
    await waitForAppExit(appE, SHUTDOWN_BUDGET_MS);
    const a16ElapsedMs = performance.now() - a16StartedAt;
    assert.ok(
      a16ElapsedMs <= SHUTDOWN_BUDGET_MS,
      `A16 blackhole shutdown took ${formatMilliseconds(a16ElapsedMs)}, budget is ${SHUTDOWN_BUDGET_MS}ms`,
    );
    console.log(`[notification-smoke] A16 Redis-blackhole graceful shutdown: ${formatMilliseconds(a16ElapsedMs)}`);

    await waitFor(
      () => bSse.comments.some((comment) => comment.value.trim() === 'heartbeat'),
      17_000,
      '15-second heartbeat comment',
    );
    assert.equal(
      aSse.events.filter((event) => event.data.streamRevision === 1 && event.data.latestEventId === 1).length,
      1,
      'A must not emit a duplicate frame for the local/Redis-self-echo/reconcile copies of one watermark',
    );
    assert.equal(aSse.parseErrors.length, 0, 'all local SSE frames must be parseable');
    assert.equal(bSse.parseErrors.length, 0, 'all SSE frames must be parseable');
    console.log('[notification-smoke] SSE headers, retry, heartbeat, and self-echo deduplication: passed');

    if (nginxSse) {
      await waitForWatermark(nginxSse, 1, 3, 2_000);
      await waitFor(
        () => nginxSse.comments.some((comment) => comment.value.trim() === 'heartbeat'),
        17_000,
        'heartbeat through nginx with proxy buffering disabled',
      );
      assert.equal(nginxSse.parseErrors.length, 0);
      console.log('[notification-smoke] actual nginx upstream headers and unbuffered heartbeat: passed');
    }

    assert.equal(bSse.closed, false, 'B SSE must remain open before soft deletion');
    const softDeleteStartedAt = performance.now();
    await database.execute('UPDATE `contest` SET `deleted_at` = UTC_TIMESTAMP(6) WHERE `id` = ?', [contest.id]);
    await waitFor(() => bSse.closed, RECONCILE_BUDGET_MS, 'soft-deleted contest SSE closure');
    const softDeleteElapsedMs = bSse.closedAt - softDeleteStartedAt;
    assert.ok(softDeleteElapsedMs <= RECONCILE_BUDGET_MS);
    console.log(
      `[notification-smoke] soft-delete reconciliation closes SSE: ${formatMilliseconds(softDeleteElapsedMs)}`,
    );

    console.log('[notification-smoke] all multi-process checks passed');
  } catch (error) {
    const logs = apps.map(formatAppLogs).filter(Boolean).join('\n');
    if (logs) {
      console.error(logs);
    }
    throw error;
  } finally {
    for (const client of sseClients) {
      client.close();
    }
    for (const app of [...apps].reverse()) {
      await stopApp(app).catch(() => undefined);
    }
    if (blackhole) {
      await blackhole.close().catch(() => undefined);
    }
    if (redis) {
      redis.disconnect(false);
    }
    if (database && contest) {
      await deleteContest(database, contest.id).catch((error) => {
        console.error('[notification-smoke] contest cleanup failed:', safeErrorMessage(error));
      });
    }
    await database?.end().catch(() => undefined);
    await fsPromises.rm(temporaryDirectory, { recursive: true, force: true }).catch(() => undefined);
  }
}

function childEnvironment({ authToken, namespace, mysqlConfig, redisConfig, fsBasePath }) {
  const environment = {
    ...process.env,
    NODE_ENV: 'production',
    SERVER_HOST: '127.0.0.1',
    AUTH_TOKEN: authToken,
    FILE_PROVIDER: 'FS',
    FS_BASE_PATH: fsBasePath,
    MYSQL_HOST: mysqlConfig.host,
    MYSQL_PORT: String(mysqlConfig.port),
    MYSQL_DB: mysqlConfig.database,
    MYSQL_USER: mysqlConfig.user,
    MYSQL_PASS: mysqlConfig.password,
    REDIS_HOST: redisConfig.host,
    REDIS_PORT: String(redisConfig.port),
    REDIS_DB: String(redisConfig.db),
    REDIS_PASS: redisConfig.password || '',
    REDIS_NAMESPACE: namespace,
  };
  delete environment.SNOWFLAKE_WORKER_ID;
  delete environment.RANKLAND_ENABLE_TEST_HOOKS;
  delete environment.RANKLAND_TEST_CONTEST_NOTIFICATION_BARRIER_FILE;
  return environment;
}

async function seedContest(database) {
  const now = Date.now();
  const id = (BigInt(now) * 4_194_304n + BigInt(process.pid % 4_194_304)).toString();
  const uk = `notification-smoke-${now.toString(36)}-${process.pid}`;
  await database.beginTransaction();
  try {
    await database.execute(
      `INSERT INTO \`contest\`
        (\`id\`, \`uk\`, \`name\`, \`title\`, \`start_at\`, \`duration_s\`, \`frozen_duration_s\`,
         \`problems\`, \`markers\`, \`series\`, \`view_count\`)
       VALUES (?, ?, ?, ?, UTC_TIMESTAMP(), 3600, NULL, ?, ?, ?, 0)`,
      [id, uk, uk, JSON.stringify({ fallback: uk }), '[]', '[]', '[]'],
    );
    await database.execute(
      'INSERT INTO `contest_event_stream` (`contest_id`, `last_event_id`, `stream_revision`) VALUES (?, 0, 1)',
      [id],
    );
    await database.commit();
    return { id, uk };
  } catch (error) {
    await database.rollback();
    throw error;
  }
}

async function deleteContest(database, contestId) {
  await database.beginTransaction();
  try {
    await database.execute('DELETE FROM `contest_event` WHERE `contest_id` = ?', [contestId]);
    await database.execute('DELETE FROM `contest_event_stream` WHERE `contest_id` = ?', [contestId]);
    await database.execute('DELETE FROM `contest` WHERE `id` = ?', [contestId]);
    await database.commit();
  } catch (error) {
    await database.rollback();
    throw error;
  }
}

async function startApp(name, port, environment) {
  const child = spawn(process.execPath, ['--unhandled-rejections=warn', APP_ENTRY], {
    cwd: PROJECT_ROOT,
    env: { ...environment, SERVER_PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const handle = trackChildProcess(name, port, child);
  await waitFor(
    async () => {
      if (handle.exitResult) {
        throw new Error(`${name} exited during startup (${describeExit(handle.exitResult)})`);
      }
      try {
        const response = await requestJson({ port, path: HEALTH_PATH, timeoutMs: 1_000 });
        return response.statusCode === 200;
      } catch (_error) {
        return false;
      }
    },
    STARTUP_BUDGET_MS,
    `${name} health check`,
  );
  return handle;
}

function trackChildProcess(name, port, child) {
  const handle = {
    name,
    port,
    child,
    logs: '',
    exitResult: undefined,
    exitPromise: undefined,
  };
  handle.exitPromise = new Promise((resolve) => {
    child.once('exit', (code, signal) => {
      handle.exitResult = { code, signal };
      trackedChildren.delete(handle);
      resolve(handle.exitResult);
    });
    child.once('error', (error) => {
      appendLog(handle, 'spawn', safeErrorMessage(error));
    });
  });
  child.stdout.on('data', (chunk) => appendLog(handle, 'stdout', chunk.toString('utf8')));
  child.stderr.on('data', (chunk) => appendLog(handle, 'stderr', chunk.toString('utf8')));
  trackedChildren.add(handle);
  return handle;
}

async function resolveNginxBinary() {
  if (process.env.RUN_NGINX_NOTIFICATION_SMOKE !== 'true' && !process.env.NGINX_BIN) {
    console.log('[notification-smoke] nginx check skipped (set RUN_NGINX_NOTIFICATION_SMOKE=true)');
    return undefined;
  }
  const candidates = [
    process.env.NGINX_BIN,
    '/opt/homebrew/bin/nginx',
    '/usr/local/bin/nginx',
    '/usr/sbin/nginx',
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      await fsPromises.access(candidate, fs.constants.X_OK);
      return candidate;
    } catch (_error) {
      // Try the next known location.
    }
  }
  throw new Error('nginx smoke was requested but no executable nginx binary was found; set NGINX_BIN');
}

async function startNginx(binary, port, upstreamPorts, directory) {
  await fsPromises.mkdir(directory, { recursive: true });
  const configPath = path.join(directory, 'nginx.conf');
  const upstreamServers = upstreamPorts.map((upstreamPort) => `        server 127.0.0.1:${upstreamPort};`).join('\n');
  await fsPromises.writeFile(
    configPath,
    `worker_processes 1;
error_log stderr notice;
pid ${quoteNginxValue(path.join(directory, 'nginx.pid'))};

events {
    worker_connections 128;
}

http {
    access_log off;
    upstream rankland_notification_smoke {
${upstreamServers}
    }
    server {
        listen 127.0.0.1:${port};
        location /api/v2/public/contests/ {
            proxy_pass http://rankland_notification_smoke;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            proxy_buffering off;
            proxy_cache off;
            proxy_pass_header X-Accel-Buffering;
            proxy_read_timeout 75s;
        }
    }
}
`,
    'utf8',
  );
  const child = spawn(binary, ['-e', 'stderr', '-p', `${directory}/`, '-c', configPath, '-g', 'daemon off;'], {
    cwd: PROJECT_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const handle = trackChildProcess('nginx-upstream', port, child);
  await waitFor(
    async () => {
      if (handle.exitResult) {
        throw new Error(
          `nginx-upstream exited during startup (${describeExit(handle.exitResult)}): ${redactSecrets(handle.logs)}`,
        );
      }
      return canConnectTcp(port);
    },
    5_000,
    'nginx upstream listener',
  );
  return handle;
}

function quoteNginxValue(value) {
  return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

function canConnectTcp(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    socket.setTimeout(300);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => resolve(false));
  });
}

async function stopApp(handle) {
  if (handle.exitResult) {
    return handle.exitResult;
  }
  handle.child.kill('SIGTERM');
  try {
    return await waitForAppExit(handle, SHUTDOWN_BUDGET_MS);
  } catch (_error) {
    handle.child.kill('SIGKILL');
    return waitForAppExit(handle, 2_000);
  }
}

async function waitForAppExit(handle, timeoutMs) {
  if (handle.exitResult) {
    return handle.exitResult;
  }
  return withTimeout(handle.exitPromise, timeoutMs, `${handle.name} process exit`);
}

function appendLog(handle, stream, value) {
  handle.logs += `[${stream}] ${value}`;
  if (handle.logs.length > 64 * 1024) {
    handle.logs = handle.logs.slice(-64 * 1024);
  }
}

function formatAppLogs(handle) {
  if (!handle.logs) {
    return '';
  }
  return `--- ${handle.name} (${describeExit(handle.exitResult)}) ---\n${redactSecrets(handle.logs)}`;
}

function redactSecrets(value) {
  let redacted = value;
  for (const secret of [process.env.AUTH_TOKEN, process.env.MYSQL_PASS, process.env.REDIS_PASS]) {
    if (secret) {
      redacted = redacted.split(secret).join('<redacted>');
    }
  }
  return redacted;
}

function describeExit(exitResult) {
  if (!exitResult) {
    return 'running';
  }
  return exitResult.signal ? `signal=${exitResult.signal}` : `code=${exitResult.code}`;
}

async function appendEvent(port, uk, authToken, eventId, timeoutMs = 10_000) {
  const response = await requestJson({
    port,
    path: `/api/v2/contests/${encodeURIComponent(uk)}/events`,
    method: 'POST',
    timeoutMs,
    headers: {
      'x-token': authToken,
      'x-producer-id': 'notification-smoke-producer',
    },
    body: {
      streamRevision: 1,
      events: [
        {
          eventId,
          type: 'NEW_SOLUTION',
          newSolutionData: {
            solutionId: 10_000 + eventId,
            userId: `notification-smoke-user-${eventId}`,
            problemAlias: 'A',
            time: { value: String(eventId), unit: 'S' },
          },
        },
      ],
    },
  });
  assert.equal(response.statusCode, 200, `append event ${eventId} returned HTTP ${response.statusCode}`);
  assert.equal(response.data?.success, true, `append event ${eventId} did not return a success envelope`);
  return { ...response, data: response.data.data };
}

function requestJson({ port, path: requestPath, method = 'GET', headers = {}, body, timeoutMs = 5_000 }) {
  return new Promise((resolve, reject) => {
    const bodyBytes = body === undefined ? undefined : Buffer.from(JSON.stringify(body));
    const request = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: requestPath,
        method,
        headers: {
          Accept: 'application/json',
          ...(bodyBytes ? { 'Content-Type': 'application/json', 'Content-Length': String(bodyBytes.length) } : {}),
          ...headers,
        },
      },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        response.on('end', () => {
          const rawBody = Buffer.concat(chunks).toString('utf8');
          let data;
          try {
            data = rawBody ? JSON.parse(rawBody) : undefined;
          } catch (error) {
            reject(new Error(`Invalid JSON from ${method} ${requestPath}: ${safeErrorMessage(error)}`));
            return;
          }
          resolve({ statusCode: response.statusCode, headers: response.headers, data, rawBody });
        });
      },
    );
    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error(`${method} ${requestPath} timed out after ${timeoutMs}ms`));
    });
    request.on('error', reject);
    if (bodyBytes) {
      request.write(bodyBytes);
    }
    request.end();
  });
}

class SseClient {
  constructor(request, response) {
    this.request = request;
    this.response = response;
    this.headers = response.headers;
    this.buffer = '';
    this.events = [];
    this.comments = [];
    this.retryValues = [];
    this.parseErrors = [];
    this.closed = false;
    this.closedAt = undefined;

    response.on('data', (chunk) => this.consume(chunk.toString('utf8')));
    response.once('end', () => this.markClosed());
    response.once('aborted', () => this.markClosed());
    response.once('close', () => this.markClosed());
    response.once('error', () => this.markClosed());
  }

  static connect(port, uk) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const request = http.request({
        hostname: '127.0.0.1',
        port,
        path: `/api/v2/public/contests/${encodeURIComponent(uk)}/event-stream/notifications`,
        headers: { Accept: 'text/event-stream' },
      });
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          request.destroy();
          reject(new Error(`SSE connection to port ${port} timed out`));
        }
      }, 10_000);
      request.once('response', (response) => {
        if (settled) {
          response.destroy();
          return;
        }
        if (response.statusCode !== 200) {
          settled = true;
          clearTimeout(timer);
          response.resume();
          reject(new Error(`SSE connection to port ${port} returned HTTP ${response.statusCode}`));
          return;
        }
        settled = true;
        clearTimeout(timer);
        resolve(new SseClient(request, response));
      });
      request.once('error', (error) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(error);
        }
      });
      request.end();
    });
  }

  consume(chunk) {
    this.buffer += chunk;
    let boundary;
    while ((boundary = this.buffer.indexOf('\n\n')) >= 0) {
      const frame = this.buffer.slice(0, boundary);
      this.buffer = this.buffer.slice(boundary + 2);
      this.consumeFrame(frame);
    }
  }

  consumeFrame(frame) {
    let eventName;
    const dataLines = [];
    for (const rawLine of frame.split('\n')) {
      const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
      if (line.startsWith(':')) {
        this.comments.push({ value: line.slice(1).trimStart(), receivedAt: performance.now() });
      } else if (line.startsWith('retry:')) {
        const retry = Number(line.slice('retry:'.length).trim());
        if (Number.isInteger(retry)) {
          this.retryValues.push(retry);
        }
      } else if (line.startsWith('event:')) {
        eventName = line.slice('event:'.length).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice('data:'.length).trimStart());
      }
    }
    if (!eventName && dataLines.length === 0) {
      return;
    }
    try {
      this.events.push({
        event: eventName || 'message',
        data: JSON.parse(dataLines.join('\n')),
        receivedAt: performance.now(),
      });
    } catch (error) {
      this.parseErrors.push(safeErrorMessage(error));
    }
  }

  markClosed() {
    if (!this.closed) {
      this.closed = true;
      this.closedAt = performance.now();
    }
  }

  close() {
    this.response?.destroy();
    this.request?.destroy();
    this.markClosed();
  }
}

function assertSseHeaders(headers) {
  assert.match(String(headers['content-type']), /^text\/event-stream;\s*charset=utf-8$/i);
  assert.equal(headers['cache-control'], 'no-cache, no-transform');
  assert.equal(headers.connection, 'keep-alive');
  assert.equal(headers['x-accel-buffering'], 'no');
}

async function waitForWatermark(client, streamRevision, latestEventId, timeoutMs) {
  return waitFor(
    () =>
      client.events.find(
        (item) =>
          item.event === 'events-available' &&
          item.data.streamRevision === streamRevision &&
          item.data.latestEventId === latestEventId,
      ),
    timeoutMs,
    `SSE watermark revision=${streamRevision} latestEventId=${latestEventId}`,
  );
}

async function readSubscriberCounts(redis, channels) {
  const raw = await redis.pubsub('NUMSUB', ...channels);
  const counts = {};
  for (let index = 0; index < raw.length; index += 2) {
    counts[String(raw[index])] = Number(raw[index + 1]);
  }
  return counts;
}

async function waitForSubscriberCounts(redis, expected, timeoutMs) {
  const channels = Object.keys(expected);
  return waitFor(
    async () => {
      const actual = await readSubscriberCounts(redis, channels);
      return channels.every((channel) => actual[channel] === expected[channel]) ? actual : false;
    },
    timeoutMs,
    `Redis subscriber counts ${JSON.stringify(expected)}`,
  );
}

async function waitForFile(filePath, timeoutMs) {
  return waitFor(
    async () => {
      try {
        await fsPromises.access(filePath, fs.constants.R_OK);
        return true;
      } catch (_error) {
        return false;
      }
    },
    timeoutMs,
    `file ${filePath}`,
  );
}

async function waitFor(predicate, timeoutMs, description) {
  const deadline = performance.now() + timeoutMs;
  let lastError;
  while (performance.now() <= deadline) {
    try {
      const result = await predicate();
      if (result) {
        return result;
      }
    } catch (error) {
      lastError = error;
      if (/exited during startup/.test(safeErrorMessage(error))) {
        throw error;
      }
    }
    await delay(20);
  }
  throw new Error(
    `Timed out after ${timeoutMs}ms waiting for ${description}` + (lastError ? `: ${safeErrorMessage(lastError)}` : ''),
  );
}

function withTimeout(promise, timeoutMs, description) {
  let timer;
  const timeout = new Promise((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms waiting for ${description}`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function getFreePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  const port = address.port;
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  return port;
}

async function createTcpBlackhole() {
  const sockets = new Set();
  const server = net.createServer((socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;
  return {
    port,
    async close() {
      for (const socket of sockets) {
        socket.destroy();
      }
      await new Promise((resolve) => server.close(() => resolve()));
    },
  };
}

function readPort(value, name) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new RangeError(`${name} must be an integer between 1 and 65535`);
  }
  return port;
}

function readNonNegativeInteger(value, name) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new RangeError(`${name} must be a non-negative integer`);
  }
  return parsed;
}

function requireNonBlankEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required when RUN_NOTIFICATION_SMOKE=true`);
  }
  return value;
}

function formatMilliseconds(value) {
  return `${Math.max(0, value).toFixed(1)}ms`;
}

function safeErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
