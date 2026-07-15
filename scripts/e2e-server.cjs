/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn, spawnSync } = require('child_process');
const { createHash } = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const mysql = require('mysql2/promise');
const { fixtures } = require('./e2e-mock-rankland-api.cjs');

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

    await connection.execute('INSERT INTO collection (id, uk, content) VALUES (?, ?, ?)', [
      '3001',
      'official',
      JSON.stringify(fixtures.collection),
    ]);
  } finally {
    await connection.end();
  }
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
