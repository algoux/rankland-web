import type * as srk from '@algoux/standard-ranklist';
import Long from 'long';
import protobuf from 'protobufjs/minimal';
import {
  rankland_live_contest_client as clientProto,
  rankland_live_contest_common as commonProto,
} from '@/proto/rankland_live_contest_client';
import type {
  LiveContestEvent,
  LiveContestEventPage,
  LiveJudgeResult,
} from './live-contest-types';

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

configureLongSupport();

export function decodeLiveContestEventPage(bytes: Uint8Array): LiveContestEventPage {
  const page = clientProto.GetContestEventsResponse.decode(bytes);
  return {
    uk: page.uk,
    fromEventId: page.fromEventId ?? null,
    toEventId: page.toEventId ?? null,
    checkpointEventId: page.checkpointEventId,
    latestEventId: page.latestEventId,
    streamRevision: page.streamRevision,
    hasMore: page.hasMore,
    resetRequired: page.resetRequired,
    resetReason: page.resetReason || '',
    events: page.events.map(decodeEvent),
  };
}

function decodeEvent(event: clientProto.IClientEvent): LiveContestEvent {
  const eventId = requirePositiveInteger(event.eventId, 'eventId');
  switch (event.type) {
    case commonProto.EventType.NEW_SOLUTION: {
      const data = requireValue(event.newSolutionData, 'newSolutionData');
      const decodedTime = decodeTime(requireValue(data.time, 'time'));
      return {
        eventId,
        type: 'NEW',
        solutionId: requirePositiveInteger(data.solutionId, 'solutionId'),
        userId: requireString(data.userId, 'userId'),
        problemAlias: requireString(data.problemAlias, 'problemAlias'),
        time: decodedTime.time,
        timeNs: decodedTime.nanoseconds,
      };
    }
    case commonProto.EventType.SOLUTION_ON_PROGRESS: {
      const data = requireValue(event.solutionOnProgressData, 'solutionOnProgressData');
      return {
        eventId,
        type: 'PROGRESS',
        solutionId: requirePositiveInteger(data.solutionId, 'solutionId'),
        percentageProgress: requirePercentage(data.percentageProgress),
        ...(data.time ? { time: convertTime(data.time) } : {}),
      };
    }
    case commonProto.EventType.SOLUTION_ON_RESULT_SETTLE: {
      const data = requireValue(event.solutionOnResultSettleData, 'solutionOnResultSettleData');
      return {
        eventId,
        type: 'SETTLE',
        solutionId: requirePositiveInteger(data.solutionId, 'solutionId'),
        result: convertResult(data.result),
        time: convertTime(requireValue(data.time, 'time')),
      };
    }
    case commonProto.EventType.SOLUTION_ON_RESULT_CHANGE: {
      const data = requireValue(event.solutionOnResultChangeData, 'solutionOnResultChangeData');
      return {
        eventId,
        type: 'CHANGE',
        solutionId: requirePositiveInteger(data.solutionId, 'solutionId'),
        previousResult: convertResult(data.previousResult),
        result: convertResult(data.result),
        time: convertTime(requireValue(data.time, 'time')),
      };
    }
    case commonProto.EventType.CONTEST_CONFIG_CHANGE: {
      const data = requireValue(event.contestConfigChangeData, 'contestConfigChangeData');
      return {
        eventId,
        type: 'CONFIG_CHANGE',
        changedFields: [...(data.changedFields || [])],
        ...(data.time ? { time: convertTime(data.time) } : {}),
      };
    }
    default:
      throw new TypeError(`Unknown contest event type: ${event.type}`);
  }
}

function configureLongSupport() {
  if (protobuf.util.Long !== Long) {
    (protobuf.util as typeof protobuf.util & { Long: typeof Long }).Long = Long;
    protobuf.configure();
  }
}

function convertResult(value: commonProto.Result | null | undefined): LiveJudgeResult {
  const result = value === null || value === undefined ? undefined : RESULT_MAP[value];
  if (!result) {
    throw new TypeError(`Unknown contest solution result: ${value}`);
  }
  return result;
}

function convertTime(time: commonProto.ITimeDuration): srk.TimeDuration {
  return decodeTime(time).time;
}

function decodeTime(time: commonProto.ITimeDuration) {
  const value = Long.isLong(time.value)
    ? time.value
    : Long.fromValue(time.value ?? 0);
  if (value.isNegative()) {
    throw new TypeError('Contest event time cannot be negative');
  }
  let converted: srk.TimeDuration;
  let nanosecondZeroes: number;
  switch (time.unit) {
    case commonProto.TimeUnit.S:
      converted = [toSafeNumber(value), 's'];
      nanosecondZeroes = 9;
      break;
    case commonProto.TimeUnit.MS:
      converted = divideDuration(value, 1_000);
      nanosecondZeroes = 6;
      break;
    case commonProto.TimeUnit.US:
      converted = divideDuration(value, 1_000_000);
      nanosecondZeroes = 3;
      break;
    case commonProto.TimeUnit.NS:
      converted = divideDuration(value, 1_000_000_000);
      nanosecondZeroes = 0;
      break;
    default:
      throw new TypeError(`Unknown contest event time unit: ${time.unit}`);
  }
  const integer = value.toString().replace(/^0+(?=\d)/, '');
  return {
    time: converted,
    nanoseconds: `${integer}${'0'.repeat(nanosecondZeroes)}`,
  };
}

function divideDuration(value: Long, divisorValue: number): srk.TimeDuration {
  const divisor = Long.fromNumber(divisorValue);
  const quotient = value.div(divisor);
  const remainder = value.mod(divisor);
  const wholeSeconds = toSafeNumber(quotient);
  if (!remainder.isZero() && wholeSeconds === Number.MAX_SAFE_INTEGER) {
    throw new RangeError(`Contest event time exceeds the safe SRK range: ${value.toString()}`);
  }
  return [wholeSeconds + remainder.toNumber() / divisorValue, 's'];
}

function toSafeNumber(value: Long) {
  const number = value.toNumber();
  if (!Number.isSafeInteger(number)) {
    throw new RangeError(`Contest event time exceeds the safe SRK range: ${value.toString()}`);
  }
  return number;
}

function requireValue<T>(value: T | null | undefined, field: string): T {
  if (value === null || value === undefined) {
    throw new TypeError(`Missing contest event field: ${field}`);
  }
  return value;
}

function requireString(value: string | null | undefined, field: string) {
  if (!value || value.trim() === '') {
    throw new TypeError(`Missing contest event field: ${field}`);
  }
  return value;
}

function requirePositiveInteger(value: number | null | undefined, field: string) {
  if (!Number.isInteger(value) || (value ?? 0) < 1) {
    throw new TypeError(`Invalid contest event field: ${field}`);
  }
  return value as number;
}

function requirePercentage(value: number | null | undefined) {
  if (!Number.isInteger(value) || (value ?? -1) < 0 || (value ?? 101) > 100) {
    throw new TypeError('Invalid contest event field: percentageProgress');
  }
  return value as number;
}
