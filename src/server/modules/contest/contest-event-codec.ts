import crypto from 'crypto';
import Long from 'long';
import {
  rankland_live_contest_client,
  rankland_live_contest_common,
  rankland_live_contest_producer,
} from '@common/proto/rankland_live_contest';
import { ContestEventError, ContestEventErrorCode } from './contest-event-errors';
import {
  ContestClientEventBO,
  ContestEventsResponseBO,
  ContestProducerBatchBO,
  ContestProducerEventBO,
  ContestTimeDurationBO,
} from './contest-event-bo';

export interface ParsedProducerBatch {
  streamRevision: number;
  events: ContestProducerEventBO[];
}

export interface StoredEventInput {
  eventId: number;
  type: rankland_live_contest_common.EventType;
  producerId: string;
  solutionId?: number;
  userId?: string;
  problemAlias?: string;
  percentageProgress?: number;
  previousResult?: rankland_live_contest_common.Result;
  result?: rankland_live_contest_common.Result;
  timeNs?: string;
  solutionSubmitTimeNs?: string;
  payloadHash: string;
  payloadBytes: Buffer;
}

export interface StoredClientEventLike {
  eventId: number;
  type: rankland_live_contest_common.EventType;
  payloadBytes: Buffer | Uint8Array;
}

const jsonConversionOptions = {
  longs: String,
  enums: String,
};

const boConversionOptions = {
  longs: String,
};

const eventDataFieldByType: Record<number, keyof ContestProducerEventBO> = {
  [rankland_live_contest_common.EventType.NEW_SOLUTION]: 'newSolutionData',
  [rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS]: 'solutionOnProgressData',
  [rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE]: 'solutionOnResultSettleData',
  [rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_CHANGE]: 'solutionOnResultChangeData',
  [rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE]: 'contestConfigChangeData',
};

export function parseProducerBatchJson(data: unknown): ParsedProducerBatch {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw invalidBatch('producer batch JSON body must be an object');
  }
  if (Object.prototype.hasOwnProperty.call(data, 'eventsBase64')) {
    throw invalidBatch('eventsBase64 JSON envelope is no longer supported; send BatchProducerEvent JSON directly');
  }

  let batch: rankland_live_contest_producer.BatchProducerEvent;
  try {
    batch = rankland_live_contest_producer.BatchProducerEvent.fromObject(data as Record<string, unknown>);
  } catch (e) {
    throw invalidBatch(`invalid producer batch JSON: ${(e as Error).message}`);
  }

  const verifyError = rankland_live_contest_producer.BatchProducerEvent.verify(batch);
  if (verifyError) {
    throw invalidBatch(`invalid producer batch JSON: ${verifyError}`);
  }

  return validateProducerBatch(toProducerBatchBO(batch), 'invalid producer batch JSON');
}

function toProducerBatchBO(
  batch: rankland_live_contest_producer.BatchProducerEvent,
): ContestProducerBatchBO {
  return rankland_live_contest_producer.BatchProducerEvent.toObject(
    batch,
    boConversionOptions,
  ) as ContestProducerBatchBO;
}

function validateProducerBatch(batch: ContestProducerBatchBO, prefix: string): ParsedProducerBatch {
  if (!Number.isInteger(batch.streamRevision) || batch.streamRevision < 1) {
    throw invalidBatch(`${prefix}: streamRevision must be a positive integer`);
  }
  if (!batch.events?.length) {
    throw invalidBatch('event batch must not be empty');
  }

  let previousEventId = 0;
  for (const item of batch.events) {
    if (!item.eventId || item.eventId < 1) {
      throw invalidBatch('event id must be greater than 0');
    }
    if (item.eventId <= previousEventId) {
      throw invalidBatch('event ids must be strictly increasing');
    }
    previousEventId = item.eventId;
    assertEventPayloadMatchesType(item);
  }

  return { streamRevision: batch.streamRevision, events: batch.events };
}

export function eventToStoredEventInput(
  event: ContestProducerEventBO,
  producerId: string,
): StoredEventInput {
  const clientEvent = producerEventToClientEvent(event);
  const payloadBytes = Buffer.from(rankland_live_contest_client.ClientEvent.encode(clientEvent as any).finish());
  const base = {
    eventId: event.eventId,
    type: event.type,
    payloadHash: crypto.createHash('sha256').update(payloadBytes).digest('hex'),
    payloadBytes,
    producerId,
  };

  switch (event.type) {
    case rankland_live_contest_common.EventType.NEW_SOLUTION: {
      const data = event.newSolutionData;
      const timeNs = timeDurationToNanoseconds(data.time).toString();
      return {
        ...base,
        solutionId: data.solutionId,
        userId: data.userId,
        problemAlias: data.problemAlias,
        timeNs,
        solutionSubmitTimeNs: timeNs,
      };
    }
    case rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS: {
      const data = event.solutionOnProgressData;
      return {
        ...base,
        solutionId: data.solutionId,
        percentageProgress: data.percentageProgress,
      };
    }
    case rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE: {
      const data = event.solutionOnResultSettleData;
      return {
        ...base,
        solutionId: data.solutionId,
        result: data.result,
        timeNs: timeDurationToNanoseconds(data.time).toString(),
      };
    }
    case rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_CHANGE: {
      const data = event.solutionOnResultChangeData;
      return {
        ...base,
        solutionId: data.solutionId,
        previousResult: data.previousResult,
        result: data.result,
        timeNs: timeDurationToNanoseconds(data.time).toString(),
      };
    }
    case rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE:
      return base;
  }
}

export function storedEventToClientEvent(event: StoredClientEventLike): ContestClientEventBO {
  const decoded = rankland_live_contest_client.ClientEvent.decode(event.payloadBytes);
  const verifyError = rankland_live_contest_client.ClientEvent.verify(decoded);
  if (verifyError) {
    throw invalidBatch(`invalid stored client event: ${verifyError}`);
  }
  return normalizeClientEventTimeToNanoseconds(toClientEventBO(decoded));
}

export function getContestEventsResponseToJson(response: ContestEventsResponseBO): Record<string, any> {
  const message = rankland_live_contest_client.GetContestEventsResponse.fromObject(
    getContestEventsResponseToProtobufObject(response) as any,
  );
  const json = rankland_live_contest_client.GetContestEventsResponse.toObject(message, {
    ...jsonConversionOptions,
    arrays: true,
  }) as Record<string, any>;
  if (response.fromEventId === null) {
    json.fromEventId = null;
  }
  if (response.toEventId === null) {
    json.toEventId = null;
  }
  delete json._fromEventId;
  delete json._toEventId;
  return json;
}

function getContestEventsResponseToProtobufObject(response: ContestEventsResponseBO): Record<string, unknown> {
  const object: Record<string, unknown> = {
    uk: response.uk,
    checkpointEventId: response.checkpointEventId,
    latestEventId: response.latestEventId,
    streamRevision: response.streamRevision,
    hasMore: response.hasMore,
    resetRequired: response.resetRequired,
    events: response.events,
  };
  if (response.fromEventId !== null) {
    object.fromEventId = response.fromEventId;
  }
  if (response.toEventId !== null) {
    object.toEventId = response.toEventId;
  }
  if (response.resetReason) {
    object.resetReason = response.resetReason;
  }
  return object;
}

function toClientEventBO(event: any): ContestClientEventBO {
  return rankland_live_contest_client.ClientEvent.toObject(event, boConversionOptions) as ContestClientEventBO;
}

export function compactSettledProgressEvents(
  events: ContestClientEventBO[],
  settledEventIdsBySolutionId: ReadonlyMap<number, number> = new Map(),
): ContestClientEventBO[] {
  const settledBySolutionId = new Map<number, number>(settledEventIdsBySolutionId);
  for (const event of events) {
    const solutionId = getSettledSolutionId(event);
    if (solutionId !== undefined) {
      settledBySolutionId.set(solutionId, Math.max(settledBySolutionId.get(solutionId) || 0, event.eventId));
    }
  }

  return events.filter((event) => {
    if (event.type !== rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS) {
      return true;
    }
    const solutionId = event.solutionOnProgressData?.solutionId;
    if (solutionId === undefined) {
      return true;
    }
    return (settledBySolutionId.get(solutionId) || 0) <= event.eventId;
  });
}

function producerEventToClientEvent(
  event: ContestProducerEventBO,
): ContestClientEventBO {
  switch (event.type) {
    case rankland_live_contest_common.EventType.NEW_SOLUTION:
      return {
        eventId: event.eventId,
        type: event.type,
        newSolutionData: normalizeNewSolutionTime(event.newSolutionData),
      };
    case rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS:
      return {
        eventId: event.eventId,
        type: event.type,
        solutionOnProgressData: event.solutionOnProgressData,
      };
    case rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE:
      return {
        eventId: event.eventId,
        type: event.type,
        solutionOnResultSettleData: normalizeResultSettleTime(event.solutionOnResultSettleData),
      };
    case rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_CHANGE:
      return {
        eventId: event.eventId,
        type: event.type,
        solutionOnResultChangeData: normalizeResultChangeTime(event.solutionOnResultChangeData),
      };
    case rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE:
      return {
        eventId: event.eventId,
        type: event.type,
        contestConfigChangeData: event.contestConfigChangeData || {},
      };
  }
}

function normalizeClientEventTimeToNanoseconds(
  event: ContestClientEventBO,
): ContestClientEventBO {
  if (event.newSolutionData?.time) {
    event.newSolutionData = normalizeNewSolutionTime(event.newSolutionData);
  }
  if (event.solutionOnResultSettleData?.time) {
    event.solutionOnResultSettleData = normalizeResultSettleTime(event.solutionOnResultSettleData);
  }
  if (event.solutionOnResultChangeData?.time) {
    event.solutionOnResultChangeData = normalizeResultChangeTime(event.solutionOnResultChangeData);
  }
  return event;
}

function normalizeNewSolutionTime(data: any) {
  return {
    ...data,
    time: normalizeTimeDuration(data.time),
  };
}

function normalizeResultSettleTime(data: any) {
  return {
    ...data,
    time: normalizeTimeDuration(data.time),
  };
}

function normalizeResultChangeTime(data: any) {
  return {
    ...data,
    time: normalizeTimeDuration(data.time),
  };
}

function normalizeTimeDuration(data: any): ContestTimeDurationBO {
  return {
    value: timeDurationToNanoseconds(data).toString(),
    unit: rankland_live_contest_common.TimeUnit.NS,
  };
}

export function timeDurationToNanoseconds(data: any): Long {
  if (!data) {
    throw invalidBatch('time duration is required');
  }
  const value = Long.fromValue(data.value || 0);
  switch (data.unit) {
    case rankland_live_contest_common.TimeUnit.S:
      return value.mul(1_000_000_000);
    case rankland_live_contest_common.TimeUnit.MS:
      return value.mul(1_000_000);
    case rankland_live_contest_common.TimeUnit.US:
      return value.mul(1_000);
    case rankland_live_contest_common.TimeUnit.NS:
    default:
      return value;
  }
}

function assertEventPayloadMatchesType(event: ContestProducerEventBO) {
  const expectedField = eventDataFieldByType[event.type];
  if (!expectedField) {
    throw invalidBatch(`unsupported event type ${event.type}`);
  }
  if (!event[expectedField]) {
    throw invalidBatch(`event type ${event.type} requires ${expectedField}`);
  }
  switch (event.type) {
    case rankland_live_contest_common.EventType.NEW_SOLUTION:
      assertNewSolutionEvent(event.newSolutionData);
      break;
    case rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS:
      assertProgressEvent(event.solutionOnProgressData);
      break;
    case rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE:
      assertResultSettleEvent(event.solutionOnResultSettleData);
      break;
    case rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_CHANGE:
      assertResultChangeEvent(event.solutionOnResultChangeData);
      break;
    case rankland_live_contest_common.EventType.CONTEST_CONFIG_CHANGE:
      break;
  }
}

function getSettledSolutionId(event: ContestClientEventBO): number | undefined {
  if (event.type === rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE) {
    return event.solutionOnResultSettleData?.solutionId;
  }
  if (event.type === rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_CHANGE) {
    return event.solutionOnResultChangeData?.solutionId;
  }
  return undefined;
}

function invalidBatch(message: string): ContestEventError {
  return new ContestEventError(ContestEventErrorCode.InvalidEventBatch, message);
}

function assertNewSolutionEvent(data: any): void {
  assertPositiveId(data.solutionId, 'newSolutionData.solutionId');
  assertNonEmptyString(data.userId, 'newSolutionData.userId');
  assertNonEmptyString(data.problemAlias, 'newSolutionData.problemAlias');
  assertValidTime(data.time, 'newSolutionData.time');
}

function assertProgressEvent(data: any): void {
  assertPositiveId(data.solutionId, 'solutionOnProgressData.solutionId');
  if (data.percentageProgress === undefined || data.percentageProgress < 0 || data.percentageProgress > 100) {
    throw invalidBatch('solutionOnProgressData.percentageProgress must be between 0 and 100');
  }
}

function assertResultSettleEvent(data: any): void {
  assertPositiveId(data.solutionId, 'solutionOnResultSettleData.solutionId');
  assertKnownResult(data.result, 'solutionOnResultSettleData.result');
  assertValidTime(data.time, 'solutionOnResultSettleData.time');
}

function assertResultChangeEvent(data: any): void {
  assertPositiveId(data.solutionId, 'solutionOnResultChangeData.solutionId');
  assertKnownResult(data.previousResult, 'solutionOnResultChangeData.previousResult');
  assertKnownResult(data.result, 'solutionOnResultChangeData.result');
  assertValidTime(data.time, 'solutionOnResultChangeData.time');
}

function assertPositiveId(value: number | undefined, field: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw invalidBatch(`${field} must be greater than 0`);
  }
}

function assertNonEmptyString(value: string | undefined, field: string): void {
  if (typeof value !== 'string' || value.trim() === '') {
    throw invalidBatch(`${field} must not be empty`);
  }
}

function assertKnownResult(value: number | undefined, field: string): void {
  if (value === undefined || typeof rankland_live_contest_common.Result[value] !== 'string') {
    throw invalidBatch(`${field} must be a known result`);
  }
}

function assertValidTime(data: any, field: string): void {
  if (!data) {
    throw invalidBatch(`${field} is required`);
  }
  const value = timeDurationToNanoseconds(data);
  if (value.lessThan(Long.ZERO)) {
    throw invalidBatch(`${field} must not be negative`);
  }
}
