import { describe, expect, it } from 'vitest';
import type { LiveContestConfig } from '@common/modules/contest/live-contest-types';
import { ErrCode } from '@common/enums/err-code.enum';
import { rankland_live_contest_common as proto } from '@common/proto/rankland_live_contest';
import { FinalContestRanklistBuilder } from '../contest-final-ranklist';
import { eventToStoredEventInput } from '../contest-event-codec';
import type { ContestProducerEventBO } from '../contest-event-bo';
import type { ContestReadableEvent } from '../contest-event-store';

function config(overrides: Partial<LiveContestConfig> = {}): LiveContestConfig {
  return {
    uk: 'final-contest',
    name: 'Final Contest',
    contest: {
      title: { fallback: 'Final Contest' },
      startAt: '2026-10-24T00:00:00Z',
      duration: [300, 's'],
      frozenDuration: [60, 's'],
      refLinks: [{ link: 'https://example.com', title: 'Contest' }],
    },
    problems: [{ alias: 'A' }, { alias: 'B' }],
    users: [{ id: 'alice', name: 'Alice' }, { id: 'bob', name: 'Bob' }],
    markers: [],
    series: [],
    sorter: { algorithm: 'ICPC', config: { penalty: [20, 'min'] } },
    contributors: [],
    ...overrides,
  };
}

function stored(event: ContestProducerEventBO): ContestReadableEvent {
  return {
    ...eventToStoredEventInput(event, 'test-producer'),
    contestId: '123',
    streamRevision: 1,
  };
}

function submission(
  eventId: number,
  solutionId: number,
  userId = 'alice',
  problemAlias = 'A',
  time = '250000000000',
): ContestReadableEvent {
  return stored({
    eventId,
    type: proto.EventType.NEW_SOLUTION,
    newSolutionData: { solutionId, userId, problemAlias, time: { value: time, unit: proto.TimeUnit.NS } },
  });
}

function settle(eventId: number, solutionId: number, result = proto.Result.AC): ContestReadableEvent {
  return stored({
    eventId,
    type: proto.EventType.SOLUTION_ON_RESULT_SETTLE,
    solutionOnResultSettleData: {
      solutionId,
      result,
      time: { value: '290', unit: proto.TimeUnit.S },
    },
  });
}

function change(
  eventId: number,
  solutionId: number,
  previousResult: proto.Result,
  result: proto.Result,
): ContestReadableEvent {
  return stored({
    eventId,
    type: proto.EventType.SOLUTION_ON_RESULT_CHANGE,
    solutionOnResultChangeData: {
      solutionId,
      previousResult,
      result,
      time: { value: '295', unit: proto.TimeUnit.S },
    },
  });
}

function progress(eventId: number, solutionId: number): ContestReadableEvent {
  return stored({
    eventId,
    type: proto.EventType.SOLUTION_ON_PROGRESS,
    solutionOnProgressData: { solutionId, percentageProgress: 50 },
  });
}

describe('FinalContestRanklistBuilder', () => {
  it('returns all users and contest metadata for an empty stream', () => {
    const input = config();
    const result = new FinalContestRanklistBuilder(input).finish();
    expect(result).toMatchObject({
      contest: input.contest,
      problems: input.problems,
      markers: input.markers,
      series: input.series,
      sorter: input.sorter,
      contributors: input.contributors,
    });
    expect(result.rows.map((row) => row.user.id)).toEqual(['alice', 'bob']);
    expect(result.rows.every((row) => row.score.value === 0)).toBe(true);
  });

  it('builds the unfrozen final ranklist across page boundaries and applies ICPC penalties', () => {
    const builder = new FinalContestRanklistBuilder(config());
    builder.ingest([submission(1, 101), progress(2, 101)]);
    builder.ingest([settle(3, 101, proto.Result.WA), submission(4, 102, 'alice', 'A', '260000000000')]);
    builder.ingest([settle(5, 102)]);

    const result = builder.finish();
    const alice = result.rows.find((row) => row.user.id === 'alice')!;
    expect(alice.score).toEqual({ value: 1, time: [1460000, 'ms'] });
    expect(alice.statuses[0]).toMatchObject({
      result: 'FB',
      solutions: [{ result: 'WA', time: [250, 's'] }, { result: 'FB', time: [260, 's'] }],
    });
    expect(result.contest.frozenDuration).toEqual([60, 's']);
  });

  it('uses the final rejudge result and nanosecond submission order for first blood', () => {
    const builder = new FinalContestRanklistBuilder(config());
    builder.ingest([
      submission(1, 101, 'alice', 'A', '250000000002'),
      settle(2, 101),
      submission(3, 102, 'bob', 'A', '250000000001'),
      settle(4, 102, proto.Result.WA),
    ]);
    builder.ingest([change(5, 102, proto.Result.WA, proto.Result.AC)]);

    const result = builder.finish();
    expect(result.rows.find((row) => row.user.id === 'bob')!.statuses[0].result).toBe('FB');
    expect(result.rows.find((row) => row.user.id === 'alice')!.statuses[0].result).toBe('AC');
  });

  it('moves first blood after an accepted solution is rejected', () => {
    const builder = new FinalContestRanklistBuilder(config());
    builder.ingest([
      submission(1, 101, 'alice', 'A', '240000000000'),
      settle(2, 101),
      submission(3, 102, 'bob', 'A'),
      settle(4, 102),
      change(5, 101, proto.Result.AC, proto.Result.WA),
    ]);
    const result = builder.finish();
    expect(result.rows[0].user.id).toBe('bob');
    expect(result.rows[0].statuses[0].result).toBe('FB');
    expect(result.rows.find((row) => row.user.id === 'alice')!.score.value).toBe(0);
  });

  it('normalizes missing problem aliases and accepts deprecated FB as an accepted result', () => {
    const builder = new FinalContestRanklistBuilder(config({ problems: [{}] }));
    builder.ingest([submission(1, 101), settle(2, 101, proto.Result.FB)]);
    expect(builder.finish().rows[0].statuses[0].result).toBe('FB');
  });

  it('uses current contest metadata while consuming configuration event ids', () => {
    const builder = new FinalContestRanklistBuilder(config());
    builder.ingest([
      stored({ eventId: 1, type: proto.EventType.CONTEST_CONFIG_CHANGE, contestConfigChangeData: {} }),
      submission(2, 101),
      settle(3, 101),
    ]);
    expect(builder.finish().contest.title).toEqual({ fallback: 'Final Contest' });
  });

  it('excludes cancelled submissions, including a cancellation after an explicit frozen result', () => {
    const builder = new FinalContestRanklistBuilder(config());
    builder.ingest([
      submission(1, 101),
      settle(2, 101, proto.Result.FZ),
      change(3, 101, proto.Result.FZ, proto.Result.CNL),
      submission(4, 102, 'bob'),
      settle(5, 102, proto.Result.CNL),
    ]);
    const result = builder.finish();
    expect(result.rows.every((row) => row.score.value === 0)).toBe(true);
    expect(result.rows.every((row) => row.statuses[0].solutions.length === 0)).toBe(true);
  });

  it.each([undefined, proto.Result.PD, proto.Result.JG, proto.Result.FZ])(
    'rejects a solution with unfinished final result %s',
    (result) => {
      const builder = new FinalContestRanklistBuilder(config());
      builder.ingest([submission(1, 101)]);
      if (result !== undefined) builder.ingest([settle(2, 101, result)]);
      expect(() => builder.finish()).toThrowError(expect.objectContaining({
        code: ErrCode.ContestFinalizationIncomplete,
        meta: { pendingCount: 1, pendingSolutionIds: [101] },
      }));
    },
  );

  it('rejects unfinished rejudging progress after a previously settled result', () => {
    const builder = new FinalContestRanklistBuilder(config());
    builder.ingest([submission(1, 101), settle(2, 101), progress(3, 101)]);
    expect(() => builder.finish()).toThrowError(expect.objectContaining({
      code: ErrCode.ContestFinalizationIncomplete,
    }));
    builder.ingest([change(4, 101, proto.Result.AC, proto.Result.WA)]);
    expect(builder.finish().rows.every((row) => row.score.value === 0)).toBe(true);
  });

  it('bounds unfinished-solution details while reporting the full pending count', () => {
    const builder = new FinalContestRanklistBuilder(config());
    builder.ingest(Array.from({ length: 25 }, (_, index) => submission(index + 1, index + 100)));
    expect(() => builder.finish()).toThrowError(expect.objectContaining({
      meta: { pendingCount: 25, pendingSolutionIds: Array.from({ length: 20 }, (_, index) => index + 100) },
    }));
  });

  it.each([
    ['initial event gap', [submission(2, 101)]],
    ['duplicate event id', [submission(1, 101), settle(1, 101)]],
    ['duplicate NEW', [submission(1, 101), submission(2, 101)]],
    ['unknown user', [submission(1, 101, 'missing')]],
    ['unknown problem', [submission(1, 101, 'alice', 'missing')]],
    ['missing NEW before SETTLE', [settle(1, 101)]],
    ['missing NEW before CHANGE', [change(1, 101, proto.Result.WA, proto.Result.AC)]],
    ['missing NEW before PROGRESS', [progress(1, 101)]],
  ] as const)('rejects %s', (_name, events) => {
    const builder = new FinalContestRanklistBuilder(config());
    expect(() => builder.ingest([...events])).toThrowError(expect.objectContaining({
      code: ErrCode.ContestFinalizationInvalidData,
    }));
  });

  it('detects a gap between pages', () => {
    const builder = new FinalContestRanklistBuilder(config());
    builder.ingest([submission(1, 101)]);
    expect(() => builder.ingest([settle(3, 101)])).toThrowError(expect.objectContaining({
      code: ErrCode.ContestFinalizationInvalidData,
      meta: { expectedEventId: 2, eventId: 3 },
    }));
  });

  it.each(['contestId', 'streamRevision'] as const)('rejects mixed %s across pages', (field) => {
    const builder = new FinalContestRanklistBuilder(config());
    builder.ingest([submission(1, 101)]);
    const event = settle(2, 101);
    if (field === 'contestId') event.contestId = 'other';
    else event.streamRevision = 2;
    expect(() => builder.ingest([event])).toThrowError(expect.objectContaining({
      code: ErrCode.ContestFinalizationInvalidData,
    }));
  });

  it('rejects stored metadata that disagrees with its decoded payload', () => {
    const builder = new FinalContestRanklistBuilder(config());
    expect(() => builder.ingest([{ ...submission(2, 101), eventId: 1 }])).toThrowError(expect.objectContaining({
      code: ErrCode.ContestFinalizationInvalidData,
    }));
  });

  it('rejects invalid stored protobuf without exposing it as an append-batch error', () => {
    const builder = new FinalContestRanklistBuilder(config());
    expect(() => builder.ingest([{ ...submission(1, 101), payloadBytes: Buffer.from([0xff]) }]))
      .toThrowError(expect.objectContaining({ code: ErrCode.ContestFinalizationInvalidData }));
  });

  it.each([
    { users: [{ id: 'alice', name: 'Alice' }, { id: 'alice', name: 'Duplicate' }] },
    { problems: [{}, { alias: 'A' }] },
  ])('rejects ambiguous contest configuration', (overrides) => {
    expect(() => new FinalContestRanklistBuilder(config(overrides))).toThrowError(expect.objectContaining({
      code: ErrCode.ContestFinalizationInvalidData,
    }));
  });
});
