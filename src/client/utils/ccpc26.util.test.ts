import { describe, expect, it } from 'vitest';
import type * as srk from '@algoux/standard-ranklist';
import {
  filterSolutionsUntil,
  getCCPC26ProblemLayout,
  getCCPC26RowProblemOrder,
  getSortedCalculatedRawSolutions,
  regenerateRanklistBySolutions,
} from '@algoux/standard-ranklist-utils';
import fixture from '../../../tests/fixtures/ccpc26.srk.json';
import { isCCPC26Ranklist, shouldEnableCCPC26 } from './ccpc26.util';

const START = Date.parse(fixture.contest.startAt);
const MINUTE = 60_000;
const FREEZE = 8 * MINUTE;

function createRanklist(): srk.Ranklist {
  return JSON.parse(JSON.stringify(fixture));
}

function freezeDeep<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
  return value;
}

function checkMode(ranklist: srk.Ranklist, time: Parameters<typeof shouldEnableCCPC26>[1]): boolean {
  const original = JSON.stringify(ranklist);
  const result = shouldEnableCCPC26(freezeDeep(ranklist), freezeDeep(time));
  expect(JSON.stringify(ranklist)).toBe(original);
  return result;
}

describe('CCPC26 display time', () => {
  it.each([
    ['missing sorter', undefined],
    ['ordinary ICPC', { algorithm: 'ICPC', config: {} }],
    ['empty extensions', { algorithm: 'ICPC', config: { extendedAlgorithms: [] } }],
    ['wrong case', { algorithm: 'ICPC', config: { extendedAlgorithms: [{ algorithm: 'ccpc26' }] } }],
    ['wrong sorter', { algorithm: 'score', config: { extendedAlgorithms: [{ algorithm: 'CCPC26' }] } }],
  ])('requires an explicit standard declaration: %s', (_name, sorter) => {
    const ranklist = createRanklist();
    ranklist.sorter = sorter as srk.Ranklist['sorter'];
    expect(isCCPC26Ranklist(freezeDeep(ranklist))).toBe(false);
    expect(checkMode(ranklist, { isLive: true, timeTravelTime: 0, now: START })).toBe(false);
  });

  it('keeps a static final ranklist in ordinary mode even before freeze', () => {
    const ranklist = createRanklist();
    expect(isCCPC26Ranklist(freezeDeep(ranklist))).toBe(true);
    expect(checkMode(ranklist, { isLive: false, timeTravelTime: null, now: START })).toBe(false);
  });

  it.each([
    [0, true],
    [FREEZE - 1, true],
    [FREEZE, false],
    [FREEZE + 1, false],
    [10 * MINUTE, false],
  ])('uses replay time %i ms and the strict freeze boundary', (timeTravelTime, expected) => {
    expect(checkMode(createRanklist(), { isLive: false, timeTravelTime, now: START + 20 * MINUTE })).toBe(expected);
  });

  it.each([
    [0, true],
    [FREEZE - 1, true],
    [FREEZE, false],
    [FREEZE + 1, false],
  ])('uses the Live clock at elapsed %i ms', (elapsed, expected) => {
    expect(checkMode(createRanklist(), { isLive: true, timeTravelTime: null, now: START + elapsed })).toBe(expected);
  });

  it('gives replay priority over Live time, including zero', () => {
    const ranklist = createRanklist();
    expect(checkMode(ranklist, { isLive: true, timeTravelTime: 0, now: START + 20 * MINUTE })).toBe(true);
    expect(checkMode(ranklist, { isLive: true, timeTravelTime: FREEZE, now: START })).toBe(false);
  });

  it('supports reverse replay and restores Live or static mode when replay exits', () => {
    const ranklist = createRanklist();
    expect(checkMode(ranklist, { isLive: true, timeTravelTime: FREEZE, now: START + FREEZE })).toBe(false);
    expect(checkMode(ranklist, { isLive: true, timeTravelTime: MINUTE, now: START + FREEZE })).toBe(true);
    expect(checkMode(ranklist, { isLive: true, timeTravelTime: null, now: START + FREEZE })).toBe(false);
    expect(checkMode(ranklist, { isLive: true, timeTravelTime: null, now: START + MINUTE })).toBe(true);
    expect(checkMode(ranklist, { isLive: false, timeTravelTime: null, now: START + MINUTE })).toBe(false);
  });

  it('normalizes mixed duration units', () => {
    const ranklist = createRanklist();
    ranklist.contest.duration = [600_000, 'ms'];
    ranklist.contest.frozenDuration = [120, 's'];
    expect(checkMode(ranklist, { isLive: false, timeTravelTime: FREEZE - 1, now: START })).toBe(true);
    expect(checkMode(ranklist, { isLive: false, timeTravelTime: FREEZE, now: START })).toBe(false);
  });

  it('uses contest end when there is no configured freeze duration', () => {
    const ranklist = createRanklist();
    delete ranklist.contest.frozenDuration;
    expect(checkMode(ranklist, { isLive: true, timeTravelTime: null, now: START + 10 * MINUTE - 1 })).toBe(true);
    expect(checkMode(ranklist, { isLive: true, timeTravelTime: null, now: START + 10 * MINUTE })).toBe(false);
  });

  it('uses local time rather than the SRK _now heartbeat', () => {
    const ranklist = createRanklist();
    ranklist._now = new Date(START + FREEZE).toISOString();
    expect(checkMode(ranklist, { isLive: true, timeTravelTime: null, now: START })).toBe(true);
    const staleRanklist = createRanklist();
    staleRanklist._now = new Date(START).toISOString();
    expect(checkMode(staleRanklist, { isLive: true, timeTravelTime: null, now: START + FREEZE })).toBe(false);
  });
});

describe('independent CCPC26 replay fixture', () => {
  it.each([
    [0, []],
    [2, []],
    [3, [0]],
    [6, [0, 1]],
  ])('regenerates the reveal layout at %i minutes from submissions', (minute, revealed) => {
    const ranklist = freezeDeep(createRanklist());
    const original = JSON.stringify(ranklist);
    const solutions = getSortedCalculatedRawSolutions(ranklist.rows);
    const snapshot = regenerateRanklistBySolutions(ranklist, filterSolutionsUntil(solutions, [minute, 'min']));
    expect(getCCPC26ProblemLayout(snapshot)?.revealedProblemIndexes).toEqual(revealed);
    expect(JSON.stringify(ranklist)).toBe(original);
  });

  it('orders anonymous ACs by time before a common revealed prefix takes over', () => {
    const ranklist = freezeDeep(createRanklist());
    const original = JSON.stringify(ranklist);
    const solutions = getSortedCalculatedRawSolutions(ranklist.rows);
    const before = regenerateRanklistBySolutions(ranklist, filterSolutionsUntil(solutions, [2, 'min']));
    const after = regenerateRanklistBySolutions(ranklist, filterSolutionsUntil(solutions, [3, 'min']));
    const alphaBefore = before.rows.find((row) => row.user.id === 'ccpc26-alpha')!;
    const alphaAfter = after.rows.find((row) => row.user.id === 'ccpc26-alpha')!;
    expect(getCCPC26RowProblemOrder(alphaBefore.statuses, getCCPC26ProblemLayout(before)!)).toEqual([1, 0, 2]);
    expect(getCCPC26RowProblemOrder(alphaAfter.statuses, getCCPC26ProblemLayout(after)!)).toEqual([0, 1, 2]);
    expect(JSON.stringify(ranklist)).toBe(original);
  });
});
