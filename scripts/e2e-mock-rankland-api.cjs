/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const http = require('http');
const path = require('path');

const fixturesDir = path.join(__dirname, '..', 'tests', 'fixtures');
const port = Number(process.env.PORT || 4322);

function readFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf-8'));
}

function createLargeRanklist() {
  const rowCount = 384;
  const problemCount = 13;
  const durationMs = 5 * 60 * 60 * 1000;
  const problems = Array.from({ length: problemCount }, (_, index) => ({
    title: `Problem ${String.fromCharCode(65 + index)}`,
    alias: String.fromCharCode(65 + index),
  }));

  const rows = Array.from({ length: rowCount }, (_, rowIndex) => {
    let solved = 0;
    let penaltyMs = 0;
    const statuses = problems.map((_, problemIndex) => {
      const accepted = (rowIndex * 17 + problemIndex * 11) % 100 < 58;
      const wrongTries = (rowIndex + problemIndex * 3) % 4;
      const firstTryMs = 60_000 + ((rowIndex * 43 + problemIndex * 97) % 270) * 60_000;
      const solutions = Array.from({ length: wrongTries }, (_, tryIndex) => ({
        result: 'WA',
        time: [Math.max(1_000, firstTryMs - (wrongTries - tryIndex) * 45_000), 'ms'],
      }));

      if (!accepted) {
        return {
          result: wrongTries > 0 ? 'RJ' : null,
          tries: wrongTries,
          solutions,
        };
      }

      const acceptedTimeMs = Math.min(firstTryMs + wrongTries * 90_000, durationMs - 1_000);
      solutions.push({
        result: 'AC',
        time: [acceptedTimeMs, 'ms'],
      });
      solved += 1;
      penaltyMs += acceptedTimeMs + wrongTries * 20 * 60 * 1000;
      return {
        result: 'AC',
        time: [Math.floor(acceptedTimeMs / 1000), 's'],
        tries: wrongTries + 1,
        solutions,
      };
    });

    return {
      user: {
        id: `large-team-${String(rowIndex + 1).padStart(3, '0')}`,
        name: `Large Team ${String(rowIndex + 1).padStart(3, '0')}`,
        organization: `Large University ${(rowIndex % 24) + 1}`,
        official: true,
      },
      score: { value: solved, time: [penaltyMs, 'ms'] },
      statuses,
    };
  });

  return {
    type: 'general',
    version: '0.3.12',
    contest: {
      title: 'Large Rank Time Fixture',
      startAt: '2024-04-01T10:00:00+08:00',
      duration: [5, 'h'],
      frozenDuration: [1, 'h'],
    },
    problems,
    series: [
      {
        title: 'Rank',
        segments: [
          { title: 'Gold', style: 'gold' },
          { title: 'Silver', style: 'silver' },
          { title: 'Bronze', style: 'bronze' },
        ],
        rule: {
          preset: 'ICPC',
          options: { count: { value: [38, 96, 96] } },
        },
      },
    ],
    rows,
    sorter: {
      algorithm: 'ICPC',
      config: {},
    },
  };
}

function createLocalizedRanklist() {
  return {
    type: 'general',
    version: '0.3.13',
    contest: {
      title: { 'zh-CN': '中文本地化比赛', fallback: 'Localized Contest' },
      startAt: '2024-04-01T10:00:00+08:00',
      duration: [5, 'h'],
      refLinks: [
        {
          title: { 'zh-CN': '中文官网', fallback: 'Official Site' },
          link: 'https://example.com/localized',
        },
      ],
    },
    remarks: { 'zh-CN': '中文备注', fallback: 'Localized remark' },
    markers: [
      { id: 'female', label: { 'zh-CN': '女队', fallback: 'Female Teams' }, style: 'pink' },
    ],
    problems: [
      {
        title: { 'zh-CN': '题目 A', fallback: 'Problem A' },
        alias: 'A',
        statistics: { accepted: 1, submitted: 1 },
      },
    ],
    series: [
      {
        title: 'Rank',
        rule: {
          preset: 'ICPC',
          options: { count: { value: [] } },
        },
      },
    ],
    rows: [
      {
        user: {
          id: 'localized-team',
          name: { 'zh-CN': '中文队伍', fallback: 'Localized Team' },
          organization: { 'zh-CN': '中文大学', fallback: 'Localized University' },
          official: true,
          marker: 'female',
          teamMembers: [
            { name: { 'zh-CN': '张三', fallback: 'Alice' }, role: 'captain' },
            { name: { 'zh-CN': '李四', fallback: 'Bob' } },
          ],
        },
        score: { value: 1, time: [10, 'min'] },
        statuses: [
          {
            result: 'AC',
            time: [10, 'min'],
            tries: 1,
            solutions: [{ result: 'AC', time: [10, 'min'] }],
          },
        ],
      },
    ],
  };
}

function createProgressResetRanklist(baseRanklist, durationHours) {
  return {
    ...baseRanklist,
    contest: {
      ...baseRanklist.contest,
      title: 'Progress Reset Fixture',
      duration: [durationHours, 'h'],
    },
  };
}

function createNoProblemsRanklist(baseRanklist) {
  return {
    ...baseRanklist,
    contest: {
      ...baseRanklist.contest,
      title: 'No Problems Fixture',
    },
    problems: [],
    rows: baseRanklist.rows.map((row) => ({
      ...row,
      statuses: [],
    })),
  };
}

function createImplicitOfficialRanklist(baseRanklist) {
  const { official: _official, ...implicitOfficialUser } = baseRanklist.rows[0].user;
  return {
    ...baseRanklist,
    contest: {
      ...baseRanklist.contest,
      title: 'Implicit Official Fixture',
    },
    rows: [
      {
        ...baseRanklist.rows[0],
        user: {
          ...implicitOfficialUser,
          id: 'implicit-official-team',
          name: 'Implicit Official Team',
        },
      },
      {
        ...baseRanklist.rows[1],
        user: {
          ...baseRanklist.rows[1].user,
          id: 'unofficial-team',
          name: 'Unofficial Team',
          official: false,
        },
      },
    ],
  };
}

const fixtures = {
  collection: readFixture('collection.json'),
  listAll: readFixture('listall.json'),
  liveInfo: readFixture('live-info.json'),
  localizedSrk: createLocalizedRanklist(),
  largeSrk: createLargeRanklist(),
  ranklistInfo: readFixture('ranklist-info.json'),
  srk: readFixture('ranklist.srk.json'),
  statistics: readFixture('statistics.json'),
};

fixtures.progressResetShortSrk = createProgressResetRanklist(fixtures.srk, 3);
fixtures.progressResetLongSrk = createProgressResetRanklist(fixtures.srk, 5);
fixtures.noProblemsSrk = createNoProblemsRanklist(fixtures.srk);
fixtures.implicitOfficialSrk = createImplicitOfficialRanklist(fixtures.srk);
fixtures.collection.root.children[0].children[0].children.push(
  {
    type: 1,
    uniqueKey: 'short-progress-key',
    name: 'Progress Reset Fixture (3h)',
  },
  {
    type: 1,
    uniqueKey: 'long-progress-key',
    name: 'Progress Reset Fixture (5h)',
  },
);

function wrap(data) {
  return { code: 0, message: 'success', data };
}

function sendJson(res, body, status = 200) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,OPTIONS',
    'cache-control': 'no-store',
  });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || `127.0.0.1:${port}`}`);
  const pathname = decodeURIComponent(url.pathname);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,OPTIONS',
    });
    res.end();
    return;
  }

  if (pathname === '/__health') {
    sendJson(res, { ok: true });
    return;
  }

  if (pathname === '/rank/search') {
    sendJson(res, wrap(fixtures.listAll));
    return;
  }

  if (pathname === '/ranking/file') {
    if (url.searchParams.get('id') === 'file-localized-v2') {
      sendJson(res, fixtures.localizedSrk);
      return;
    }
    sendJson(res, fixtures.srk);
    return;
  }

  if (pathname.startsWith('/ranking/config/')) {
    const key = pathname.split('/').pop();
    if (key === 'missing-key' || key === 'not-found') {
      sendJson(res, { code: 11, message: 'live ranklist not found' });
      return;
    }
    sendJson(res, wrap(fixtures.liveInfo));
    return;
  }

  if (pathname.startsWith('/ranking/')) {
    sendJson(res, wrap(fixtures.srk));
    return;
  }

  sendJson(res, { code: 404, message: `No mock for ${pathname}` }, 404);
});

if (require.main === module) {
  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`[e2e-mock-rankland-api] listening on http://127.0.0.1:${port}`);
  });
}

module.exports = { fixtures };
