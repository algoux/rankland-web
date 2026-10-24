import { describe, expect, it, vi } from 'vitest';
import { ContestStatus } from '@common/modules/contest/contest-status';
import type { LiveContestConfig, LiveContestEvent } from '@/services/ranklist-api/live-contest-types';
import { LiveRanklistProjector } from './live-ranklist-projector';

function config(overrides: Partial<LiveContestConfig> = {}): LiveContestConfig {
  return {
    uk: 'summer-2026',
    name: 'Summer Contest',
    contest: {
      title: 'Summer Contest',
      startAt: '2026-07-24T00:00:00.000Z',
      duration: [300, 's'],
      frozenDuration: [60, 's'],
    },
    problems: [{ alias: 'A' }, { alias: 'B' }],
    users: [
      { id: 'alice', name: 'Alice' },
      { id: 'bob', name: 'Bob' },
    ],
    markers: [],
    series: [],
    sorter: {
      algorithm: 'ICPC',
      config: {
        penalty: [20, 'min'],
      },
    },
    contributors: [],
    ...overrides,
  };
}

function newSolution(
  eventId: number,
  solutionId: number,
  userId: string,
  problemAlias: string,
  seconds: number,
): Extract<LiveContestEvent, { type: 'NEW' }> {
  return {
    eventId,
    type: 'NEW',
    solutionId,
    userId,
    problemAlias,
    time: [seconds, 's'],
    timeNs: `${seconds}000000000`,
  };
}

function settle(
  eventId: number,
  solutionId: number,
  result: 'AC' | 'WA',
): Extract<LiveContestEvent, { type: 'SETTLE' }> {
  return {
    eventId,
    type: 'SETTLE',
    solutionId,
    result,
    time: [eventId, 's'],
  };
}

function change(
  eventId: number,
  solutionId: number,
  previousResult: 'AC' | 'WA',
  result: 'AC' | 'WA',
): Extract<LiveContestEvent, { type: 'CHANGE' }> {
  return {
    eventId,
    type: 'CHANGE',
    solutionId,
    previousResult,
    result,
    time: [eventId, 's'],
  };
}

function rowByUser(projector: LiveRanklistProjector, userId: string) {
  return projector.current.rows.find((row) => row.user.id === userId)!;
}

describe('LiveRanklistProjector', () => {
  it('builds the initial ranklist without historical rolling items', () => {
    const projector = new LiveRanklistProjector(config());

    const ranklist = projector.applyInitial([
      newSolution(1, 101, 'alice', 'A', 100),
      settle(2, 101, 'AC'),
      newSolution(3, 102, 'bob', 'A', 90),
      settle(4, 102, 'WA'),
    ]);

    expect(ranklist.version).toBe('0.3.13');
    expect(ranklist.rows.map((row) => row.user.id)).toEqual(['alice', 'bob']);
    expect(rowByUser(projector, 'alice')).toMatchObject({
      score: { value: 1 },
      statuses: [{
        result: 'FB',
        solutions: [{ result: 'FB' }],
      }, { result: null }],
    });
    expect(rowByUser(projector, 'bob')).toMatchObject({
      score: { value: 0 },
      statuses: [{ result: 'RJ' }, { result: null }],
    });
  });

  it('ingests initial pages without publishing intermediate ranklists', () => {
    const projector = new LiveRanklistProjector(config());
    const before = projector.current;

    projector.ingestInitial([
      newSolution(1, 101, 'alice', 'A', 100),
      settle(2, 101, 'AC'),
    ]);

    expect(projector.current).toBe(before);
    expect(rowByUser(projector, 'alice').score.value).toBe(0);

    const ranklist = projector.finishInitial();
    expect(ranklist).not.toBe(before);
    expect(rowByUser(projector, 'alice').score.value).toBe(1);
    expect(rowByUser(projector, 'alice').statuses[0].result).toBe('FB');
  });

  it('rebuilds a changed user, transfers first blood, and emits prev-to-after rolling data', () => {
    const projector = new LiveRanklistProjector(config());
    projector.applyInitial([
      newSolution(1, 101, 'alice', 'A', 100),
      settle(2, 101, 'AC'),
      newSolution(3, 102, 'bob', 'A', 90),
      settle(4, 102, 'WA'),
    ]);

    const { ranklist, scrollItems } = projector.applyLive([
      change(5, 102, 'WA', 'AC'),
    ]);

    expect(ranklist.rows.map((row) => row.user.id)).toEqual(['bob', 'alice']);
    expect(rowByUser(projector, 'bob').statuses[0].result).toBe('FB');
    expect(rowByUser(projector, 'bob').statuses[0].solutions).toEqual([
      expect.objectContaining({ result: 'FB' }),
    ]);
    expect(rowByUser(projector, 'alice').statuses[0].result).toBe('AC');
    expect(rowByUser(projector, 'alice').statuses[0].solutions).toEqual([
      expect.objectContaining({ result: 'AC' }),
    ]);
    expect(scrollItems).toEqual([
      {
        problem: { alias: 'A' },
        score: { value: 1 },
        previousResult: 'WA',
        result: 'FB',
        user: {
          name: 'Bob',
          organization: undefined,
        },
      },
    ]);
  });

  it('derives frozen NEW as question mark and ignores progress/config changes', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const projector = new LiveRanklistProjector(config());

    const { scrollItems } = projector.applyLive([
      newSolution(1, 201, 'alice', 'B', 240),
      {
        eventId: 2,
        type: 'PROGRESS',
        solutionId: 201,
        percentageProgress: 50,
        time: [241, 's'],
      },
      {
        eventId: 3,
        type: 'CONFIG_CHANGE',
        changedFields: ['problems'],
      },
    ]);

    expect(rowByUser(projector, 'alice').statuses[1].result).toBe('?');
    expect(scrollItems).toEqual([
      expect.objectContaining({
        problem: { alias: 'B' },
        result: '?',
      }),
    ]);
    expect(warn).toHaveBeenCalledWith(
      '[LiveRanklistProjector] ignored contest config change',
      ['problems'],
    );
    warn.mockRestore();
  });

  it('uses an inclusive nanosecond freeze boundary', () => {
    const projector = new LiveRanklistProjector(config());

    projector.applyInitial([
      {
        ...newSolution(1, 201, 'alice', 'A', 239),
        time: [239.999999999, 's'],
        timeNs: '239999999999',
      },
      {
        ...newSolution(2, 202, 'alice', 'B', 240),
        timeNs: '240000000000',
      },
    ]);

    expect(rowByUser(projector, 'alice').statuses[0].result).toBeNull();
    expect(rowByUser(projector, 'alice').statuses[1].result).toBe('?');
  });

  it('clamps an overlong freeze duration to the contest start', () => {
    const projector = new LiveRanklistProjector(config({
      contest: {
        ...config().contest,
        frozenDuration: [360, 's'],
      },
    }));

    projector.applyInitial([
      newSolution(1, 201, 'alice', 'A', 0),
    ]);

    expect(rowByUser(projector, 'alice').statuses[0].result).toBe('?');
  });

  it('rejects aliases that collide after default alias normalization', () => {
    expect(() => new LiveRanklistProjector(config({
      problems: [{}, { alias: 'A' }],
    }))).toThrow('Live contest problem aliases must be unique: A');
  });

  it('reveals a frozen solution when its final settlement arrives', () => {
    const projector = new LiveRanklistProjector(config());
    projector.applyInitial([
      newSolution(1, 201, 'alice', 'B', 240),
    ]);

    const pending = projector.applyLive([
      {
        eventId: 2,
        type: 'SETTLE',
        solutionId: 201,
        result: 'JG',
        time: [241, 's'],
      },
    ]);
    expect(rowByUser(projector, 'alice').statuses[1].result).toBe('?');
    expect(pending.scrollItems).toEqual([]);

    const { scrollItems } = projector.applyLive([
      settle(3, 201, 'AC'),
    ]);

    expect(rowByUser(projector, 'alice').statuses[1].result).toBe('FB');
    expect(scrollItems).toEqual([
      expect.objectContaining({
        problem: { alias: 'B' },
        result: 'FB',
      }),
    ]);
  });

  it('transfers first blood away from a changed accepted solution', () => {
    const projector = new LiveRanklistProjector(config());
    projector.applyInitial([
      newSolution(1, 101, 'alice', 'A', 100),
      settle(2, 101, 'AC'),
      newSolution(3, 102, 'bob', 'A', 110),
      settle(4, 102, 'AC'),
    ]);

    projector.applyLive([
      change(5, 101, 'AC', 'WA'),
    ]);

    expect(rowByUser(projector, 'bob').statuses[0].result).toBe('FB');
    expect(rowByUser(projector, 'alice').statuses[0].result).toBe('RJ');
  });

  it('keeps first blood correct across root and non-root accepted-heap removals', () => {
    const projector = new LiveRanklistProjector(config({
      users: [
        { id: 'alice', name: 'Alice' },
        { id: 'bob', name: 'Bob' },
        { id: 'carol', name: 'Carol' },
        { id: 'dave', name: 'Dave' },
      ],
    }));
    projector.applyInitial([
      newSolution(1, 101, 'alice', 'A', 30),
      settle(2, 101, 'AC'),
      newSolution(3, 102, 'bob', 'A', 10),
      settle(4, 102, 'AC'),
      newSolution(5, 103, 'carol', 'A', 20),
      settle(6, 103, 'AC'),
      newSolution(7, 104, 'dave', 'A', 5),
      settle(8, 104, 'AC'),
    ]);

    projector.applyLive([change(9, 101, 'AC', 'WA')]);
    expect(rowByUser(projector, 'dave').statuses[0].result).toBe('FB');

    projector.applyLive([change(10, 104, 'AC', 'WA')]);
    expect(rowByUser(projector, 'bob').statuses[0].result).toBe('FB');

    projector.applyLive([change(11, 101, 'WA', 'AC')]);
    expect(rowByUser(projector, 'bob').statuses[0].result).toBe('FB');

    projector.applyLive([change(12, 102, 'AC', 'WA')]);
    expect(rowByUser(projector, 'carol').statuses[0].result).toBe('FB');
  });

  it('keeps each rolling result tied to its event within one batch', () => {
    const projector = new LiveRanklistProjector(config());
    projector.applyInitial([
      newSolution(1, 101, 'alice', 'A', 100),
    ]);

    const { scrollItems } = projector.applyLive([
      settle(2, 101, 'AC'),
      change(3, 101, 'AC', 'WA'),
    ]);

    expect(scrollItems).toEqual([
      expect.objectContaining({
        result: 'AC',
      }),
      expect.objectContaining({
        previousResult: 'AC',
        result: 'WA',
      }),
    ]);
  });

  it('publishes fresh ranklist and rows references for an ignored progress batch', () => {
    const projector = new LiveRanklistProjector(config());
    const previousRanklist = projector.current;
    const previousRows = previousRanklist.rows;

    const { ranklist } = projector.applyLive([
      {
        eventId: 1,
        type: 'PROGRESS',
        solutionId: 201,
        percentageProgress: 50,
        time: [1, 's'],
      },
    ]);

    expect(ranklist).not.toBe(previousRanklist);
    expect(ranklist.rows).not.toBe(previousRows);
  });

  it('does not treat pending, judging, or cancelled results as settled', () => {
    const projector = new LiveRanklistProjector(config());
    projector.applyInitial([
      newSolution(1, 301, 'alice', 'A', 100),
    ]);

    for (const [index, result] of (['PD', 'JG', 'CNL'] as const).entries()) {
      const { scrollItems } = projector.applyLive([
        {
          eventId: index + 2,
          type: 'SETTLE',
          solutionId: 301,
          result,
          time: [index + 101, 's'],
        },
      ]);
      expect(scrollItems).toEqual([]);
      expect(rowByUser(projector, 'alice').statuses[0].result).toBeNull();
    }
  });

  it('keeps deprecated frozen results hidden through later pending updates', () => {
    const projector = new LiveRanklistProjector(config());
    projector.applyInitial([
      newSolution(1, 301, 'alice', 'A', 100),
      {
        eventId: 2,
        type: 'SETTLE',
        solutionId: 301,
        result: '?',
        time: [101, 's'],
      },
    ]);

    projector.applyLive([
      {
        eventId: 3,
        type: 'SETTLE',
        solutionId: 301,
        result: 'JG',
        time: [102, 's'],
      },
    ]);

    expect(rowByUser(projector, 'alice').statuses[0].result).toBe('?');
  });

  it.each([
    [undefined, '?'],
    [ContestStatus.Created, '?'],
    [ContestStatus.Finalized, null],
  ] as const)('projects a cancelled frozen submission with contest status %s as %s', (status, expected) => {
    const projector = new LiveRanklistProjector(config({ status }));
    projector.applyInitial([
      newSolution(1, 301, 'alice', 'A', 250),
      { eventId: 2, type: 'SETTLE', solutionId: 301, result: 'CNL', time: [251, 's'] },
    ]);
    expect(rowByUser(projector, 'alice').statuses[0].result).toBe(expected);
    if (status === ContestStatus.Finalized) expect(rowByUser(projector, 'alice').statuses[0].solutions).toEqual([]);
  });

  it('recomputes inferred freeze visibility when resetting to finalized or created metadata', () => {
    const events: LiveContestEvent[] = [
      newSolution(1, 301, 'alice', 'A', 250),
      { eventId: 2, type: 'SETTLE', solutionId: 301, result: 'CNL', time: [251, 's'] },
    ];
    const projector = new LiveRanklistProjector(config({ status: ContestStatus.Created }));
    projector.applyInitial(events);
    expect(rowByUser(projector, 'alice').statuses[0].result).toBe('?');

    projector.reset(config({ status: ContestStatus.Finalized }));
    projector.applyInitial(events);
    expect(rowByUser(projector, 'alice').statuses[0].result).toBeNull();
    projector.reset();
    projector.applyInitial(events);
    expect(rowByUser(projector, 'alice').statuses[0].result).toBeNull();

    projector.reset(config({ status: ContestStatus.Created }));
    projector.applyInitial(events);
    expect(rowByUser(projector, 'alice').statuses[0].result).toBe('?');
  });

  it('preserves an explicit disabled freeze inference for final archive construction and resets', () => {
    const projector = new LiveRanklistProjector(config({ status: ContestStatus.Created }), { inferFrozenSolutions: false });
    for (const status of [ContestStatus.Created, ContestStatus.Finalized] as const) {
      projector.reset(config({ status }));
      projector.applyInitial([
        newSolution(1, 301, 'alice', 'A', 250),
        { eventId: 2, type: 'SETTLE', solutionId: 301, result: 'CNL', time: [251, 's'] },
      ]);
      expect(rowByUser(projector, 'alice').statuses[0].result).toBeNull();
    }
  });

  it('creates event-derived rows while preserving score or missing sorter metadata', () => {
    const scoreProjector = new LiveRanklistProjector(config({
      sorter: {
        algorithm: 'score',
        config: {},
      },
    }));
    scoreProjector.applyInitial([
      newSolution(1, 101, 'alice', 'A', 100),
      settle(2, 101, 'AC'),
    ]);
    expect(scoreProjector.current.sorter).toEqual({
      algorithm: 'score',
      config: {},
    });
    expect(rowByUser(scoreProjector, 'alice').score.value).toBe(1);

    const unsortedProjector = new LiveRanklistProjector(config({ sorter: undefined }));
    unsortedProjector.applyInitial([
      newSolution(1, 101, 'alice', 'A', 100),
      settle(2, 101, 'AC'),
    ]);
    expect(unsortedProjector.current.sorter).toBeUndefined();
    expect(rowByUser(unsortedProjector, 'alice').score.value).toBe(1);
  });
});
