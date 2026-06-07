export const SCROLL_SOLUTION_ITEM_HEIGHT = 45;
export const SCROLL_SOLUTION_DEFAULT_LIMIT = 20;
export const SCROLL_SOLUTION_POP_INTERVAL = 200;
export const SCROLL_SOLUTION_MIN_DELAY = 1000;

const RJ_DELAY = 10000;
const MAX_POP_INTERVAL = 100;
const DELAY_MAP: Record<string, number> = {
  FB: 180000,
  AC: 20000,
  RJ: RJ_DELAY,
  '?': RJ_DELAY,
  WA: RJ_DELAY,
  PE: RJ_DELAY,
  TLE: RJ_DELAY,
  MLE: RJ_DELAY,
  OLE: RJ_DELAY,
  RTE: RJ_DELAY,
  CE: RJ_DELAY,
  UKE: RJ_DELAY,
};

const REJECTED_RESULTS = new Set(['RJ', 'WA', 'PE', 'TLE', 'MLE', 'OLE', 'RTE', 'CE', 'UKE']);

export interface QueuedScrollSolutionItem {
  problemAlias: string;
  result: string;
  solved: number;
  user: {
    id: string;
    name: string;
    organization?: string;
  };
}

export interface DisplayedScrollSolutionItem extends QueuedScrollSolutionItem {
  key: string;
}

export function getScrollSolutionVisibleLimit(containerMaxHeight = 0): number {
  return containerMaxHeight > 0
    ? Math.floor(containerMaxHeight / SCROLL_SOLUTION_ITEM_HEIGHT)
    : SCROLL_SOLUTION_DEFAULT_LIMIT;
}

export function getScrollSolutionResultText(result: string): string {
  return result === 'FB' || result === 'AC' || REJECTED_RESULTS.has(result) || result === '?' ? result : '--';
}

export function getScrollSolutionResultClass(result: string): string {
  if (result === 'FB') {
    return 'result-fb';
  }
  if (result === 'AC') {
    return 'result-ac';
  }
  if (REJECTED_RESULTS.has(result)) {
    return 'result-rj';
  }
  if (result === '?') {
    return 'result-fz';
  }
  return '';
}

export function getScrollSolutionDelay(result: string): number {
  return DELAY_MAP[result] || RJ_DELAY;
}

export function enqueueScrollSolutions(
  queue: QueuedScrollSolutionItem[],
  rows: QueuedScrollSolutionItem[],
): { queue: QueuedScrollSolutionItem[]; immediate: QueuedScrollSolutionItem[] } {
  const nextQueue = [...queue];
  const immediate: QueuedScrollSolutionItem[] = [];

  for (const row of rows) {
    if (row.result === 'FB') {
      immediate.push(row);
    } else {
      nextQueue.push(row);
    }
  }

  return {
    queue: nextQueue,
    immediate,
  };
}

export function getNextScrollSolutionPop({
  queueLength,
  visibleLimit,
  result,
}: {
  queueLength: number;
  visibleLimit: number;
  result: string;
}): { delay: number; interval: number } {
  const limit = Math.max(1, visibleLimit);
  if (queueLength <= limit) {
    return {
      delay: getScrollSolutionDelay(result),
      interval: MAX_POP_INTERVAL,
    };
  }

  const scale = Math.max(1 / (queueLength / limit) - 0.5, 0.01);
  return {
    delay: SCROLL_SOLUTION_MIN_DELAY + getScrollSolutionDelay(result) * scale,
    interval: MAX_POP_INTERVAL * scale,
  };
}
