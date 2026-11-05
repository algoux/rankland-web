import type { RanklistProps } from '@algoux/standard-ranklist-renderer-component-vue';
import { formatTimeDuration, getCCPC26ProblemLayout, numberToAlphabet } from '@algoux/standard-ranklist-utils';
import { getRankProblemStatusCellPresentation, shouldShowTimeColumn } from '@algoux/standard-ranklist-renderer-component-core';

// Keep numeric/status padding in sync with the wrapper's CSS custom property.
export const RANKLIST_NUMERIC_PADDING_X = 4;
export const RANKLIST_TIME_PADDING_RIGHT = 8;
const NUMERIC_COLUMN_EXTRA = RANKLIST_NUMERIC_PADDING_X * 2 + 2;

// The renderer uses 14px text. Pixel upper bounds keep col widths and light-row
// offsets in the same metric context (ch would differ on bold header cells).
export function estimateRanklistTextWidth(value: unknown) {
  let width = 0;
  for (const character of String(value ?? '')) {
    if (/\s/.test(character)) width += 5;
    else if (/[0-9+=]/.test(character)) width += 9;
    else if (character === '/') width += 6;
    else if (/[.,:;]/.test(character)) width += 5;
    else if (character === '-') width += 7;
    else if (/[()]/.test(character)) width += 6;
    else if (/[MWmw@%]/.test(character)) width += 16;
    else if (character.charCodeAt(0) < 128) width += 11;
    else width += 18;
  }
  return width;
}

// Mac system-ui and Windows Segoe UI 14px/700 measurements are retained in the
// performance evidence. Other captions keep the conservative per-glyph bound.
function headerTextWidth(value: unknown) {
  if (value === 'Score') return 44;
  if (value === 'Time') return 38;
  return estimateRanklistTextWidth(value) * 1.1;
}

/** Pure SSR/client sizing. No DOM reads, font measurement, or post-mount sizing. */
export function getRanklistColumnWidths(props: RanklistProps): number[] {
  const { data } = props;
  const title = (key: 'organization' | 'user' | 'score' | 'time' | 'dirt' | 'se', fallback: string) => props.columnTitles?.[key] ?? fallback;
  const rankWidths = data.series.map((series, index) => {
    const titles = props.columnTitles?.series;
    const text = typeof titles === 'function' ? titles(series, index) ?? series.title : titles?.[index] ?? series.title;
    return headerTextWidth(text);
  });
  let scoreWidth = headerTextWidth(title('score', 'Score'));
  let timeWidth = headerTextWidth(title('time', 'Time'));
  // Reserve a useful submission/time shape even for unattempted/unsolved problems.
  const statusWidths: number[] = data.problems.map(() => estimateRanklistTextWidth('22/222'));
  const footerTimeWidths = new Array(data.problems.length).fill(0);
  const footerSubmitted = new Array(data.problems.length).fill(0);
  for (const row of data.rows) {
    for (let index = 0; index < rankWidths.length; index++) {
      rankWidths[index] = Math.max(rankWidths[index], estimateRanklistTextWidth(row.rankValues?.[index]?.rank || (row.user.official === false ? '＊' : '')));
    }
    scoreWidth = Math.max(scoreWidth, estimateRanklistTextWidth(row.score.value));
    timeWidth = Math.max(timeWidth, estimateRanklistTextWidth(row.score.time ? formatTimeDuration(row.score.time, 'min', Math.floor) : '-'));
    row.statuses.forEach((status, index) => {
      if (!status?.result) return;
      const presentation = getRankProblemStatusCellPresentation(status, data, props.statusCellPreset || 'classic');
      statusWidths[index] = Math.max(statusWidths[index] || 0,
        estimateRanklistTextWidth(presentation.primary),
        estimateRanklistTextWidth(presentation.score),
        estimateRanklistTextWidth(presentation.secondary) * 0.8,
        estimateRanklistTextWidth(presentation.scoreDetails) * 0.8);
      if (props.showProblemStatisticsFooter) {
        footerSubmitted[index] += status.tries || 0;
        if (status.time && (status.result === 'AC' || status.result === 'FB')) footerTimeWidths[index] = Math.max(footerTimeWidths[index], estimateRanklistTextWidth(formatTimeDuration(status.time, 'min', Math.floor)));
      }
    });
  }
  // Ordinary boards size each problem independently. Anonymous CCPC26 slots
  // can contain different problems in each row, so only that mode uses one
  // uniform bound and excludes hidden aliases/statistics from header sizing.
  const layout = props.enableCCPC26 ? props.ccpc26ProblemLayout || getCCPC26ProblemLayout(data) : undefined;
  const revealed = layout ? layout.revealedProblemIndexes : data.problems.map((_, index) => index);
  for (const index of revealed) {
    statusWidths[index] = Math.max(statusWidths[index], headerTextWidth(data.problems[index]?.alias || numberToAlphabet(index)),
      estimateRanklistTextWidth(data.problems[index]?.statistics?.accepted) * 0.8);
    if (props.showProblemStatisticsFooter) {
      statusWidths[index] = Math.max(statusWidths[index], estimateRanklistTextWidth('(100%)') * 0.8,
        estimateRanklistTextWidth(data.rows.length), estimateRanklistTextWidth(footerSubmitted[index]), footerTimeWidths[index]);
    }
  }
  if (layout) statusWidths.fill(Math.max(0, ...statusWidths));
  const widths = rankWidths.map((width, index) => Math.max(40, Math.ceil(width + (data.series[index].segments?.some(segment => typeof segment.style === 'string') ? RANKLIST_NUMERIC_PADDING_X + 20 : NUMERIC_COLUMN_EXTRA))));
  if (props.splitOrganization) widths.push(Math.max(220, Math.ceil(headerTextWidth(title('organization', 'Organization')) + 18)));
  widths.push(Math.max(240, Math.ceil(headerTextWidth(title('user', 'Name')) + 18)));
  widths.push(Math.ceil(scoreWidth + NUMERIC_COLUMN_EXTRA));
  if (shouldShowTimeColumn(data.rows)) {
    widths.push(Math.ceil(timeWidth + NUMERIC_COLUMN_EXTRA + RANKLIST_TIME_PADDING_RIGHT - RANKLIST_NUMERIC_PADDING_X));
  }
  widths.push(...statusWidths.map(width => Math.max(40, Math.ceil(width + NUMERIC_COLUMN_EXTRA))));
  if (props.showDirtColumn) widths.push(Math.max(65, Math.ceil(estimateRanklistTextWidth(title('dirt', 'Dirt')) + NUMERIC_COLUMN_EXTRA)));
  if (props.showSEColumn) widths.push(Math.max(54, Math.ceil(estimateRanklistTextWidth(title('se', 'SE')) + NUMERIC_COLUMN_EXTRA)));
  return widths;
}
