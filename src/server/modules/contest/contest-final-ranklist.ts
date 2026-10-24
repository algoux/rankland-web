import type * as srk from '@algoux/standard-ranklist';
import { numberToAlphabet } from '@algoux/standard-ranklist-utils';
import Long from 'long';

import { ErrCode } from '@common/enums/err-code.enum';
import type {
  LiveContestConfig,
  LiveContestEvent,
  LiveJudgeResult,
} from '@common/modules/contest/live-contest-types';
import { LiveRanklistProjector } from '@common/modules/contest/live-ranklist-projector';
import { rankland_live_contest_common as commonProto } from '@common/proto/rankland_live_contest';
import LogicException from '@server/exceptions/logic.exception';
import type { ContestClientEventBO, ContestTimeDurationBO } from './contest-event-bo';
import { storedEventToClientEvent } from './contest-event-codec';
import type { ContestReadableEvent } from './contest-event-store';

const MAX_PENDING_SOLUTION_IDS = 20;
const RESULT_MAP: Record<number, LiveJudgeResult> = {
  [commonProto.Result.PD]: 'PD',
  [commonProto.Result.JG]: 'JG',
  [commonProto.Result.CNL]: 'CNL',
  [commonProto.Result.FZ]: '?',
  [commonProto.Result.UKE]: 'UKE',
  [commonProto.Result.AC]: 'AC',
  [commonProto.Result.FB]: 'AC',
  [commonProto.Result.RJ]: 'RJ',
  [commonProto.Result.WA]: 'WA',
  [commonProto.Result.PE]: 'PE',
  [commonProto.Result.TLE]: 'TLE',
  [commonProto.Result.MLE]: 'MLE',
  [commonProto.Result.OLE]: 'OLE',
  [commonProto.Result.RTE]: 'RTE',
  [commonProto.Result.NOUT]: 'NOUT',
  [commonProto.Result.CE]: 'CE',
};

/** Builds one complete, unfrozen archive from ordered pages of a single raw event stream. */
export class FinalContestRanklistBuilder {
  private readonly projector: LiveRanklistProjector;
  private readonly userIds: Set<string>;
  private readonly problemAliases: Set<string>;
  private readonly solutionResults = new Map<number, LiveJudgeResult | null>();
  private nextEventId = 1;
  private source: { contestId: string; streamRevision: number } | undefined;

  public constructor(config: LiveContestConfig) {
    this.userIds = new Set(config.users.map((user) => user.id));
    if (this.userIds.size !== config.users.length || [...this.userIds].some((id) => !id?.trim())) {
      throw invalidData('Contest users must have unique, nonempty ids');
    }
    this.problemAliases = new Set(config.problems.map((problem, index) => problem.alias || numberToAlphabet(index)));
    try {
      this.projector = new LiveRanklistProjector(config, { inferFrozenSolutions: false });
    } catch (error) {
      throw invalidData(error instanceof Error ? error.message : 'Invalid contest configuration');
    }
  }

  public ingest(events: ContestReadableEvent[]): void {
    const projectedEvents: LiveContestEvent[] = [];
    for (const stored of events) {
      if (stored.eventId !== this.nextEventId) {
        throw invalidData('Contest event ids must be consecutive from 1', {
          expectedEventId: this.nextEventId,
          eventId: stored.eventId,
        });
      }
      if (this.source && (
        stored.contestId !== this.source.contestId
        || stored.streamRevision !== this.source.streamRevision
      )) {
        throw invalidData('Contest events must belong to one stream revision', { eventId: stored.eventId });
      }
      this.source ??= { contestId: stored.contestId, streamRevision: stored.streamRevision };

      let event: LiveContestEvent;
      try {
        const decoded = storedEventToClientEvent(stored);
        if (decoded.eventId !== stored.eventId || decoded.type !== stored.type) {
          throw new Error('Stored event metadata does not match its payload');
        }
        event = toProjectorEvent(decoded);
      } catch (error) {
        throw invalidData(error instanceof Error ? error.message : 'Invalid stored contest event', {
          eventId: stored.eventId,
        });
      }

      if (event.type === 'NEW') {
        if (this.solutionResults.has(event.solutionId)) {
          throw invalidData('A solution has more than one NEW event', {
            eventId: event.eventId,
            solutionId: event.solutionId,
          });
        }
        if (!this.userIds.has(event.userId) || !this.problemAliases.has(event.problemAlias)) {
          throw invalidData('A solution references an unknown contest user or problem', {
            eventId: event.eventId,
            solutionId: event.solutionId,
          });
        }
        this.solutionResults.set(event.solutionId, null);
      } else if (event.type !== 'CONFIG_CHANGE') {
        if (!this.solutionResults.has(event.solutionId)) {
          throw invalidData('A solution event is missing its preceding NEW event', {
            eventId: event.eventId,
            solutionId: event.solutionId,
          });
        }
        this.solutionResults.set(event.solutionId, event.type === 'PROGRESS' ? null : event.result);
      }

      // The final archive uses the locked current metadata supplied to the constructor.
      if (event.type !== 'CONFIG_CHANGE') projectedEvents.push(event);
      this.nextEventId += 1;
    }
    this.projector.ingestInitial(projectedEvents);
  }

  public finish(): srk.Ranklist {
    let pendingCount = 0;
    const pendingSolutionIds: number[] = [];
    for (const [solutionId, result] of this.solutionResults) {
      if (result === null || result === 'PD' || result === 'JG' || result === '?') {
        pendingCount += 1;
        if (pendingSolutionIds.length < MAX_PENDING_SOLUTION_IDS) {
          pendingSolutionIds.push(solutionId);
        }
      }
    }
    if (pendingCount > 0) {
      throw new LogicException(ErrCode.ContestFinalizationIncomplete, 'Contest has unfinished solutions', {
        pendingCount,
        pendingSolutionIds,
      });
    }
    return this.projector.finishInitial();
  }
}

function toProjectorEvent(event: ContestClientEventBO): LiveContestEvent {
  switch (event.type) {
    case commonProto.EventType.NEW_SOLUTION: {
      const data = requireValue(event.newSolutionData, 'newSolutionData');
      const time = decodeTime(data.time);
      return {
        eventId: event.eventId,
        type: 'NEW',
        solutionId: solutionId(data.solutionId),
        userId: data.userId,
        problemAlias: data.problemAlias,
        time: time.duration,
        timeNs: time.nanoseconds,
      };
    }
    case commonProto.EventType.SOLUTION_ON_PROGRESS: {
      const data = requireValue(event.solutionOnProgressData, 'solutionOnProgressData');
      if (!Number.isInteger(data.percentageProgress) || data.percentageProgress < 0 || data.percentageProgress > 100) {
        throw new Error('Invalid solution progress');
      }
      return {
        eventId: event.eventId,
        type: 'PROGRESS',
        solutionId: solutionId(data.solutionId),
        percentageProgress: data.percentageProgress,
      };
    }
    case commonProto.EventType.SOLUTION_ON_RESULT_SETTLE: {
      const data = requireValue(event.solutionOnResultSettleData, 'solutionOnResultSettleData');
      return {
        eventId: event.eventId,
        type: 'SETTLE',
        solutionId: solutionId(data.solutionId),
        result: resultName(data.result),
        time: decodeTime(data.time).duration,
      };
    }
    case commonProto.EventType.SOLUTION_ON_RESULT_CHANGE: {
      const data = requireValue(event.solutionOnResultChangeData, 'solutionOnResultChangeData');
      return {
        eventId: event.eventId,
        type: 'CHANGE',
        solutionId: solutionId(data.solutionId),
        previousResult: resultName(data.previousResult),
        result: resultName(data.result),
        time: decodeTime(data.time).duration,
      };
    }
    case commonProto.EventType.CONTEST_CONFIG_CHANGE:
      return { eventId: event.eventId, type: 'CONFIG_CHANGE', changedFields: [] };
    default:
      throw new Error('Unknown contest event type');
  }
}

function decodeTime(time: ContestTimeDurationBO | undefined) {
  requireValue(time, 'time');
  if (typeof time.value !== 'string' || !/^\d+$/.test(time.value)) {
    throw new Error('Contest event time must be a nonnegative integer');
  }
  // storedEventToClientEvent normalizes producer seconds/milliseconds/microseconds to nanoseconds.
  if (time.unit !== commonProto.TimeUnit.NS) {
    throw new Error('Stored contest event time must normalize to nanoseconds');
  }
  const value = Long.fromString(time.value);
  if (value.isNegative() || value.toString() !== time.value.replace(/^0+(?=\d)/, '')) {
    throw new Error('Contest event time exceeds the supported integer range');
  }
  const divisor = Long.fromNumber(1_000_000_000);
  const seconds = value.div(divisor).toNumber();
  const fraction = value.mod(divisor).toNumber() / 1_000_000_000;
  return {
    duration: [seconds + fraction, 's'] as srk.TimeDuration,
    nanoseconds: value.toString(),
  };
}

function resultName(value: commonProto.Result): LiveJudgeResult {
  const result = RESULT_MAP[value];
  if (!result) {
    throw new Error('Unknown contest solution result');
  }
  return result;
}

function solutionId(value: number): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error('Invalid contest solution id');
  }
  return value;
}

function requireValue<T>(value: T | undefined, field: string): T {
  if (value === undefined || value === null) {
    throw new Error(`Missing contest event field: ${field}`);
  }
  return value;
}

function invalidData(message: string, meta?: Record<string, unknown>): LogicException {
  return new LogicException(ErrCode.ContestFinalizationInvalidData, message, meta);
}
