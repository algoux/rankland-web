import { describe, expect, it } from 'vitest';
import type {
  RanklistCompletenessItems,
  RanklistCorrectnessChecks,
  RanklistDiagnosticCheck,
  RanklistDiagnosticCompletenessItem,
  RanklistDiagnosticPrecision,
  RanklistDiagnostics,
} from '@algoux/standard-ranklist-utils';
import {
  calculateRanklistQualityScore,
  formatCompletenessCount,
  formatCorrectnessCount,
  formatPrecisionText,
  getCompletenessBadgeTone,
  getCorrectnessBadgeTone,
  getCorrectnessStatusText,
  getScoreTone,
} from './ranklist-diagnostics-score';

const COMPLETENESS_KEYS: (keyof RanklistCompletenessItems)[] = [
  'banner',
  'firstBlood',
  'problemColors',
  'icpcSeries',
  'userAvatar',
  'userPhoto',
  'teamMembers',
  'coachRole',
  'i18n',
  'statuses',
  'solutions',
  'rowUserConsistency',
];

const CORRECTNESS_KEYS: (keyof RanklistCorrectnessChecks)[] = [
  'firstBlood',
  'problemStatistics',
  'mockSolutions',
  'statuses',
  'statusSummaries',
  'scores',
  'rowOrder',
  'sorterConfig',
  'markers',
];

function makeCompletenessItem(
  key: string,
  overrides: Partial<RanklistDiagnosticCompletenessItem> = {},
): RanklistDiagnosticCompletenessItem {
  return {
    key,
    label: key,
    level: 'complete',
    presentCount: 1,
    totalCount: 1,
    ratio: 1,
    details: {},
    ...overrides,
  };
}

function makeCorrectnessCheck(
  key: string,
  overrides: Partial<RanklistDiagnosticCheck> = {},
): RanklistDiagnosticCheck {
  return {
    key,
    label: key,
    status: 'pass',
    checkedCount: 1,
    failedCount: 0,
    details: {},
    ...overrides,
  };
}

function makePrecision(overrides: Partial<RanklistDiagnosticPrecision> = {}): RanklistDiagnosticPrecision {
  return {
    actualUnit: 'min',
    declaredUnits: ['min'],
    sampleCount: 10,
    invalidCount: 0,
    zeroCount: 0,
    ...overrides,
  };
}

function makeDiagnostics(
  overrides: {
    completeness?: Partial<Record<keyof RanklistCompletenessItems, Partial<RanklistDiagnosticCompletenessItem>>>;
    correctness?: Partial<Record<keyof RanklistCorrectnessChecks, Partial<RanklistDiagnosticCheck>>>;
  } = {},
): RanklistDiagnostics {
  const items: Partial<RanklistCompletenessItems> = {};
  for (const key of COMPLETENESS_KEYS) {
    items[key] = makeCompletenessItem(key, overrides.completeness?.[key]);
  }
  const checks: Partial<RanklistCorrectnessChecks> = {};
  for (const key of CORRECTNESS_KEYS) {
    checks[key] = makeCorrectnessCheck(key, overrides.correctness?.[key]);
  }
  return {
    summary: {
      precision: {
        solutionTime: makePrecision(),
        statusTime: makePrecision(),
        scoreTime: makePrecision(),
      },
    },
    completeness: { items: items as RanklistCompletenessItems },
    correctness: { checks: checks as RanklistCorrectnessChecks },
    suggestions: { firstBlood: [], sorter: [], problemStatistics: [] },
    issues: [],
  };
}

describe('calculateRanklistQualityScore', () => {
  it('returns 100 when all items are complete and all checks pass', () => {
    expect(calculateRanklistQualityScore(makeDiagnostics())).toBe(100);
  });

  it('scores 0 when everything is notApplicable (N/A counts as zero-credit error, mockSolutions/markers excluded)', () => {
    const completeness: Record<string, Partial<RanklistDiagnosticCompletenessItem>> = {};
    for (const key of COMPLETENESS_KEYS) {
      completeness[key] = { level: 'notApplicable', ratio: null, totalCount: 0 };
    }
    const correctness: Record<string, Partial<RanklistDiagnosticCheck>> = {};
    for (const key of CORRECTNESS_KEYS) {
      correctness[key] = { status: 'notApplicable', checkedCount: 0 };
    }
    expect(calculateRanklistQualityScore(makeDiagnostics({ completeness, correctness }))).toBe(0);
  });

  it('still excludes notApplicable mockSolutions from the pool', () => {
    const diagnostics = makeDiagnostics({
      correctness: { mockSolutions: { status: 'notApplicable', checkedCount: 0 } },
    });
    // mockSolutions (weight 1) drops out entirely: 36/36 earns full credit
    expect(calculateRanklistQualityScore(diagnostics)).toBe(100);
  });

  it('excludes notApplicable markers from the pool (ignorable like mockSolutions)', () => {
    const diagnostics = makeDiagnostics({
      correctness: { markers: { status: 'notApplicable', checkedCount: 0 } },
    });
    // markers (weight 1) drops out entirely: 36/36 earns full credit
    expect(calculateRanklistQualityScore(diagnostics)).toBe(100);
  });

  it('counts notApplicable completeness items as zero-credit', () => {
    const diagnostics = makeDiagnostics({
      completeness: { teamMembers: { level: 'notApplicable', ratio: null, totalCount: 0 } },
    });
    // weight 1 stays in the denominator with 0 credit: floor(100 * 36 / 37) = 97
    expect(calculateRanklistQualityScore(diagnostics)).toBe(97);
  });

  it('excludes notApplicable icpcSeries from the pool (ignorable like markers/mockSolutions)', () => {
    const diagnostics = makeDiagnostics({
      completeness: { icpcSeries: { level: 'notApplicable', ratio: null, totalCount: 0 } },
    });
    // icpcSeries (weight 1) drops out entirely: 36/36 earns full credit
    expect(calculateRanklistQualityScore(diagnostics)).toBe(100);
  });

  it('treats a pass that checked nothing as unverified (zero credit)', () => {
    const diagnostics = makeDiagnostics({
      correctness: { firstBlood: { status: 'pass', checkedCount: 0, failedCount: 0 } },
    });
    // weight 2 stays in the denominator with 0 credit: floor(100 * 35 / 37) = 94
    expect(calculateRanklistQualityScore(diagnostics)).toBe(94);
  });

  it('keeps a zero-checked mockSolutions pass neutral (excluded)', () => {
    const diagnostics = makeDiagnostics({
      correctness: { mockSolutions: { status: 'pass', checkedCount: 0, failedCount: 0 } },
    });
    expect(calculateRanklistQualityScore(diagnostics)).toBe(100);
  });

  it('returns 100 when no weighted item exists at all', () => {
    const emptyItems: Partial<RanklistCompletenessItems> = {};
    const emptyChecks: Partial<RanklistCorrectnessChecks> = {};
    const diagnostics = makeDiagnostics();
    diagnostics.completeness.items = emptyItems as RanklistCompletenessItems;
    diagnostics.correctness.checks = emptyChecks as RanklistCorrectnessChecks;
    expect(calculateRanklistQualityScore(diagnostics)).toBe(100);
  });

  it('ignores optional items that are fully missing', () => {
    const diagnostics = makeDiagnostics({
      completeness: {
        banner: { level: 'missing', presentCount: 0, ratio: 0, details: { optional: true } },
        userAvatar: { level: 'missing', presentCount: 0, ratio: 0, details: { optional: true } },
        userPhoto: { level: 'missing', presentCount: 0, ratio: 0, details: { optional: true } },
      },
    });
    expect(calculateRanklistQualityScore(diagnostics)).toBe(100);
  });

  it('keeps non-optional missing items in the denominator', () => {
    const diagnostics = makeDiagnostics({
      completeness: { statuses: { level: 'missing', presentCount: 0, ratio: 0 } },
    });
    // weight 3 earns 0 credit: floor(100 * 34 / 37) = 91
    expect(calculateRanklistQualityScore(diagnostics)).toBe(91);
  });

  it('applies graded credits for mostly/warning/partial', () => {
    const diagnostics = makeDiagnostics({
      completeness: {
        solutions: { level: 'mostly', presentCount: 9, totalCount: 10, ratio: 0.9 },
        teamMembers: { level: 'partial', presentCount: 1, totalCount: 2, ratio: 0.5 },
      },
      correctness: {
        scores: { status: 'warning', checkedCount: 10, failedCount: 1 },
      },
    });
    // 37 - 3*(1-0.75) - 3*(1-0.5) - 1*(1-0.4) = 34.15: floor(100 * 34.15 / 37) = 92
    expect(calculateRanklistQualityScore(diagnostics)).toBe(92);
  });

  it('floors the final percentage', () => {
    const diagnostics = makeDiagnostics({
      correctness: { markers: { status: 'fail', checkedCount: 2, failedCount: 2 } },
    });
    // floor(100 * 36 / 37) = floor(97.29) = 97
    expect(calculateRanklistQualityScore(diagnostics)).toBe(97);
  });

  it('counts notApplicable checks (other than mockSolutions/markers) as zero-credit while optional-missing stays excluded', () => {
    const diagnostics = makeDiagnostics({
      completeness: {
        banner: { level: 'missing', presentCount: 0, ratio: 0, details: { optional: true } },
      },
      correctness: {
        statusSummaries: { status: 'notApplicable', checkedCount: 0 },
      },
    });
    // banner (weight 1) excluded; statusSummaries (weight 2) earns 0: floor(100 * 34 / 36) = 94
    expect(calculateRanklistQualityScore(diagnostics)).toBe(94);
  });
});

describe('getScoreTone', () => {
  it('maps score tiers to tones with inclusive lower bounds', () => {
    expect(getScoreTone(100)).toBe('good');
    expect(getScoreTone(80)).toBe('good');
    expect(getScoreTone(79)).toBe('fair');
    expect(getScoreTone(40)).toBe('fair');
    expect(getScoreTone(39)).toBe('poor');
    expect(getScoreTone(0)).toBe('poor');
  });
});

describe('badge tones', () => {
  it('maps completeness levels to tones (N/A is an error except icpcSeries)', () => {
    expect(getCompletenessBadgeTone(makeCompletenessItem('x', { level: 'complete' }))).toBe('good');
    expect(getCompletenessBadgeTone(makeCompletenessItem('x', { level: 'notApplicable', ratio: null }))).toBe('poor');
    expect(getCompletenessBadgeTone(makeCompletenessItem('icpcSeries', { level: 'notApplicable', ratio: null }))).toBe('good');
    expect(getCompletenessBadgeTone(makeCompletenessItem('x', { level: 'mostly' }))).toBe('fair');
    expect(getCompletenessBadgeTone(makeCompletenessItem('x', { level: 'partial' }))).toBe('fair');
    expect(getCompletenessBadgeTone(makeCompletenessItem('x', { level: 'missing' }))).toBe('poor');
  });

  it('mutes optional items that are fully missing (uncolored in CLI)', () => {
    expect(
      getCompletenessBadgeTone(makeCompletenessItem('banner', { level: 'missing', details: { optional: true } })),
    ).toBe('muted');
  });

  it('maps correctness statuses to tones (N/A is an error except mockSolutions/markers)', () => {
    expect(getCorrectnessBadgeTone(makeCorrectnessCheck('x', { status: 'pass' }))).toBe('good');
    expect(getCorrectnessBadgeTone(makeCorrectnessCheck('x', { status: 'notApplicable' }))).toBe('poor');
    expect(getCorrectnessBadgeTone(makeCorrectnessCheck('mockSolutions', { status: 'notApplicable' }))).toBe('good');
    expect(getCorrectnessBadgeTone(makeCorrectnessCheck('markers', { status: 'notApplicable' }))).toBe('good');
    expect(getCorrectnessBadgeTone(makeCorrectnessCheck('x', { status: 'warning' }))).toBe('fair');
    expect(getCorrectnessBadgeTone(makeCorrectnessCheck('x', { status: 'fail' }))).toBe('poor');
  });

  it('tones zero-checked passes as errors and labels them unverified', () => {
    const vacuous = makeCorrectnessCheck('firstBlood', { status: 'pass', checkedCount: 0, failedCount: 0 });
    expect(getCorrectnessBadgeTone(vacuous)).toBe('poor');
    expect(getCorrectnessStatusText(vacuous)).toBe('未检验');
    expect(getCorrectnessBadgeTone(makeCorrectnessCheck('mockSolutions', { status: 'pass', checkedCount: 0 }))).toBe('good');
    expect(getCorrectnessStatusText(makeCorrectnessCheck('x', { status: 'pass' }))).toBe('通过');
    expect(getCorrectnessStatusText(makeCorrectnessCheck('x', { status: 'notApplicable' }))).toBe('不适用');
  });
});

describe('format helpers', () => {
  it('formats completeness counts with percentage', () => {
    expect(
      formatCompletenessCount(makeCompletenessItem('x', { presentCount: 3, totalCount: 6, ratio: 0.5 })),
    ).toBe('3/6 (50%)');
  });

  it('formats completeness without ratio as N/A', () => {
    expect(
      formatCompletenessCount(makeCompletenessItem('x', { level: 'notApplicable', ratio: null, totalCount: 0 })),
    ).toBe('N/A');
  });

  it('formats correctness counts as passed/total', () => {
    expect(
      formatCorrectnessCount(makeCorrectnessCheck('x', { status: 'warning', failedCount: 2, checkedCount: 5 })),
    ).toBe('3/5');
  });

  it('formats notApplicable correctness as N/A', () => {
    expect(formatCorrectnessCount(makeCorrectnessCheck('x', { status: 'notApplicable', checkedCount: 0 }))).toBe('N/A');
  });

  it('formats zero-checked passes as N/A', () => {
    expect(
      formatCorrectnessCount(makeCorrectnessCheck('x', { status: 'pass', checkedCount: 0, failedCount: 0 })),
    ).toBe('N/A');
  });

  it('formats precision rows without sample/zero counts', () => {
    expect(
      formatPrecisionText(
        makePrecision({ actualUnit: 's', declaredUnits: ['s'], sampleCount: 123, zeroCount: 2, invalidCount: 0 }),
      ),
    ).toBe('检测单位：s · 声明单位：s');
  });

  it('formats unknown precision as placeholders', () => {
    expect(
      formatPrecisionText(makePrecision({ actualUnit: null, declaredUnits: [], sampleCount: 0, invalidCount: 3 })),
    ).toBe('检测单位：未知 · 声明单位：无（无效数量：3）');
  });
});
