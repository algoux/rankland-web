import { describe, expect, it } from 'vitest';
import { createCheckers } from 'ts-interface-checker';
import ranklistFixture from '../../../../tests/fixtures/ccpc26.srk.json';
import checkerSuite from './index.d.ti';

const { Ranklist: ranklistChecker, Solution: solutionChecker } = createCheckers(checkerSuite);

function createRanklist() {
  return JSON.parse(JSON.stringify(ranklistFixture));
}

describe('SRK 0.3.14 runtime checker', () => {
  it('accepts a CCPC26 ranklist with standard count and ratio configuration', () => {
    const ranklist = createRanklist();
    const algorithm = ranklist.sorter.config.extendedAlgorithms[0];
    algorithm.config.problemRevealAcceptedThreshold = {
      count: 2,
      ratio: 0.2,
      rounding: 'floor',
      denominator: 'submitted',
      includeOfficialOnly: true,
    };

    expect(() => ranklistChecker.check(ranklist)).not.toThrow();
  });

  it('accepts an empty threshold configuration and an explicit zero threshold', () => {
    const ranklist = createRanklist();
    const config = ranklist.sorter.config.extendedAlgorithms[0].config;
    config.problemRevealAcceptedThreshold = {};
    expect(() => ranklistChecker.check(ranklist)).not.toThrow();
    config.problemRevealAcceptedThreshold = { count: 0, ratio: 0 };
    expect(() => ranklistChecker.check(ranklist)).not.toThrow();
  });

  it('rejects CCPC26 when its required config is missing', () => {
    const ranklist = createRanklist();
    delete ranklist.sorter.config.extendedAlgorithms[0].config;

    expect(() => ranklistChecker.check(ranklist)).toThrow();
  });

  it('rejects CCPC26 when its threshold object is missing', () => {
    const ranklist = createRanklist();
    delete ranklist.sorter.config.extendedAlgorithms[0].config.problemRevealAcceptedThreshold;

    expect(() => ranklistChecker.check(ranklist)).toThrow();
  });

  it.each([
    ['count', '2'],
    ['ratio', '0.2'],
    ['rounding', 'truncate'],
    ['denominator', 'active'],
    ['includeOfficialOnly', 'true'],
  ])('rejects an invalid %s threshold field', (field, value) => {
    const ranklist = createRanklist();
    ranklist.sorter.config.extendedAlgorithms[0].config.problemRevealAcceptedThreshold[field] = value;

    expect(() => ranklistChecker.check(ranklist)).toThrow();
  });

  it('allows a null problem status but rejects null submission results', () => {
    const ranklist = createRanklist();
    expect(ranklist.rows[0].statuses[2].result).toBeNull();
    expect(() => ranklistChecker.check(ranklist)).not.toThrow();
    ranklist.rows[0].statuses[0].solutions[0].result = null;

    expect(() => ranklistChecker.check(ranklist)).toThrow();
    expect(() => solutionChecker.check({ result: null, time: [0, 's'] })).toThrow();
  });

  it('continues to accept custom submission result strings', () => {
    expect(() => solutionChecker.check({ result: 'CUSTOM_RESULT', time: [0, 's'] })).not.toThrow();
  });
});
