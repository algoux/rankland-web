import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LiveScrollSolutionItem } from '@/services/ranklist-api/live-contest-types';
import { createScrollSolutionState } from './scroll-solution-state';

const accepted: LiveScrollSolutionItem = {
  problem: { alias: 'A' },
  score: { value: 1 },
  result: 'AC',
  user: {
    name: 'Alice',
    organization: 'RankLand',
  },
};

describe('scroll solution state', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clears visible items, queued items, and stale timers on reset', () => {
    const state = createScrollSolutionState({
      getPopLimit: () => 20,
      scheduler: {
        setTimeout: (callback, delay) => Number(setTimeout(callback, delay)),
        clearTimeout: (timer) => clearTimeout(timer),
      },
    });
    state.start();
    state.pushSolutions([accepted]);
    vi.advanceTimersByTime(200);
    expect(state.visibleItems.value).toHaveLength(1);

    state.pushSolutions([{ ...accepted, problem: { alias: 'B' } }]);
    state.resetSolutions();
    expect(state.visibleItems.value).toEqual([]);

    vi.advanceTimersByTime(30_000);
    expect(state.visibleItems.value).toEqual([]);
    state.stop();
  });

  it('shows first blood immediately and resets its dismissal timer', () => {
    const state = createScrollSolutionState({
      getPopLimit: () => 20,
      scheduler: {
        setTimeout: (callback, delay) => Number(setTimeout(callback, delay)),
        clearTimeout: (timer) => clearTimeout(timer),
      },
    });
    state.start();
    state.pushSolutions([{ ...accepted, result: 'FB' }]);
    expect(state.visibleItems.value).toHaveLength(1);

    state.resetSolutions();
    vi.advanceTimersByTime(180_000);
    expect(state.visibleItems.value).toEqual([]);
    state.stop();
  });

  it('bounds active dismissal timers to the visible pop limit', () => {
    let nextTimer = 1;
    const activeTimers = new Set<number>();
    const clearedTimers: number[] = [];
    const state = createScrollSolutionState({
      getPopLimit: () => 2,
      scheduler: {
        setTimeout: () => {
          const timer = nextTimer;
          nextTimer += 1;
          activeTimers.add(timer);
          return timer;
        },
        clearTimeout: (timer) => {
          activeTimers.delete(timer);
          clearedTimers.push(timer);
        },
      },
    });
    state.start();

    state.pushSolutions([
      { ...accepted, result: 'FB', problem: { alias: 'A' } },
      { ...accepted, result: 'FB', problem: { alias: 'B' } },
      { ...accepted, result: 'FB', problem: { alias: 'C' } },
    ]);

    expect(state.visibleItems.value.map((item) => item.data.problem.alias)).toEqual(['B', 'C']);
    expect(clearedTimers).toContain(1);
    expect(activeTimers.size).toBeLessThanOrEqual(2);

    state.stop();
    expect(activeTimers.size).toBe(0);
    expect(state.visibleItems.value).toEqual([]);
  });
});
