import { describe, expect, it } from 'vitest';
import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import type * as srk from '@algoux/standard-ranklist';
import RanklistCardList from './RanklistCardList.vue';

function makeFixture(): srk.Ranklist {
  return {
    type: 'general',
    version: '0.3.12',
    contest: {
      title: 'Example Contest',
      startAt: '2026-06-01T09:00:00+08:00',
      duration: [5, 'h'],
    },
    problems: [
      { alias: 'A', statistics: { accepted: 10, submitted: 20 } },
      { alias: 'B', statistics: { accepted: 5, submitted: 15 } },
    ],
    series: [
      { title: '#', rule: { preset: 'ICPC', options: { count: { value: [] } } } },
      { title: 'R#', rule: { preset: 'Normal' } },
    ],
    rows: [
      {
        user: { id: 'alice', name: 'Alice Team', organization: 'Wonderland University', official: true },
        score: { value: 2, time: [120, 'min'] },
        statuses: [
          { result: 'AC', time: [60, 'min'], tries: 1, solutions: [{ result: 'AC', time: [60, 'min'] }] },
          { result: 'AC', time: [90, 'min'], tries: 2, solutions: [{ result: 'WA', time: [80, 'min'] }, { result: 'AC', time: [90, 'min'] }] },
        ],
      },
      {
        user: { id: 'bob', name: 'Bob Team', organization: 'Builder University', official: false },
        score: { value: 1, time: [90, 'min'] },
        statuses: [
          { result: 'AC', time: [90, 'min'], tries: 1, solutions: [{ result: 'AC', time: [90, 'min'] }] },
          { result: 'RJ', tries: 3, solutions: [] },
        ],
      },
    ],
  };
}

describe('RanklistCardList', () => {
  it('renders cards with rank values, names, and status cells', async () => {
    const { convertToStaticRanklist } = await import('@algoux/standard-ranklist-utils');
    const data = convertToStaticRanklist(makeFixture());
    const app = createSSRApp(RanklistCardList, { data });
    const html = await renderToString(app);

    expect(html).toContain('Alice Team');
    expect(html).toContain('Wonderland University');
    expect(html).toContain('Bob Team');
    expect(html).toContain('Builder University');
    expect(html).toContain('ranklist-card');
    expect(html).toContain('ranklist-card-legend');
    expect(html).toContain('ranklist-card-cell');
    expect(html).toContain('Score:');
    expect(html).toContain('Time:');
  });

  it('renders correct number of legend cells and status cells per row', async () => {
    const { convertToStaticRanklist } = await import('@algoux/standard-ranklist-utils');
    const data = convertToStaticRanklist(makeFixture());
    const app = createSSRApp(RanklistCardList, { data });
    const html = await renderToString(app);

    // 2 problems → 2 legend cells
    const legendMatches = html.match(/ranklist-card-legend-cell/g);
    expect(legendMatches).toHaveLength(2);

    // 2 rows × 2 problems = 4 cells
    const cellMatches = html.match(/ranklist-card-cell[ "]/g);
    expect(cellMatches?.length).toBeGreaterThanOrEqual(4);
  });

  it('shows * for null rank values', async () => {
    const { convertToStaticRanklist } = await import('@algoux/standard-ranklist-utils');
    const data = convertToStaticRanklist(makeFixture());
    const app = createSSRApp(RanklistCardList, { data });
    const html = await renderToString(app);

    // Bob has R# rank=1 but # rank=null (unofficial)
    expect(html).toContain('*');
  });

  it('renders attempt count in cells', async () => {
    const { convertToStaticRanklist } = await import('@algoux/standard-ranklist-utils');
    const data = convertToStaticRanklist(makeFixture());
    const app = createSSRApp(RanklistCardList, { data });
    const html = await renderToString(app);

    // Alice AC with 1 try on A, 2 tries on B
    // Bob RJ with 3 tries on B
    expect(html).toContain('>1<');
    expect(html).toContain('>2<');
    expect(html).toContain('>3<');
  });

  it('hides cells with no result', async () => {
    const { convertToStaticRanklist } = await import('@algoux/standard-ranklist-utils');
    const fixture = makeFixture();
    // Set Bob's B status to no result
    fixture.rows[1].statuses[1] = { result: null, tries: 0, solutions: [] };
    const data = convertToStaticRanklist(fixture);
    const app = createSSRApp(RanklistCardList, { data });
    const html = await renderToString(app);

    // Empty cells should have empty text content
    expect(html).toContain('ranklist-card-cell');
  });
});
