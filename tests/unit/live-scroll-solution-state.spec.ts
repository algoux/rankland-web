import { describe, expect, it } from 'vitest';
import {
  enqueueScrollSolutions,
  getNextScrollSolutionPop,
  getScrollSolutionResultClass,
  getScrollSolutionVisibleLimit,
  type QueuedScrollSolutionItem,
} from '@client/modules/live/live-scroll-solution-state';

function makeSolution(result: QueuedScrollSolutionItem['result']): QueuedScrollSolutionItem {
  return {
    problemAlias: 'A',
    result,
    solved: 1,
    user: {
      id: `team-${result}`,
      name: `Team ${result}`,
    },
  };
}

describe('live scroll-solution state', () => {
  it('uses the legacy default visible limit and row height', () => {
    expect(getScrollSolutionVisibleLimit()).toBe(20);
    expect(getScrollSolutionVisibleLimit(0)).toBe(20);
    expect(getScrollSolutionVisibleLimit(135)).toBe(3);
  });

  it('groups result labels into legacy visual classes', () => {
    expect(getScrollSolutionResultClass('FB')).toBe('result-fb');
    expect(getScrollSolutionResultClass('AC')).toBe('result-ac');
    expect(getScrollSolutionResultClass('WA')).toBe('result-rj');
    expect(getScrollSolutionResultClass('RJ')).toBe('result-rj');
    expect(getScrollSolutionResultClass('?')).toBe('result-fz');
    expect(getScrollSolutionResultClass('SKIPPED')).toBe('result-unknown');
  });

  it('keeps FB solutions out of the queue for immediate display', () => {
    const queued = [makeSolution('WA')];
    const next = enqueueScrollSolutions(queued, [makeSolution('FB'), makeSolution('AC')]);

    expect(next.immediate.map((item) => item.result)).toEqual(['FB']);
    expect(next.queue.map((item) => item.result)).toEqual(['WA', 'AC']);
    expect(queued.map((item) => item.result)).toEqual(['WA']);
  });

  it('uses the legacy display delay and fast interval while the queue fits on screen', () => {
    expect(getNextScrollSolutionPop({ queueLength: 3, visibleLimit: 20, result: 'AC' })).toEqual({
      delay: 20000,
      interval: 100,
    });
  });

  it('accelerates display delay and interval when the queue exceeds the visible limit', () => {
    expect(getNextScrollSolutionPop({ queueLength: 40, visibleLimit: 20, result: 'WA' })).toEqual({
      delay: 1100,
      interval: 1,
    });
  });
});
