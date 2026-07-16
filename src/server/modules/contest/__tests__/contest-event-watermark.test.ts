import {
  compareContestEventWatermarks,
  isContestEventWatermark,
  latestContestEventWatermark,
} from '../contest-event-watermark';

describe('contest event watermark', () => {
  it('orders stream revision before event id', () => {
    const previous = { streamRevision: 1, latestEventId: 100 };
    const reset = { streamRevision: 2, latestEventId: 0 };

    expect(compareContestEventWatermarks(reset, previous)).toBeGreaterThan(0);
    expect(compareContestEventWatermarks(previous, reset)).toBeLessThan(0);
    expect(latestContestEventWatermark(previous, reset)).toEqual(reset);
  });

  it('orders event ids within one revision and keeps equal watermarks stable', () => {
    const first = { streamRevision: 3, latestEventId: 7 };
    const later = { streamRevision: 3, latestEventId: 8 };

    expect(compareContestEventWatermarks(later, first)).toBeGreaterThan(0);
    expect(compareContestEventWatermarks(first, first)).toBe(0);
    expect(latestContestEventWatermark(first, later)).toBe(later);
    expect(latestContestEventWatermark(first, { ...first })).toBe(first);
  });

  it('accepts only positive revisions and safe non-negative event ids', () => {
    expect(isContestEventWatermark({ streamRevision: 1, latestEventId: 0 })).toBe(true);
    expect(isContestEventWatermark({ streamRevision: 0, latestEventId: 0 })).toBe(false);
    expect(isContestEventWatermark({ streamRevision: 1, latestEventId: -1 })).toBe(false);
    expect(isContestEventWatermark({ streamRevision: 1, latestEventId: Number.MAX_SAFE_INTEGER + 1 })).toBe(false);
    expect(isContestEventWatermark({ streamRevision: 1.5, latestEventId: 0 })).toBe(false);
  });
});
