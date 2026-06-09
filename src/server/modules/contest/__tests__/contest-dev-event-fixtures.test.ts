import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

import { rankland_live_contest_common } from '@common/proto/rankland_live_contest';
import { parseProducerBatchJson } from '../contest-event-codec';

type FixtureEvent = {
  eventId: number;
  type: string | number;
  newSolutionData?: { solutionId: number; userId?: string; problemAlias?: string };
  solutionOnProgressData?: { solutionId: number; percentageProgress: number };
  solutionOnResultSettleData?: { solutionId: number; result: string | number };
  solutionOnResultChangeData?: { solutionId: number; previousResult: string | number; result: string | number };
};

type SolutionState = {
  progressSinceLastResult: number[];
  settled: boolean;
};

const fixtureDir = path.resolve(__dirname, '../../../../../scripts/dev-contest/event-fixtures');

describe('dev contest event fixtures', () => {
  const fixtureFiles = fs.readdirSync(fixtureDir).filter((file) => file.endsWith('.json')).sort();

  it.each(fixtureFiles)('%s follows realistic progress/result event ordering', (file) => {
    const fixture = JSON.parse(fs.readFileSync(path.join(fixtureDir, file), 'utf8'));
    const events: FixtureEvent[] = Array.isArray(fixture) ? fixture : fixture.events;

    expect(events.length).toBeGreaterThan(0);
    expect(() => parseProducerBatchJson({ streamRevision: 1, events })).not.toThrow();

    const solutions = new Map<number, SolutionState>();
    for (const [index, event] of events.entries()) {
      expect(event.eventId, `${file} event index ${index}`).toBe(index + 1);
      const type = eventTypeName(event.type);

      if (type === 'NEW_SOLUTION') {
        const solutionId = event.newSolutionData?.solutionId;
        expect(solutionId, `${file} eventId=${event.eventId}`).toBeTypeOf('number');
        solutions.set(solutionId, { progressSinceLastResult: [], settled: false });
        continue;
      }

      if (type === 'SOLUTION_ON_PROGRESS') {
        const data = event.solutionOnProgressData;
        expect(data, `${file} eventId=${event.eventId}`).toBeTruthy();
        expect(data.percentageProgress, `${file} eventId=${event.eventId}`).toBeGreaterThanOrEqual(0);
        expect(data.percentageProgress, `${file} eventId=${event.eventId}`).toBeLessThanOrEqual(100);
        const state = expectSolution(solutions, data.solutionId, file, event.eventId);
        state.progressSinceLastResult.push(data.percentageProgress);
        continue;
      }

      if (type === 'SOLUTION_ON_RESULT_SETTLE') {
        const data = event.solutionOnResultSettleData;
        expect(data, `${file} eventId=${event.eventId}`).toBeTruthy();
        const state = expectSolution(solutions, data.solutionId, file, event.eventId);
        expectProgressBeforeResult(state.progressSinceLastResult, data.result, file, event.eventId, true);
        state.progressSinceLastResult = [];
        state.settled = true;
        continue;
      }

      if (type === 'SOLUTION_ON_RESULT_CHANGE') {
        const data = event.solutionOnResultChangeData;
        expect(data, `${file} eventId=${event.eventId}`).toBeTruthy();
        const state = expectSolution(solutions, data.solutionId, file, event.eventId);
        expect(state.settled, `${file} eventId=${event.eventId} change requires prior settle`).toBe(true);
        if (state.progressSinceLastResult.length > 0) {
          expectProgressBeforeResult(state.progressSinceLastResult, data.result, file, event.eventId, false);
          state.progressSinceLastResult = [];
        }
      }
    }
  });

  it('covers result changes with and without extra progress events before the change', () => {
    let changesWithProgress = 0;
    let changesWithoutProgress = 0;

    for (const file of fixtureFiles) {
      const fixture = JSON.parse(fs.readFileSync(path.join(fixtureDir, file), 'utf8'));
      const events: FixtureEvent[] = Array.isArray(fixture) ? fixture : fixture.events;
      const progressSinceLastResult = new Map<number, number>();

      for (const event of events) {
        const type = eventTypeName(event.type);
        if (type === 'NEW_SOLUTION') {
          progressSinceLastResult.set(event.newSolutionData.solutionId, 0);
        } else if (type === 'SOLUTION_ON_PROGRESS') {
          const solutionId = event.solutionOnProgressData.solutionId;
          progressSinceLastResult.set(solutionId, (progressSinceLastResult.get(solutionId) || 0) + 1);
        } else if (type === 'SOLUTION_ON_RESULT_SETTLE') {
          progressSinceLastResult.set(event.solutionOnResultSettleData.solutionId, 0);
        } else if (type === 'SOLUTION_ON_RESULT_CHANGE') {
          const solutionId = event.solutionOnResultChangeData.solutionId;
          if ((progressSinceLastResult.get(solutionId) || 0) > 0) {
            changesWithProgress += 1;
          } else {
            changesWithoutProgress += 1;
          }
          progressSinceLastResult.set(solutionId, 0);
        }
      }
    }

    expect(changesWithProgress).toBeGreaterThan(0);
    expect(changesWithoutProgress).toBeGreaterThan(0);
    expect(changesWithoutProgress).toBeGreaterThan(changesWithProgress);
  });

  it('covers a rejudge that transfers A first blood to team 1 second submission', () => {
    const fixture = JSON.parse(fs.readFileSync(path.join(fixtureDir, '05-rejudge-fb-transfer.json'), 'utf8'));
    const events: FixtureEvent[] = fixture.events;
    const milestones = events
      .filter((event) => eventTypeName(event.type) !== 'SOLUTION_ON_PROGRESS')
      .map((event) => {
        const type = eventTypeName(event.type);
        if (type === 'NEW_SOLUTION') {
          return {
            type,
            solutionId: event.newSolutionData?.solutionId,
            userId: event.newSolutionData?.userId,
            problemAlias: event.newSolutionData?.problemAlias,
          };
        }
        if (type === 'SOLUTION_ON_RESULT_SETTLE') {
          return {
            type,
            solutionId: event.solutionOnResultSettleData?.solutionId,
            result: resultName(event.solutionOnResultSettleData?.result),
          };
        }
        return {
          type,
          solutionId: event.solutionOnResultChangeData?.solutionId,
          previousResult: resultName(event.solutionOnResultChangeData?.previousResult),
          result: resultName(event.solutionOnResultChangeData?.result),
        };
      });

    expect(milestones).toEqual([
      { type: 'NEW_SOLUTION', solutionId: 5101, userId: 'team-001', problemAlias: 'A' },
      { type: 'SOLUTION_ON_RESULT_SETTLE', solutionId: 5101, result: 'WA' },
      { type: 'NEW_SOLUTION', solutionId: 5102, userId: 'team-001', problemAlias: 'A' },
      { type: 'SOLUTION_ON_RESULT_SETTLE', solutionId: 5102, result: 'TLE' },
      { type: 'NEW_SOLUTION', solutionId: 5103, userId: 'team-002', problemAlias: 'A' },
      { type: 'SOLUTION_ON_RESULT_SETTLE', solutionId: 5103, result: 'AC' },
      { type: 'NEW_SOLUTION', solutionId: 5104, userId: 'team-001', problemAlias: 'A' },
      { type: 'SOLUTION_ON_RESULT_SETTLE', solutionId: 5104, result: 'AC' },
      { type: 'SOLUTION_ON_RESULT_CHANGE', solutionId: 5102, previousResult: 'TLE', result: 'AC' },
    ]);
  });
});

function expectSolution(
  solutions: Map<number, SolutionState>,
  solutionId: number,
  file: string,
  eventId: number,
): SolutionState {
  const state = solutions.get(solutionId);
  expect(state, `${file} eventId=${eventId} references unknown solutionId=${solutionId}`).toBeTruthy();
  return state;
}

function expectProgressBeforeResult(
  progress: number[],
  result: string | number,
  file: string,
  eventId: number,
  requireProgress: boolean,
): void {
  if (requireProgress) {
    expect(progress.length, `${file} eventId=${eventId} settle requires progress`).toBeGreaterThan(0);
  }
  expect(progress[0], `${file} eventId=${eventId} first progress must be 0`).toBe(0);
  const lastProgress = progress[progress.length - 1];
  if (isAcceptedResult(result)) {
    expect(lastProgress, `${file} eventId=${eventId} accepted result requires final progress 100`).toBe(100);
  } else {
    expect(lastProgress, `${file} eventId=${eventId} rejected result final progress`).toBeLessThanOrEqual(100);
  }
}

function isAcceptedResult(result: string | number): boolean {
  return resultName(result) === 'AC';
}

function eventTypeName(value: string | number): string {
  return typeof value === 'number' ? rankland_live_contest_common.EventType[value] : value;
}

function resultName(value: string | number): string {
  return typeof value === 'number' ? rankland_live_contest_common.Result[value] : value;
}
