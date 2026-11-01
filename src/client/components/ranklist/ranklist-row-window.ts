/** A display window never changes the rank calculation or resident identity text. */
export interface RanklistRowWindow {
  start: number;
  end: number;
}

export const LARGE_RANKLIST_THRESHOLD = 300;
export const INITIAL_WINDOW_ROWS = 40;
// Measured two-line envelope: 22px primary + 17.28125px secondary + 3px
// gap + 16px padding + 1px border = 59.28125px. Keep natural line heights.
export const RANKLIST_ROW_HEIGHT = 60;

export function initialRanklistRowWindow(count: number): RanklistRowWindow {
  return { start: 0, end: Math.min(count, INITIAL_WINDOW_ROWS) };
}

/** The first row supplies the browser's actual uniform stride, including its
 * collapsed border. Each scroll needs one row rect, not N heights or a search. */
export function getUniformRowWindow(
  count: number,
  firstRowTop: number,
  rowHeight: number,
  viewportTop: number,
  viewportBottom: number,
  overscan = 600,
): RanklistRowWindow {
  if (!count || !Number.isFinite(rowHeight) || rowHeight <= 0) return initialRanklistRowWindow(count);
  const start = Math.max(0, Math.min(count, Math.floor((viewportTop - firstRowTop - overscan) / rowHeight)));
  const end = Math.max(start, Math.min(count, Math.ceil((Math.max(viewportTop, viewportBottom) - firstRowTop + overscan) / rowHeight)));
  return { start, end };
}
