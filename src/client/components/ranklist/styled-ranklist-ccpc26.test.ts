import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { createMemoryHistory, createRouter } from 'vue-router';
import type * as srk from '@algoux/standard-ranklist';
import fixture from '../../../../tests/fixtures/ccpc26.srk.json';
import StyledRanklist from './StyledRanklist.vue';

const START = Date.parse(fixture.contest.startAt);
const MINUTE = 60_000;
const CLOCKS = [
  ['before freeze', START + 4 * MINUTE],
  ['after freeze', START + 11 * MINUTE],
] as const;

function freezeDeep<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
  return value;
}

async function renderRanklist({ isLive, ordinary = false }: { isLive: boolean; ordinary?: boolean }) {
  const data: srk.Ranklist = JSON.parse(JSON.stringify(fixture));
  if (ordinary) data.sorter = { algorithm: 'ICPC', config: {} };
  const original = JSON.stringify(data);
  const app = createSSRApp(StyledRanklist, {
    data: freezeDeep(data),
    name: 'CCPC26 SSR fixture',
    isLive,
    showProgress: true,
  });
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div />' } }],
  });
  app.use(router);
  await router.push('/');
  await router.isReady();

  const html = await renderToString(app);

  expect(html).not.toContain('Error occurred while checking srk');
  expect(JSON.stringify(data)).toBe(original);
  expect(vi.getTimerCount()).toBe(0);
  return html;
}

function expectOrdinaryTable(html: string) {
  expect(html).toMatch(/<div\b[^>]*class="[^"]*\bsrk-main\b[^"]*"[^>]*>\s*<table\b/);
  const headerCells = html.match(/<th\b[^>]*class="[^"]*\bsrk-problem-header\b[^"]*"[^>]*>[\s\S]*?<\/th>/g) || [];
  expect(headerCells.map((cell) => cell.match(/<span\b[^>]*>([^<]*)<\/span>/)?.[1]))
    .toEqual(fixture.problems.map((problem) => problem.alias));
  for (const row of fixture.rows) expect(html).toContain(row.user.name);
}

describe('CCPC26 SSR clock boundary', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each(CLOCKS)('defers a Live CCPC26 table and clock progress when the server is %s', async (_label, now) => {
    vi.setSystemTime(now);
    const html = await renderRanklist({ isLive: true });

    expect(html).not.toMatch(/<div\b[^>]*class="[^"]*\bsrk-main\b/);
    expect(html).not.toContain('srk-problem-header');
    expect(html).not.toContain('srk-progress-bar-container');
    expect(html).not.toContain('aria-label="Time Travel"');
    for (const row of fixture.rows) expect(html).not.toContain(row.user.name);
  });

  it.each(CLOCKS)('preserves ordinary table SSR for static CCPC26 when the server is %s', async (_label, now) => {
    vi.setSystemTime(now);
    const html = await renderRanklist({ isLive: false });

    expectOrdinaryTable(html);
    expect(html).toContain('srk-progress-bar-container');
  });

  it.each(CLOCKS)('preserves ordinary Live ICPC table SSR but defers its clock when the server is %s', async (_label, now) => {
    vi.setSystemTime(now);
    const html = await renderRanklist({ isLive: true, ordinary: true });

    expectOrdinaryTable(html);
    expect(html).not.toContain('srk-progress-bar-container');
    expect(html).not.toContain('aria-label="Time Travel"');
  });
});
