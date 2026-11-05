import { describe, expect, it } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { Ranklist } from '@algoux/standard-ranklist-renderer-component-vue';
import { convertToStaticRanklist } from '@algoux/standard-ranklist-utils';
import fixture from '../../../../tests/fixtures/ranklist.srk.json';
import ccpcFixture from '../../../../tests/fixtures/ccpc26.srk.json';
import { estimateRanklistTextWidth, getRanklistColumnWidths } from './ranklist-column-widths';

const render = (props: any) => renderToString(createSSRApp({ render: () => h(Ranklist, props) }));

describe('ranklist first-render column sizing', () => {
  it('shrinks a segmented header without taking space from longer body ranks', () => {
    const data = convertToStaticRanklist(fixture as any);
    expect(getRanklistColumnWidths({ data })[0]).toBe(63);

    const rows = [...data.rows];
    rows[1] = { ...rows[1], rankValues: [{ ...rows[1].rankValues[0], rank: 123456789 }] };
    expect(getRanklistColumnWidths({ data: { ...data, rows } })[0]).toBe(101);
  });

  it('covers numeric/status values outside the first window without widening unrelated ordinary problems', () => {
    const source = convertToStaticRanklist(fixture as any);
    const rows = Array.from({ length: 301 }, (_, index) => ({ ...source.rows[0], user: { ...source.rows[0].user, id: `user-${index}` } }));
    const ordinary = getRanklistColumnWidths({ data: { ...source, rows } });
    rows[300] = { ...rows[300], score: { value: -123456789.1234, time: [99999999, 'min'] },
      statuses: [{ ...rows[300].statuses[0], score: 0.12345678901234567 }, ...rows[300].statuses.slice(1)] };
    const widths = getRanklistColumnWidths({ data: { ...source, rows } });
    const scoreIndex = source.series.length + 1;
    expect(widths[scoreIndex]).toBeGreaterThan(ordinary[scoreIndex]);
    expect(widths[scoreIndex]).toBeGreaterThanOrEqual(estimateRanklistTextWidth(-123456789.1234) + 10);
    expect(widths[scoreIndex + 1]).toBeGreaterThanOrEqual(estimateRanklistTextWidth(99999999) + 14);
    expect(widths[scoreIndex + 2]).toBeGreaterThanOrEqual(estimateRanklistTextWidth(0.12345678901234567) + 10);
    expect(widths[scoreIndex + 3]).toBe(ordinary[scoreIndex + 3]);
  });

  it('reserves 22/222 for unsolved and empty problem columns in every preset', () => {
    const source = convertToStaticRanklist(fixture as any);
    const data = { ...source,
      problems: source.problems.map(problem => ({ ...problem, statistics: { accepted: 0, submitted: 1 } })),
      rows: source.rows.map(row => ({ ...row, statuses: source.problems.map((_, index) =>
        index % 2 ? { result: null } : { result: 'RJ' as const, tries: 1 }) })),
    };
    for (const statusCellPreset of ['classic', 'compact', 'detailed', 'minimal'] as const) {
      const widths = getRanklistColumnWidths({ data, statusCellPreset });
      const problems = widths.slice(-data.problems.length);
      expect(problems.every(width => width >= estimateRanklistTextWidth('22/222') + 10)).toBe(true);
      expect(problems.every(width => width === 61)).toBe(true);
    }
  });

  it('emits fixed widths and light offsets in SSR itself, while full mode retains native auto layout', async () => {
    const data = convertToStaticRanklist(fixture as any);
    const columnWidths = getRanklistColumnWidths({ data });
    const html = await render({ data, retainUserText: true, columnWidths, rowWindow: { start: 0, end: 1, top: 0, bottom: 0 } });
    expect(html).toContain('table-layout:fixed');
    expect(html).toContain('width:100%');
    expect(html.match(/<col style="width:auto;"/g)).toHaveLength(1);
    expect(html).toContain(`min-width:${columnWidths.reduce((sum, width) => sum + width, 0)}px`);
    expect(html).toContain(`--srk-search-ranks-width:${columnWidths.slice(0, data.series.length).reduce((sum, width) => sum + width, 0)}px`);
    expect(html.match(/<col\s/g)).toHaveLength(columnWidths.length);
    expect(await render({ data, retainUserText: true })).not.toContain('table-layout:fixed');
  });

  it('preserves CCPC26 colgroup separation without encoding a hidden alias in column widths', async () => {
    const data = convertToStaticRanklist(ccpcFixture as any);
    const options = { data, enableCCPC26: true, ccpc26ProblemLayout: { revealedProblemIndexes: [0], hiddenProblemIndexes: [1, 2] } };
    const widths = getRanklistColumnWidths(options);
    const changed = { ...data, problems: data.problems.map((problem, index) => index === 2 ? { ...problem, alias: 'HIDDEN_ALIAS_WITH_A_VERY_LONG_NAME' } : problem) };
    expect(getRanklistColumnWidths({ ...options, data: changed })).toEqual(widths);
    const html = await render({ ...options, columnWidths: widths });
    expect(html).toContain('srk-ccpc26-revealed-columns');
    expect(html.match(/<col\s/g)).toHaveLength(widths.length);
  });

  it('includes split organization, empty series, time visibility and Pro columns in the same model', () => {
    const source = convertToStaticRanklist(fixture as any);
    const data = { ...source, series: [], rows: source.rows.map(row => ({ ...row, score: { value: row.score.value }, rankValues: [] })) };
    const widths = getRanklistColumnWidths({ data, splitOrganization: true, showDirtColumn: true, showSEColumn: true, showProblemStatisticsFooter: true });
    expect(widths).toHaveLength(3 + data.problems.length + 2);
    expect(widths.every(width => Number.isFinite(width) && width > 0)).toBe(true);
  });
});
