import { describe, expect, test } from 'vitest';
import { scheduleRankTimeCalculation } from './rank-time-scheduler';

describe('scheduleRankTimeCalculation', () => {
  test('waits until after a paint opportunity before running heavy rank-time work', () => {
    const frames: Array<FrameRequestCallback> = [];
    const timers: Array<() => void> = [];
    const win = {
      requestAnimationFrame(callback: FrameRequestCallback) {
        frames.push(callback);
        return frames.length;
      },
      setTimeout(callback: () => void) {
        timers.push(callback);
        return timers.length;
      },
    } as unknown as Window;

    const calls: string[] = [];
    scheduleRankTimeCalculation(() => calls.push('calculated'), win);

    expect(calls).toEqual([]);
    expect(frames).toHaveLength(1);

    frames.shift()!(16);

    expect(calls).toEqual([]);
    expect(frames).toHaveLength(0);
    expect(timers).toHaveLength(1);

    timers.shift()!();

    expect(calls).toEqual(['calculated']);
  });
});
