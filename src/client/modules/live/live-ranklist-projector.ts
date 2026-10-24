import type * as srk from '@algoux/standard-ranklist';
import {
  formatTimeDuration,
  numberToAlphabet,
  regenerateRowsByIncrementalSolutions,
  sortRows,
} from '@algoux/standard-ranklist-utils';
import type {
  LiveContestConfig,
  LiveContestEvent,
  LiveJudgeResult,
  LiveScrollSolutionItem,
} from '@/services/ranklist-api/live-contest-types';

type RankedResult = Exclude<srk.SolutionResultFull, null | 'FB'>;
type CalculatedSolutionTetrad = [
  userId: string,
  problemIndex: number,
  result: RankedResult,
  time: srk.TimeDuration,
];

interface StoredSolution {
  solutionId: number;
  userId: string;
  problemIndex: number;
  problemAlias: string;
  submittedAt: srk.TimeDuration;
  submittedAtNs: string;
  newEventId: number;
  result: RankedResult | null;
  frozen: boolean;
}

interface RollingDraft {
  solutionId: number;
  result: RankedResult;
  previousResult?: RankedResult;
}

type ValidatedConfig = Omit<LiveContestConfig, 'problems'> & {
  problems: srk.Problem[];
};

export class LiveRanklistProjectorError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'LiveRanklistProjectorError';
  }
}

export class LiveRanklistProjector {
  private config: ValidatedConfig;
  private rawRanklist: srk.Ranklist;
  private outputRanklist: srk.Ranklist;
  private readonly solutionById = new Map<number, StoredSolution>();
  private readonly solutionIdsByUserId = new Map<string, number[]>();
  private readonly acceptedSolutionHeapByProblem = new Map<number, number[]>();
  private readonly acceptedSolutionHeapIndexBySolutionId = new Map<number, number>();
  private readonly firstBloodSolutionIdByProblem = new Map<number, number>();
  private readonly initialAffectedUserIds = new Set<string>();
  private problemIndexByAlias = new Map<string, number>();
  private userById = new Map<string, srk.User>();
  private frozenBoundaryNs: string | null = null;

  public constructor(config: LiveContestConfig) {
    this.config = validateConfig(config);
    this.rawRanklist = createBaseRanklist(this.config);
    this.outputRanklist = this.rawRanklist;
    this.reset(config);
  }

  public get current() {
    return this.outputRanklist;
  }

  public reset(config: LiveContestConfig = this.config) {
    this.config = validateConfig(config);
    this.problemIndexByAlias = new Map(
      this.config.problems.map((problem, index) => [problem.alias || numberToAlphabet(index), index]),
    );
    this.userById = new Map(this.config.users.map((user) => [user.id, user]));
    this.frozenBoundaryNs = calculateFrozenBoundaryNs(this.config.contest);
    this.solutionById.clear();
    this.solutionIdsByUserId.clear();
    this.acceptedSolutionHeapByProblem.clear();
    this.acceptedSolutionHeapIndexBySolutionId.clear();
    this.firstBloodSolutionIdByProblem.clear();
    this.initialAffectedUserIds.clear();
    this.rawRanklist = createBaseRanklist(this.config);
    this.outputRanklist = {
      ...this.rawRanklist,
      rows: [...this.rawRanklist.rows],
    };
    return this.outputRanklist;
  }

  public applyInitial(events: LiveContestEvent[]) {
    this.ingestInitial(events);
    return this.finishInitial();
  }

  public ingestInitial(events: LiveContestEvent[]) {
    const { affectedUserIds } = this.consume(events, false);
    for (const userId of affectedUserIds) {
      this.initialAffectedUserIds.add(userId);
    }
  }

  public finishInitial() {
    this.publish(this.initialAffectedUserIds, this.outputRanklist);
    this.initialAffectedUserIds.clear();
    return this.outputRanklist;
  }

  public applyLive(events: LiveContestEvent[]) {
    return this.apply(events, true);
  }

  private apply(events: LiveContestEvent[], rolling: boolean) {
    const previousOutputRanklist = this.outputRanklist;
    const {
      affectedUserIds,
      rollingDrafts,
    } = this.consume(events, rolling);
    this.publish(affectedUserIds, previousOutputRanklist);

    return {
      ranklist: this.outputRanklist,
      scrollItems: rolling ? this.createRollingItems(rollingDrafts) : [],
    };
  }

  private consume(events: LiveContestEvent[], rolling: boolean) {
    const affectedUserIds = new Set<string>();
    const rollingDrafts: RollingDraft[] = [];

    for (const event of events) {
      switch (event.type) {
        case 'NEW': {
          if (this.solutionById.has(event.solutionId)) {
            console.warn('[LiveRanklistProjector] ignored duplicate NEW solution', event.solutionId);
            break;
          }
          const user = this.userById.get(event.userId);
          const problemIndex = this.problemIndexByAlias.get(event.problemAlias);
          if (!user || problemIndex === undefined) {
            console.warn('[LiveRanklistProjector] ignored NEW with unknown user/problem', event);
            break;
          }
          const frozen = this.isFrozen(event.timeNs);
          const solution: StoredSolution = {
            solutionId: event.solutionId,
            userId: event.userId,
            problemIndex,
            problemAlias: this.config.problems[problemIndex].alias || event.problemAlias,
            submittedAt: event.time,
            submittedAtNs: normalizeDecimal(event.timeNs),
            newEventId: event.eventId,
            result: frozen ? '?' : null,
            frozen,
          };
          this.solutionById.set(event.solutionId, solution);
          const userSolutions = this.solutionIdsByUserId.get(event.userId);
          if (userSolutions) {
            userSolutions.push(event.solutionId);
          } else {
            this.solutionIdsByUserId.set(event.userId, [event.solutionId]);
          }
          if (frozen) {
            affectedUserIds.add(event.userId);
            if (rolling) {
              rollingDrafts.push({
                solutionId: event.solutionId,
                result: '?',
              });
            }
          }
          break;
        }
        case 'PROGRESS':
          break;
        case 'SETTLE': {
          const applied = this.applyResultEvent(event, affectedUserIds);
          if (rolling && applied?.result) {
            rollingDrafts.push({
              solutionId: event.solutionId,
              result: applied.result,
            });
          }
          break;
        }
        case 'CHANGE': {
          const applied = this.applyResultEvent(event, affectedUserIds);
          const previousResult = toRankedResult(event.previousResult);
          if (rolling && applied?.result) {
            rollingDrafts.push({
              solutionId: event.solutionId,
              result: applied.result,
              ...(previousResult ? { previousResult } : {}),
            });
          }
          break;
        }
        case 'CONFIG_CHANGE':
          console.warn(
            '[LiveRanklistProjector] ignored contest config change',
            event.changedFields,
          );
          break;
        default:
          assertNever(event);
      }
    }

    return {
      affectedUserIds,
      rollingDrafts,
    };
  }

  private publish(
    affectedUserIds: Set<string>,
    previousOutputRanklist: srk.Ranklist,
  ) {
    if (affectedUserIds.size > 0) {
      this.rebuildUsers(affectedUserIds);
      this.outputRanklist = applyFirstBlood(
        this.rawRanklist,
        this.firstBloodSolutionIdByProblem,
        this.solutionById,
      );
    }
    if (this.outputRanklist === previousOutputRanklist) {
      this.outputRanklist = {
        ...this.outputRanklist,
        rows: [...this.outputRanklist.rows],
      };
    }
  }

  private rebuildUsers(userIds: Set<string>) {
    const rebuiltRowsByUserId = new Map<string, srk.RanklistRow>();
    for (const userId of userIds) {
      const user = this.userById.get(userId);
      if (!user) {
        continue;
      }
      const solutions = (this.solutionIdsByUserId.get(userId) || [])
        .map((solutionId) => this.solutionById.get(solutionId))
        .filter((solution): solution is StoredSolution => Boolean(solution?.result))
        .sort(compareStoredSolutions)
        .map((solution): CalculatedSolutionTetrad => [
          solution.userId,
          solution.problemIndex,
          solution.result!,
          solution.submittedAt,
        ]);
      const baseRanklist = createCalculationRanklist(this.config, [user]);
      const [rebuiltRow] = solutions.length
        ? regenerateRowsByIncrementalSolutions(baseRanklist, solutions)
        : baseRanklist.rows;
      rebuiltRowsByUserId.set(userId, rebuiltRow);
    }
    const sorterConfig = this.config.sorter?.algorithm === 'ICPC'
      ? this.config.sorter.config || {}
      : {};
    const rows = this.rawRanklist.rows.map(
      (row) => rebuiltRowsByUserId.get(row.user.id) || row,
    );
    sortRows(rows, {
      rankingTimePrecision: sorterConfig.rankingTimePrecision,
      rankingTimeRounding: sorterConfig.rankingTimeRounding,
    });
    this.rawRanklist = {
      ...this.rawRanklist,
      rows,
    };
  }

  private applyResultEvent(
    event: Extract<LiveContestEvent, { type: 'SETTLE' | 'CHANGE' }>,
    affectedUserIds: Set<string>,
  ) {
    const solution = this.solutionById.get(event.solutionId);
    if (!solution) {
      console.warn(`[LiveRanklistProjector] ignored ${event.type} without NEW`, event);
      return null;
    }
    const previousStoredResult = solution.result;
    const result = toRankedResult(event.result);
    const projectedResult = result || (solution.frozen ? '?' : null);
    solution.result = projectedResult;
    if (result && result !== '?') {
      solution.frozen = false;
    } else if (result === '?') {
      solution.frozen = true;
    }
    this.updateAcceptedIndex(solution, previousStoredResult, projectedResult);
    affectedUserIds.add(solution.userId);
    return {
      result,
    };
  }

  private updateAcceptedIndex(
    solution: StoredSolution,
    previousResult: RankedResult | null,
    nextResult: RankedResult | null,
  ) {
    if (previousResult !== 'AC' && nextResult !== 'AC') {
      return;
    }
    if (previousResult === 'AC' && nextResult !== 'AC') {
      this.removeAcceptedSolution(solution);
    }
    if (previousResult !== 'AC' && nextResult === 'AC') {
      this.addAcceptedSolution(solution);
    }
    const firstBlood = this.acceptedSolutionHeapByProblem.get(
      solution.problemIndex,
    )?.[0];
    if (firstBlood === undefined) {
      this.firstBloodSolutionIdByProblem.delete(solution.problemIndex);
    } else {
      this.firstBloodSolutionIdByProblem.set(solution.problemIndex, firstBlood);
    }
  }

  private addAcceptedSolution(solution: StoredSolution) {
    if (this.acceptedSolutionHeapIndexBySolutionId.has(solution.solutionId)) {
      return;
    }
    let heap = this.acceptedSolutionHeapByProblem.get(solution.problemIndex);
    if (!heap) {
      heap = [];
      this.acceptedSolutionHeapByProblem.set(solution.problemIndex, heap);
    }
    heap.push(solution.solutionId);
    let index = heap.length - 1;
    this.acceptedSolutionHeapIndexBySolutionId.set(solution.solutionId, index);
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compareAcceptedSolutionIds(heap[parentIndex], heap[index]) <= 0) {
        break;
      }
      this.swapAcceptedSolutions(heap, parentIndex, index);
      index = parentIndex;
    }
  }

  private removeAcceptedSolution(solution: StoredSolution) {
    const index = this.acceptedSolutionHeapIndexBySolutionId.get(
      solution.solutionId,
    );
    const heap = this.acceptedSolutionHeapByProblem.get(solution.problemIndex);
    if (index === undefined || !heap) {
      return;
    }
    const lastSolutionId = heap.pop()!;
    this.acceptedSolutionHeapIndexBySolutionId.delete(solution.solutionId);
    if (index < heap.length) {
      heap[index] = lastSolutionId;
      this.acceptedSolutionHeapIndexBySolutionId.set(lastSolutionId, index);
      const parentIndex = Math.floor((index - 1) / 2);
      if (
        index > 0
        && this.compareAcceptedSolutionIds(heap[index], heap[parentIndex]) < 0
      ) {
        this.siftAcceptedSolutionUp(heap, index);
      } else {
        this.siftAcceptedSolutionDown(heap, index);
      }
    }
    if (heap.length === 0) {
      this.acceptedSolutionHeapByProblem.delete(solution.problemIndex);
    }
  }

  private siftAcceptedSolutionUp(heap: number[], startIndex: number) {
    let index = startIndex;
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compareAcceptedSolutionIds(heap[parentIndex], heap[index]) <= 0) {
        break;
      }
      this.swapAcceptedSolutions(heap, parentIndex, index);
      index = parentIndex;
    }
  }

  private siftAcceptedSolutionDown(heap: number[], startIndex: number) {
    let index = startIndex;
    for (;;) {
      const leftIndex = index * 2 + 1;
      if (leftIndex >= heap.length) {
        return;
      }
      const rightIndex = leftIndex + 1;
      const childIndex = rightIndex < heap.length
        && this.compareAcceptedSolutionIds(heap[rightIndex], heap[leftIndex]) < 0
        ? rightIndex
        : leftIndex;
      if (this.compareAcceptedSolutionIds(heap[index], heap[childIndex]) <= 0) {
        return;
      }
      this.swapAcceptedSolutions(heap, index, childIndex);
      index = childIndex;
    }
  }

  private swapAcceptedSolutions(heap: number[], a: number, b: number) {
    [heap[a], heap[b]] = [heap[b], heap[a]];
    this.acceptedSolutionHeapIndexBySolutionId.set(heap[a], a);
    this.acceptedSolutionHeapIndexBySolutionId.set(heap[b], b);
  }

  private compareAcceptedSolutionIds(a: number, b: number) {
    const solutionA = this.solutionById.get(a);
    const solutionB = this.solutionById.get(b);
    if (!solutionA || !solutionB) {
      throw new LiveRanklistProjectorError('Accepted solution index is inconsistent');
    }
    return compareStoredSolutions(solutionA, solutionB);
  }

  private createRollingItems(drafts: RollingDraft[]): LiveScrollSolutionItem[] {
    const rowByUserId = new Map(this.outputRanklist.rows.map((row) => [row.user.id, row]));
    const items: LiveScrollSolutionItem[] = [];
    for (const draft of drafts) {
      const solution = this.solutionById.get(draft.solutionId);
      if (!solution) {
        continue;
      }
      const result = this.displayResult(solution, draft.result);
      const row = rowByUserId.get(solution.userId);
      const user = this.userById.get(solution.userId);
      if (!result || !row || !user) {
        continue;
      }
      items.push({
        problem: {
          alias: solution.problemAlias,
        },
        score: {
          value: row.score.value,
        },
        ...(draft.previousResult ? { previousResult: draft.previousResult } : {}),
        result,
        user: {
          name: user.name,
          organization: user.organization,
        },
      });
    }
    return items;
  }

  private displayResult(
    solution: StoredSolution,
    result: RankedResult | null = solution.result,
  ): RankedResult | 'FB' | null {
    if (
      result === 'AC'
      && this.firstBloodSolutionIdByProblem.get(solution.problemIndex) === solution.solutionId
    ) {
      return 'FB';
    }
    return result;
  }

  private isFrozen(submittedAtNs: string) {
    return this.frozenBoundaryNs !== null
      && compareDecimal(submittedAtNs, this.frozenBoundaryNs) >= 0;
  }
}

function validateConfig(config: LiveContestConfig): ValidatedConfig {
  const problems = config.problems.map((problem, index) => ({
    ...problem,
    alias: problem.alias || numberToAlphabet(index),
  }));
  const aliases = new Set<string>();
  for (const problem of problems) {
    if (aliases.has(problem.alias!)) {
      throw new LiveRanklistProjectorError(
        `Live contest problem aliases must be unique: ${problem.alias}`,
      );
    }
    aliases.add(problem.alias!);
  }
  return {
    ...config,
    problems,
    ...(config.sorter
      ? {
          sorter: {
            ...config.sorter,
            config: config.sorter.config || {},
          },
        }
      : {}),
  };
}

function createBaseRanklist(config: ValidatedConfig, users = config.users): srk.Ranklist {
  return {
    type: 'general',
    version: '0.3.13',
    contest: config.contest,
    problems: config.problems,
    markers: config.markers,
    series: config.series,
    sorter: config.sorter,
    contributors: config.contributors,
    rows: users.map((user) => ({
      user,
      score: {
        value: 0,
        time: [0, 's'],
      },
      statuses: config.problems.map(() => ({
        result: null,
        solutions: [],
      })),
    })),
  };
}

function createCalculationRanklist(config: ValidatedConfig, users: srk.User[]) {
  const ranklist = createBaseRanklist(config, users);
  if (ranklist.sorter?.algorithm === 'ICPC') {
    return ranklist;
  }
  return {
    ...ranklist,
    sorter: {
      algorithm: 'ICPC',
      config: {},
    } satisfies srk.SorterICPC,
  };
}

function applyFirstBlood(
  ranklist: srk.Ranklist,
  firstBloodByProblem: Map<number, number>,
  solutionById: Map<number, StoredSolution>,
) {
  const rows = [...ranklist.rows];
  const rowIndexByUserId = new Map(rows.map((row, index) => [row.user.id, index]));
  const clonedRows = new Set<number>();
  for (const [problemIndex, solutionId] of firstBloodByProblem) {
    const solution = solutionById.get(solutionId);
    const rowIndex = solution ? rowIndexByUserId.get(solution.userId) : undefined;
    if (rowIndex === undefined) {
      continue;
    }
    if (!clonedRows.has(rowIndex)) {
      rows[rowIndex] = {
        ...rows[rowIndex],
        statuses: [...rows[rowIndex].statuses],
      };
      clonedRows.add(rowIndex);
    }
    const status = rows[rowIndex].statuses[problemIndex];
    if (status?.result === 'AC') {
      const acceptedSolutionIndex = status.solutions.findIndex(
        (rankedSolution) => rankedSolution.result === 'AC',
      );
      const solutions = [...status.solutions];
      if (acceptedSolutionIndex >= 0) {
        solutions[acceptedSolutionIndex] = {
          ...solutions[acceptedSolutionIndex],
          result: 'FB',
        };
      }
      rows[rowIndex].statuses[problemIndex] = {
        ...status,
        result: 'FB',
        solutions,
      };
    }
  }
  return {
    ...ranklist,
    rows,
  };
}

function toRankedResult(result: LiveJudgeResult): RankedResult | null {
  if (result === 'PD' || result === 'JG' || result === 'CNL') {
    return null;
  }
  return result === 'FB' ? 'AC' : result;
}

function compareStoredSolutions(a: StoredSolution, b: StoredSolution) {
  return compareDecimal(a.submittedAtNs, b.submittedAtNs)
    || a.newEventId - b.newEventId;
}

function compareDecimal(a: string, b: string) {
  const normalizedA = normalizeDecimal(a);
  const normalizedB = normalizeDecimal(b);
  if (normalizedA.length !== normalizedB.length) {
    return normalizedA.length - normalizedB.length;
  }
  return normalizedA === normalizedB ? 0 : normalizedA < normalizedB ? -1 : 1;
}

function normalizeDecimal(value: string) {
  const normalized = value.replace(/^0+/, '');
  return normalized || '0';
}

function calculateFrozenBoundaryNs(contest: srk.Contest) {
  const frozenSeconds = formatTimeDuration(contest.frozenDuration || [0, 's'], 's');
  if (frozenSeconds <= 0) {
    return null;
  }
  const durationSeconds = formatTimeDuration(contest.duration, 's');
  if (
    !Number.isSafeInteger(durationSeconds)
    || durationSeconds < 0
    || !Number.isSafeInteger(frozenSeconds)
  ) {
    throw new LiveRanklistProjectorError('Live contest freeze boundary must use safe whole seconds');
  }
  const boundarySeconds = Math.max(0, durationSeconds - frozenSeconds);
  return `${boundarySeconds}000000000`;
}

function assertNever(value: never): never {
  throw new LiveRanklistProjectorError(`Unknown live contest event: ${JSON.stringify(value)}`);
}
