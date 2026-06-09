import { describe, expect, it } from 'vitest';
import { formatSrkContestTimeRange, secToTimeStr } from './time-format.util';

describe('time-format util', () => {
  it('formats contest ranges using the explicit srk timezone when present', () => {
    expect(formatSrkContestTimeRange('2026-06-01T09:30:00+08:00', [5, 'h'])).toEqual({
      startText: '2026-06-01 09:30:00',
      endText: '2026-06-01 14:30:00 +08:00',
      timezoneSource: 'srk-offset',
      sourceOffset: '+08:00',
    });
  });

  it('formats seconds like the legacy renderer helpers', () => {
    expect(secToTimeStr(3661)).toBe('01:01:01');
    expect(secToTimeStr(90061, true)).toBe('1D 01:01:01');
    expect(secToTimeStr(-1)).toBe('--');
  });
});
