import { rankland_live_contest_common, rankland_live_contest_producer } from '@common/proto/rankland_live_contest';
import Long from 'long';
import { CONTEST_UK } from './config';

type ProducerEvent = rankland_live_contest_producer.IProducerEvent;

const EventType = rankland_live_contest_common.EventType;
const Result = rankland_live_contest_common.Result;
const TimeUnit = rankland_live_contest_common.TimeUnit;

export const contestFixture = {
  uk: CONTEST_UK,
  name: 'Temporary Live Contest',
  contest: {
    title: 'Temporary Live Contest',
    startAt: '2026-06-06T18:00:00+08:00',
    duration: [5, 'h'],
    frozenDuration: [1, 'h'],
    refLinks: [{ title: 'local public page', link: `/api/v2/public/contests/${CONTEST_UK}` }],
  },
  problems: [
    {
      alias: 'A',
      title: 'Array Forge',
      link: 'https://example.com/problems/A',
      statistics: { accepted: 0, submitted: 0 },
    },
    {
      alias: 'B',
      title: 'Binary Meadow',
      link: 'https://example.com/problems/B',
      statistics: { accepted: 0, submitted: 0 },
    },
    {
      alias: 'C',
      title: 'Clockwork Query',
      link: 'https://example.com/problems/C',
      statistics: { accepted: 0, submitted: 0 },
    },
  ],
  users: [
    {
      id: 'team-001',
      name: 'Team Alpha',
      organization: 'Algoux Lab',
      location: 'Shanghai',
      official: true,
      markers: ['onsite'],
      teamMembers: [{ name: 'Alice' }, { name: 'Aster' }],
      broadcasterToken: 'tmp-token-team-001',
    },
    {
      id: 'team-002',
      name: 'Team Beta',
      organization: 'Rankland University',
      location: 'Beijing',
      official: true,
      markers: ['onsite'],
      teamMembers: [{ name: 'Bob' }, { name: 'Bianca' }],
      broadcasterToken: 'tmp-token-team-002',
    },
    {
      id: 'team-003',
      name: 'Team Gamma',
      organization: 'Remote Guild',
      location: 'Hangzhou',
      official: true,
      markers: ['remote'],
      teamMembers: [{ name: 'Gina' }],
      broadcasterToken: 'tmp-token-team-003',
    },
    {
      id: 'team-004',
      name: 'Team Delta',
      organization: 'Practice Only',
      location: 'Guangzhou',
      official: false,
      markers: ['remote', 'practice'],
      teamMembers: [{ name: 'Dylan' }],
      broadcasterToken: 'tmp-token-team-004',
    },
  ],
  markers: [
    { id: 'onsite', label: 'Onsite', style: { textColor: '#0f172a', backgroundColor: '#bae6fd' } },
    { id: 'remote', label: 'Remote', style: { textColor: '#14532d', backgroundColor: '#bbf7d0' } },
    { id: 'practice', label: 'Practice', style: { textColor: '#7f1d1d', backgroundColor: '#fecaca' } },
  ],
  series: [
    {
      title: '#',
      segments: [
        { title: 'Leader', style: 'gold' },
        { title: 'Podium Chase', style: 'silver' },
        { title: 'Bubble', style: 'bronze' },
      ],
      rule: {
        preset: 'ICPC',
        options: {
          count: {
            value: [1, 1, 1],
            noTied: true,
          },
        },
      },
    },
  ],
  sorter: {
    algorithm: 'ICPC',
    config: {
      noPenaltyResults: ['FB', 'AC', '?', 'NOUT', 'CE', 'UKE', null],
      penalty: [20, 'min'],
    },
  },
};

export const eventFixtures: Record<number, ProducerEvent[]> = {
  1: [
    newSolution(1, 1001, 'team-001', 'A', 5 * 60),
    progress(2, 1001, 35),
    progress(3, 1001, 90),
    settle(4, 1001, Result.AC, 17 * 60),
    newSolution(5, 1002, 'team-002', 'A', 9 * 60),
    progress(6, 1002, 55),
    settle(7, 1002, Result.WA, 24 * 60),
    newSolution(8, 1003, 'team-003', 'B', 18 * 60),
    progress(9, 1003, 25),
    changeResult(10, 1002, Result.WA, Result.AC, 41 * 60),
    configChange(11),
    settle(12, 1003, Result.AC, 55 * 60),
  ],
  2: [
    newSolution(1, 2001, 'team-004', 'C', 7 * 60),
    progress(2, 2001, 50),
    settle(3, 2001, Result.AC, 15 * 60),
    newSolution(4, 2002, 'team-001', 'B', 16 * 60),
    settle(5, 2002, Result.WA, 25 * 60),
    changeResult(6, 2002, Result.WA, Result.AC, 32 * 60),
    newSolution(7, 2003, 'team-002', 'C', 37 * 60),
    progress(8, 2003, 80),
  ],
  3: [
    newSolution(1, 3001, 'team-003', 'A', 2 * 60 * 60),
    settle(2, 3001, Result.AC, 2 * 60 * 60 + 12 * 60),
    newSolution(3, 3002, 'team-001', 'C', 4 * 60 * 60 + 5 * 60),
    progress(4, 3002, 40),
    settle(5, 3002, Result.WA, 4 * 60 * 60 + 25 * 60),
    newSolution(6, 3003, 'team-002', 'B', 4 * 60 * 60 + 35 * 60),
    progress(7, 3003, 70),
  ],
};

export function getFixtureEvents(revision: number): ProducerEvent[] {
  const events = eventFixtures[revision];
  if (!events) {
    throw new Error(
      `No event fixture for revision ${revision}. Available revisions: ${Object.keys(eventFixtures).join(', ')}`,
    );
  }
  return events;
}

function seconds(value: number) {
  return { value: Long.fromNumber(value), unit: TimeUnit.S };
}

function newSolution(
  eventId: number,
  solutionId: number,
  userId: string,
  problemAlias: string,
  timeSeconds: number,
): ProducerEvent {
  return {
    eventId,
    type: EventType.NEW_SOLUTION,
    newSolutionData: {
      solutionId,
      userId,
      problemAlias,
      time: seconds(timeSeconds),
    },
  };
}

function progress(eventId: number, solutionId: number, percentageProgress: number): ProducerEvent {
  return {
    eventId,
    type: EventType.SOLUTION_ON_PROGRESS,
    solutionOnProgressData: {
      solutionId,
      percentageProgress,
    },
  };
}

function settle(
  eventId: number,
  solutionId: number,
  result: rankland_live_contest_common.Result,
  timeSeconds: number,
): ProducerEvent {
  return {
    eventId,
    type: EventType.SOLUTION_ON_RESULT_SETTLE,
    solutionOnResultSettleData: {
      solutionId,
      result,
      time: seconds(timeSeconds),
    },
  };
}

function changeResult(
  eventId: number,
  solutionId: number,
  previousResult: rankland_live_contest_common.Result,
  result: rankland_live_contest_common.Result,
  timeSeconds: number,
): ProducerEvent {
  return {
    eventId,
    type: EventType.SOLUTION_ON_RESULT_CHANGE,
    solutionOnResultChangeData: {
      solutionId,
      previousResult,
      result,
      time: seconds(timeSeconds),
    },
  };
}

function configChange(eventId: number): ProducerEvent {
  return {
    eventId,
    type: EventType.CONTEST_CONFIG_CHANGE,
    contestConfigChangeData: {},
  };
}
