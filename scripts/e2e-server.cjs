/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn, spawnSync } = require('child_process');
const { createHash } = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const mysql = require('mysql2/promise');
const { fixtures } = require('./e2e-mock-rankland-api.cjs');
const {
  rankland_live_contest_client: liveClientProto,
  rankland_live_contest_common: liveCommonProto,
} = require('../src/common/proto/rankland_live_contest.js');

const E2E_DATABASE = 'rankland_e2e';
const database = process.env.MYSQL_DB;
if (database !== E2E_DATABASE) {
  throw new Error(`Refusing to reset non-E2E schema: ${database || '<unset>'}`);
}

const serverPort = process.env.SERVER_PORT || '4321';
const fileBasePath = path.join(os.tmpdir(), `rankland-web-e2e-${serverPort}`);
if (path.dirname(fileBasePath) !== os.tmpdir() || !path.basename(fileBasePath).startsWith('rankland-web-e2e-')) {
  throw new Error(`Refusing to use unsafe E2E file path: ${fileBasePath}`);
}

const serverEnv = {
  ...process.env,
  FILE_PROVIDER: 'FS',
  FILE_BASE_URL: '/file/',
  FS_BASE_PATH: fileBasePath,
};

main().catch((error) => {
  console.error('[e2e-server] setup failed:', error);
  process.exit(1);
});

async function main() {
  fs.rmSync(fileBasePath, { recursive: true, force: true });
  fs.mkdirSync(fileBasePath, { recursive: true });

  await resetSchema();
  runMigrations();
  await seedFixtures();

  const child = spawn(process.execPath, ['--unhandled-rejections=warn', 'app/server/index.js'], {
    cwd: path.join(__dirname, '..'),
    env: serverEnv,
    stdio: 'inherit',
  });

  let forwardedSignal;
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      forwardedSignal = signal;
      child.kill(signal);
    });
  }

  child.on('exit', (code, signal) => {
    fs.rmSync(fileBasePath, { recursive: true, force: true });
    if (forwardedSignal || signal) {
      process.exit(0);
    }
    process.exit(code ?? 1);
  });
}

function mysqlOptions(includeDatabase = false) {
  return {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'blue',
    password: process.env.MYSQL_PASS || 'test',
    ...(includeDatabase ? { database: E2E_DATABASE } : {}),
    timezone: 'Z',
    supportBigNumbers: true,
    bigNumberStrings: true,
  };
}

async function resetSchema() {
  const connection = await mysql.createConnection(mysqlOptions());
  try {
    await connection.query(`DROP DATABASE IF EXISTS \`${E2E_DATABASE}\``);
    await connection.query(`CREATE DATABASE \`${E2E_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  } finally {
    await connection.end();
  }
}

function runMigrations() {
  const result = spawnSync(
    process.execPath,
    [
      '--require',
      './app/server/register-module-aliases.js',
      './node_modules/typeorm/cli.js',
      'migration:run',
      '-d',
      './app/server/database/typeorm-cli-data-source.js',
    ],
    {
      cwd: path.join(__dirname, '..'),
      env: serverEnv,
      stdio: 'inherit',
    },
  );
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`E2E migrations exited with status ${result.status}`);
  }
}

async function seedFixtures() {
  const connection = await mysql.createConnection(mysqlOptions(true));
  try {
    const contests = buildContestSeeds();
    for (const [index, contest] of contests.entries()) {
      const contestId = String(1001 + index);
      const fileId = String(2001 + index);
      const ranklist = ranklistFor(contest.uk);
      const fileName = `${contest.uk}.srk.json`;
      const filePath = `${fileId}/${fileName}`;
      const body = Buffer.from(JSON.stringify(ranklist));
      const createdAt = contest.createdAt || '2024-01-01 00:00:00.000000';
      const updatedAt = contest.updatedAt || createdAt;

      fs.mkdirSync(path.join(fileBasePath, fileId), { recursive: true });
      fs.writeFileSync(path.join(fileBasePath, filePath), body);

      await connection.execute(
        `INSERT INTO contest (
          id, uk, name, title, start_at, duration_s, frozen_duration_s, banner, ref_links,
          problems, markers, series, sorter, contributors, srk_file_id, view_count, redirect_uk,
          created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          contestId,
          contest.uk,
          contest.name,
          JSON.stringify({ fallback: contest.name }),
          '2024-04-01 02:00:00',
          18_000,
          3_600,
          null,
          null,
          JSON.stringify(ranklist.problems ?? []),
          JSON.stringify(ranklist.markers ?? []),
          JSON.stringify(ranklist.series ?? []),
          JSON.stringify(ranklist.sorter ?? null),
          null,
          fileId,
          contest.viewCount || 0,
          null,
          createdAt,
          updatedAt,
          null,
        ],
      );
      await connection.execute(
        `INSERT INTO file (
          id, contest_id, category, name, path, size, hash_type, hash_value, created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          fileId,
          contestId,
          'RankMain',
          fileName,
          filePath,
          body.length,
          'sha256',
          createHash('sha256').update(body).digest('hex'),
          createdAt,
          updatedAt,
          null,
        ],
      );
    }

    const excludedContestValues = [
      ['9001', 'e2e-live-only', null, 500, null],
      ['9002', 'e2e-soft-deleted', '99999', 700, '2024-05-01 00:00:00.000000'],
    ];
    for (const [id, uk, srkFileId, viewCount, deletedAt] of excludedContestValues) {
      await connection.execute(
        `INSERT INTO contest (
          id, uk, name, title, start_at, duration_s, frozen_duration_s, banner, ref_links,
          problems, markers, series, sorter, contributors, srk_file_id, view_count, redirect_uk,
          created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          uk,
          uk,
          JSON.stringify({ fallback: uk }),
          '2024-04-01 02:00:00',
          18_000,
          null,
          null,
          null,
          JSON.stringify([]),
          JSON.stringify([]),
          JSON.stringify([]),
          null,
          null,
          srkFileId,
          viewCount,
          null,
          '2024-04-01 00:00:00.000000',
          '2024-04-01 00:00:00.000000',
          deletedAt,
        ],
      );
    }

    await seedLiveContest(connection);
    await seedCcpc26LiveContests(connection);

    await connection.execute('INSERT INTO collection (id, uk, content) VALUES (?, ?, ?)', [
      '3001',
      'official',
      JSON.stringify(fixtures.collection),
    ]);
  } finally {
    await connection.end();
  }
}

async function seedLiveContest(connection) {
  await seedEventContest(connection, {
    contestId: '9003',
    contestUserIdBase: 9100,
    contestEventIdBase: 9200,
    uk: 'live-test-key',
    name: 'Test Contest 2024',
    ranklist: fixtures.srk,
    users: fixtures.srk.rows.slice(0, 2).map((row) => row.user),
    events: createLiveTestEvents(),
  });
}

async function seedCcpc26LiveContests(connection) {
  await seedEventContest(connection, {
    contestId: '9004',
    contestUserIdBase: 9300,
    contestEventIdBase: 9400,
    uk: 'ccpc26-live-test',
    name: 'CCPC26 Test Contest',
    ranklist: fixtures.ccpc26Srk,
    users: fixtures.ccpc26Srk.rows.map((row) => row.user),
    events: createCcpc26InitialEvents(),
  });
  await seedEventContest(connection, {
    contestId: '9005',
    contestUserIdBase: 9500,
    contestEventIdBase: 9600,
    uk: 'ccpc26-live-ordinary-test',
    name: 'CCPC26 Ordinary ICPC Fixture',
    ranklist: fixtures.ccpc26OrdinarySrk,
    users: fixtures.ccpc26OrdinarySrk.rows.map((row) => row.user),
    events: createCcpc26InitialEvents(),
  });
}

async function seedEventContest(connection, options) {
  const {
    contestId,
    contestUserIdBase,
    contestEventIdBase,
    uk,
    name,
    ranklist,
    users,
    events,
  } = options;
  const contestTitle = typeof ranklist.contest.title === 'string'
    ? { fallback: ranklist.contest.title }
    : ranklist.contest.title;
  await connection.execute(
    `INSERT INTO contest (
      id, uk, name, title, start_at, duration_s, frozen_duration_s, banner, ref_links,
      problems, markers, series, sorter, contributors, srk_file_id, view_count, redirect_uk,
      created_at, updated_at, deleted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      contestId,
      uk,
      name,
      JSON.stringify(contestTitle),
      toMysqlDateTime(ranklist.contest.startAt),
      timeDurationToSeconds(ranklist.contest.duration),
      ranklist.contest.frozenDuration
        ? timeDurationToSeconds(ranklist.contest.frozenDuration)
        : null,
      null,
      JSON.stringify(ranklist.contest.refLinks ?? []),
      JSON.stringify(ranklist.problems ?? []),
      JSON.stringify(ranklist.markers ?? []),
      JSON.stringify(ranklist.series ?? []),
      JSON.stringify(ranklist.sorter ?? null),
      JSON.stringify(ranklist.contributors ?? []),
      null,
      0,
      null,
      '2024-04-01 00:00:00.000000',
      '2024-04-01 00:00:00.000000',
      null,
    ],
  );

  for (const [index, user] of users.entries()) {
    await connection.execute(
      `INSERT INTO contest_user (
        id, contest_id, user_id, name, avatar, photo, organization, location,
        team_members, markers, official, banned, broadcaster_token, sort_index
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(contestUserIdBase + index),
        contestId,
        user.id,
        serializeTextColumn(user.name),
        user.avatar ? serializeTextColumn(user.avatar) : null,
        user.photo ? serializeTextColumn(user.photo) : null,
        user.organization ? serializeTextColumn(user.organization) : null,
        user.location ?? null,
        user.teamMembers ? JSON.stringify(user.teamMembers) : null,
        user.markers || user.marker
          ? JSON.stringify(user.markers || [user.marker])
          : null,
        user.official === false ? 0 : 1,
        0,
        null,
        index,
      ],
    );
  }

  await connection.execute(
    `INSERT INTO contest_event_stream (
      contest_id, last_event_id, stream_revision, producer_id, producer_locked_at
    ) VALUES (?, ?, ?, ?, ?)`,
    [contestId, events.length, 1, null, null],
  );
  for (const event of events) {
    const payloadBytes = encodeLiveClientEvent(event);
    await connection.execute(
      `INSERT INTO contest_event (
        id, contest_id, event_id, stream_revision, type, producer_id,
        solution_id, user_id, problem_alias, percentage_progress,
        previous_result, result, time_ns, solution_submit_time_ns,
        payload_hash, payload_bytes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(contestEventIdBase + event.eventId),
        contestId,
        event.eventId,
        1,
        event.type,
        'e2e-seed',
        event.solutionId ?? null,
        event.userId ?? null,
        event.problemAlias ?? null,
        event.percentageProgress ?? null,
        event.previousResult ?? null,
        event.result ?? null,
        event.timeNs ?? null,
        event.solutionSubmitTimeNs ?? null,
        createHash('sha256').update(payloadBytes).digest('hex'),
        payloadBytes,
      ],
    );
  }
}

function createLiveTestEvents() {
  return [
    {
      eventId: 1,
      type: liveCommonProto.EventType.NEW_SOLUTION,
      newSolutionData: {
        solutionId: 101,
        userId: 'team-alpha',
        problemAlias: 'A',
        time: { value: '600', unit: liveCommonProto.TimeUnit.S },
      },
      solutionId: 101,
      userId: 'team-alpha',
      problemAlias: 'A',
      timeNs: '600000000000',
      solutionSubmitTimeNs: '600000000000',
    },
    {
      eventId: 2,
      type: liveCommonProto.EventType.SOLUTION_ON_RESULT_SETTLE,
      solutionOnResultSettleData: {
        solutionId: 101,
        result: liveCommonProto.Result.AC,
        time: { value: '601', unit: liveCommonProto.TimeUnit.S },
      },
      solutionId: 101,
      result: liveCommonProto.Result.AC,
      timeNs: '601000000000',
    },
    {
      eventId: 3,
      type: liveCommonProto.EventType.NEW_SOLUTION,
      newSolutionData: {
        solutionId: 102,
        userId: 'team-beta',
        problemAlias: 'A',
        time: { value: '1200', unit: liveCommonProto.TimeUnit.S },
      },
      solutionId: 102,
      userId: 'team-beta',
      problemAlias: 'A',
      timeNs: '1200000000000',
      solutionSubmitTimeNs: '1200000000000',
    },
    {
      eventId: 4,
      type: liveCommonProto.EventType.SOLUTION_ON_RESULT_SETTLE,
      solutionOnResultSettleData: {
        solutionId: 102,
        result: liveCommonProto.Result.WA,
        time: { value: '1201', unit: liveCommonProto.TimeUnit.S },
      },
      solutionId: 102,
      result: liveCommonProto.Result.WA,
      timeNs: '1201000000000',
    },
  ];
}

function createCcpc26InitialEvents() {
  const solutions = [
    { solutionId: 201, userId: 'ccpc26-alpha', problemAlias: 'B', submittedAtSeconds: 60 },
    { solutionId: 202, userId: 'ccpc26-alpha', problemAlias: 'A', submittedAtSeconds: 120 },
    { solutionId: 203, userId: 'ccpc26-beta', problemAlias: 'A', submittedAtSeconds: 180 },
  ];
  return solutions.flatMap((solution, index) => {
    const newEventId = index * 2 + 1;
    const settleEventId = newEventId + 1;
    const submittedAtNs = `${solution.submittedAtSeconds}000000000`;
    const settledAtSeconds = solution.submittedAtSeconds + 1;
    return [
      {
        eventId: newEventId,
        type: liveCommonProto.EventType.NEW_SOLUTION,
        newSolutionData: {
          solutionId: solution.solutionId,
          userId: solution.userId,
          problemAlias: solution.problemAlias,
          time: { value: String(solution.submittedAtSeconds), unit: liveCommonProto.TimeUnit.S },
        },
        solutionId: solution.solutionId,
        userId: solution.userId,
        problemAlias: solution.problemAlias,
        timeNs: submittedAtNs,
        solutionSubmitTimeNs: submittedAtNs,
      },
      {
        eventId: settleEventId,
        type: liveCommonProto.EventType.SOLUTION_ON_RESULT_SETTLE,
        solutionOnResultSettleData: {
          solutionId: solution.solutionId,
          result: liveCommonProto.Result.AC,
          time: { value: String(settledAtSeconds), unit: liveCommonProto.TimeUnit.S },
        },
        solutionId: solution.solutionId,
        result: liveCommonProto.Result.AC,
        timeNs: `${settledAtSeconds}000000000`,
      },
    ];
  });
}

function timeDurationToSeconds([value, unit]) {
  const multipliers = {
    ns: 1 / 1_000_000_000,
    us: 1 / 1_000_000,
    ms: 1 / 1_000,
    s: 1,
    min: 60,
    h: 3600,
    d: 86_400,
  };
  const multiplier = multipliers[unit];
  if (multiplier === undefined) {
    throw new Error(`Unsupported E2E contest duration unit: ${unit}`);
  }
  const seconds = value * multiplier;
  if (!Number.isSafeInteger(seconds) || seconds < 0) {
    throw new Error(`E2E contest duration must resolve to non-negative whole seconds: ${value} ${unit}`);
  }
  return seconds;
}

function encodeLiveClientEvent(event) {
  const message = liveClientProto.ClientEvent.fromObject({
    eventId: event.eventId,
    type: event.type,
    newSolutionData: event.newSolutionData,
    solutionOnProgressData: event.solutionOnProgressData,
    solutionOnResultSettleData: event.solutionOnResultSettleData,
    solutionOnResultChangeData: event.solutionOnResultChangeData,
  });
  return Buffer.from(liveClientProto.ClientEvent.encode(message).finish());
}

function serializeTextColumn(value) {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

function buildContestSeeds() {
  const entries = new Map();
  const add = (uk, name, extra = {}) => {
    if (!entries.has(uk)) {
      entries.set(uk, { uk, name, ...extra });
    }
  };

  for (const rank of fixtures.listAll.ranks) {
    add(rank.uniqueKey, rank.name, {
      viewCount: rank.viewCnt,
      createdAt: toMysqlDateTime(rank.createdAt),
      updatedAt: toMysqlDateTime(rank.updatedAt),
    });
  }
  visitCollectionItems(fixtures.collection.root.children, (item) => add(item.uniqueKey, item.name));
  add('localized-key-v2', 'Localized Contest');
  add('no-problems-key', 'No Problems Fixture');
  add('implicit-official-key', 'Implicit Official Fixture');
  add('no-view-key', 'Test Contest 2024');
  add('ccpc26-key', 'CCPC26 Test Contest');
  add('ccpc26-ordinary-key', 'CCPC26 Ordinary ICPC Fixture');

  return Array.from(entries.values());
}

function visitCollectionItems(items, visit) {
  for (const item of items || []) {
    if (item.type === 1) {
      visit(item);
    }
    visitCollectionItems(item.children, visit);
  }
}

function ranklistFor(uk) {
  switch (uk) {
    case 'localized-key-v2':
      return fixtures.localizedSrk;
    case 'large-key':
      return fixtures.largeSrk;
    case 'short-progress-key':
      return fixtures.progressResetShortSrk;
    case 'long-progress-key':
      return fixtures.progressResetLongSrk;
    case 'no-problems-key':
      return fixtures.noProblemsSrk;
    case 'implicit-official-key':
      return fixtures.implicitOfficialSrk;
    case 'ccpc26-key':
      return fixtures.ccpc26Srk;
    case 'ccpc26-ordinary-key':
      return fixtures.ccpc26OrdinarySrk;
    default:
      return fixtures.srk;
  }
}

function toMysqlDateTime(value) {
  return new Date(value)
    .toISOString()
    .replace('T', ' ')
    .replace('Z', '')
    .replace(/\.\d{3}$/, '.000000');
}
