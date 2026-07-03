import type * as srk from '@algoux/standard-ranklist';
import type {
  CompletenessLevel,
  DiagnosticCheckStatus,
  RanklistCompletenessItems,
  RanklistCorrectnessChecks,
  RanklistDiagnosticCheck,
  RanklistDiagnosticCompletenessItem,
  RanklistDiagnosticPrecision,
  RanklistDiagnostics,
} from '@algoux/standard-ranklist-utils';

export type RanklistQualityTone = 'good' | 'fair' | 'poor' | 'muted';

/** Share of an item's weight earned per completeness level (notApplicable earns 0 like an error). */
export const COMPLETENESS_LEVEL_CREDITS: Record<CompletenessLevel, number> = {
  complete: 1,
  mostly: 0.75,
  partial: 0.4,
  missing: 0,
  notApplicable: 0,
};

/**
 * Share of a check's weight earned per correctness status (notApplicable earns 0 like an error,
 * except mockSolutions/markers where N/A is neutral and excluded from scoring entirely).
 */
export const CORRECTNESS_STATUS_CREDITS: Record<DiagnosticCheckStatus, number> = {
  pass: 1,
  warning: 0.5,
  fail: 0,
  notApplicable: 0,
};

export const COMPLETENESS_WEIGHTS: Record<keyof RanklistCompletenessItems, number> = {
  statuses: 3,
  solutions: 3,
  firstBlood: 2,
  rowUserConsistency: 2,
  banner: 1,
  problemColors: 1,
  icpcSeries: 1,
  userAvatar: 1,
  userPhoto: 1,
  teamMembers: 1,
  coachRole: 1,
  i18n: 1,
};

export const CORRECTNESS_WEIGHTS: Record<keyof RanklistCorrectnessChecks, number> = {
  statuses: 3,
  scores: 3,
  rowOrder: 3,
  firstBlood: 2,
  statusSummaries: 2,
  problemStatistics: 2,
  sorterConfig: 2,
  mockSolutions: 1,
  markers: 1,
};

/**
 * Checks whose unverifiable state is neutral rather than an error: having no solutions to
 * inspect for mocks or no markers to validate is not a data defect.
 */
const UNVERIFIED_NEUTRAL_CHECK_KEYS: ReadonlySet<string> = new Set(['mockSolutions', 'markers']);

/**
 * Completeness items whose notApplicable level is neutral rather than an error: a non-ICPC
 * ranklist legitimately has no ICPC series to declare.
 */
const NA_NEUTRAL_COMPLETENESS_KEYS: ReadonlySet<string> = new Set(['icpcSeries']);

/**
 * A check that "passed" without inspecting anything verified nothing — the data needed to
 * check is absent, which is the same situation as notApplicable.
 */
function isUnverifiedCheck(check: RanklistDiagnosticCheck): boolean {
  return check.status === 'notApplicable' || (check.status === 'pass' && check.checkedCount <= 0);
}

/**
 * Overall data quality score in [0, 100] (floored), as a weighted average over completeness
 * items and correctness checks. Unverifiable entries (notApplicable, or a pass that checked
 * nothing) earn 0 credit like errors — missing the data needed to even check is itself an
 * incompleteness signal. Exceptions, excluded from both sides of the ratio: the mockSolutions
 * check when unverifiable (no solutions to inspect is neutral), and optional completeness
 * items that are fully missing (uncolored in the CLI output).
 */
export function calculateRanklistQualityScore(diagnostics: RanklistDiagnostics): number {
  let earned = 0;
  let total = 0;
  for (const key of Object.keys(COMPLETENESS_WEIGHTS) as (keyof RanklistCompletenessItems)[]) {
    const item = diagnostics.completeness.items[key];
    if (!item) {
      continue;
    }
    if (item.level === 'missing' && item.details?.optional === true) {
      continue;
    }
    if (NA_NEUTRAL_COMPLETENESS_KEYS.has(key) && item.level === 'notApplicable') {
      continue;
    }
    total += COMPLETENESS_WEIGHTS[key];
    earned += COMPLETENESS_WEIGHTS[key] * COMPLETENESS_LEVEL_CREDITS[item.level];
  }
  for (const key of Object.keys(CORRECTNESS_WEIGHTS) as (keyof RanklistCorrectnessChecks)[]) {
    const check = diagnostics.correctness.checks[key];
    if (!check) {
      continue;
    }
    if (UNVERIFIED_NEUTRAL_CHECK_KEYS.has(key) && isUnverifiedCheck(check)) {
      continue;
    }
    total += CORRECTNESS_WEIGHTS[key];
    earned += CORRECTNESS_WEIGHTS[key] * (isUnverifiedCheck(check) ? 0 : CORRECTNESS_STATUS_CREDITS[check.status]);
  }
  if (total <= 0) {
    return 100;
  }
  return Math.floor((100 * earned) / total);
}

export function getScoreTone(score: number): Exclude<RanklistQualityTone, 'muted'> {
  if (score >= 80) {
    return 'good';
  }
  if (score >= 40) {
    return 'fair';
  }
  return 'poor';
}

// Literal tailwind classes (kept in .ts so the tailwind content scan picks them up).
// Colors match the project's status palette used by sonner toast icons (green/amber/red-500).
export const QUALITY_TONE_TEXT_CLASSES: Record<RanklistQualityTone, string> = {
  good: 'text-green-500',
  fair: 'text-amber-500',
  poor: 'text-red-500',
  muted: 'text-muted-foreground',
};

// Ghost Button sets hover:text-accent-foreground; re-assert the tone color so it survives hover.
export const QUALITY_TONE_BUTTON_CLASSES: Record<RanklistQualityTone, string> = {
  good: 'text-green-500 hover:text-green-500',
  fair: 'text-amber-500 hover:text-amber-500',
  poor: 'text-red-500 hover:text-red-500',
  muted: 'text-muted-foreground',
};

export const QUALITY_BADGE_TONE_CLASSES: Record<RanklistQualityTone, string> = {
  good: 'bg-green-500/10 text-green-500',
  fair: 'bg-amber-500/10 text-amber-500',
  poor: 'bg-red-500/10 text-red-500',
  muted: 'bg-muted text-muted-foreground',
};

export function getCompletenessBadgeTone(item: RanklistDiagnosticCompletenessItem): RanklistQualityTone {
  switch (item.level) {
    case 'complete':
      return 'good';
    case 'mostly':
    case 'partial':
      return 'fair';
    case 'notApplicable':
      return NA_NEUTRAL_COMPLETENESS_KEYS.has(item.key) ? 'good' : 'poor';
    case 'missing':
      return item.details?.optional === true ? 'muted' : 'poor';
    default:
      return 'muted';
  }
}

export function getCorrectnessBadgeTone(check: RanklistDiagnosticCheck): RanklistQualityTone {
  if (isUnverifiedCheck(check)) {
    // Nothing to inspect is neutral for mocks/markers; anything else unverifiable means the
    // data is too incomplete to check.
    return UNVERIFIED_NEUTRAL_CHECK_KEYS.has(check.key) ? 'good' : 'poor';
  }
  switch (check.status) {
    case 'pass':
      return 'good';
    case 'warning':
      return 'fair';
    case 'fail':
      return 'poor';
    default:
      return 'muted';
  }
}

export const PRECISION_LABELS_ZH: Record<keyof RanklistDiagnostics['summary']['precision'], string> = {
  solutionTime: '提交时间精度',
  statusTime: '状态时间精度',
  scoreTime: '得分时间精度',
};

export const COMPLETENESS_LABELS_ZH: Record<keyof RanklistCompletenessItems, string> = {
  banner: '比赛横幅图',
  firstBlood: 'FB 标记',
  problemColors: '题目颜色',
  icpcSeries: 'ICPC 奖项配置',
  userAvatar: '参赛者徽标',
  userPhoto: '参赛者照片',
  teamMembers: '队伍成员',
  coachRole: '教练角色',
  i18n: '多语言文本',
  statuses: '题目状态',
  solutions: '提交记录',
  rowUserConsistency: '行用户一致性',
};

export const CORRECTNESS_LABELS_ZH: Record<keyof RanklistCorrectnessChecks, string> = {
  firstBlood: 'FB',
  problemStatistics: '题目统计',
  mockSolutions: '模拟提交检测',
  statuses: '提交状态数据',
  statusSummaries: '提交状态摘要',
  scores: '得分',
  rowOrder: '行排序',
  sorterConfig: '排序配置',
  markers: '分组标记',
};

export const COMPLETENESS_LEVEL_TEXT_ZH: Record<CompletenessLevel, string> = {
  missing: '缺失',
  partial: '部分',
  mostly: '大部分',
  complete: '完整',
  notApplicable: '不适用',
};

export const CORRECTNESS_STATUS_TEXT_ZH: Record<DiagnosticCheckStatus, string> = {
  pass: '通过',
  warning: '警告',
  fail: '失败',
  notApplicable: '不适用',
};

export const TIME_UNIT_TEXT_ZH: Record<srk.TimeUnit, string> = {
  ms: '毫秒',
  s: '秒',
  min: '分钟',
  h: '小时',
  d: '天',
};

export function formatCompletenessCount(item: RanklistDiagnosticCompletenessItem): string {
  if (item.ratio === null) {
    return 'N/A';
  }
  return `${item.presentCount}/${item.totalCount} (${Math.round(item.ratio * 100)}%)`;
}

/** Badge text for a correctness check; zero-checked passes read as "unverified". */
export function getCorrectnessStatusText(check: RanklistDiagnosticCheck): string {
  if (check.status === 'pass' && check.checkedCount <= 0) {
    return '未检验';
  }
  return CORRECTNESS_STATUS_TEXT_ZH[check.status] ?? check.status;
}

export function formatCorrectnessCount(check: RanklistDiagnosticCheck): string {
  if (isUnverifiedCheck(check)) {
    return 'N/A';
  }
  return `${check.checkedCount - check.failedCount}/${check.checkedCount}`;
}

export function formatPrecisionText(precision: RanklistDiagnosticPrecision): string {
  const actual = precision.actualUnit ? precision.actualUnit : '未知';
  const declared = precision.declaredUnits.length > 0 ? precision.declaredUnits.join(', ') : '无';
  return `检测单位：${actual} · 声明单位：${declared}${precision.invalidCount > 0 ? ` (无效：${precision.invalidCount})` : ''}`;
}
