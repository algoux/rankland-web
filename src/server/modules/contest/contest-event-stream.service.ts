import { Inject, Provide } from 'bwcx-core';
import {
  compactSettledProgressEvents,
  eventToStoredEventInput,
  StoredEventInput,
  storedEventToClientEvent,
} from './contest-event-codec';
import { ContestEventStore, ContestReadableEvent } from './contest-event-store';
import TypeOrmContestEventStore from './contest-event-store.typeorm';
import { rankland_live_contest_client, rankland_live_contest_common } from '@common/proto/rankland_live_contest';
import Long from 'long';
import { ContestClientEventBO, ContestEventsResponseBO, ContestProducerBatchBO } from './contest-event-bo';
import LogicException from '@server/exceptions/logic.exception';
import { ErrCode } from '@common/enums/err-code.enum';
import ContestEventReadCache, {
  ContestEventReadCacheUnavailableError,
  ContestEventReadFormat,
} from './contest-event-read-cache';
import ContestEventReadCacheConfig from '@server/configs/contest-event-read-cache/contest-event-read-cache.config';
import { trustedPreEncodedProtobuf, trustedPreNormalizedJson, TrustedResponse } from '@server/http/trusted-response';
import HttpException from '@server/exceptions/http.exception';
import { getContestEventsResponseToJson } from './contest-event-codec';
import ContestEventReadBulkhead, { ContestEventReadBulkheadError } from './contest-event-read-bulkhead';
import { isDeepStrictEqual } from 'util';
import type { ContestEventReadCacheResult } from './contest-event-read-cache';
import { contestEventReadMetrics } from './contest-event-read-metrics';
import { ContestEventReadDatabaseUnavailableError } from './contest-event-read-db-deadline';

export interface AppendProducerEventsInput {
  uk: string;
  producerId: unknown;
  batch: ContestProducerBatchBO;
}

export interface AppendProducerEventsResult {
  contestId: string;
  canonicalUk: string;
  acceptedEventIds: number[];
  duplicateEventIds: number[];
  lastEventId: number;
  expectedNextEventId: number;
  streamRevision: number;
  /** Internal post-commit delta; controllers must not expose it on the wire. */
  committedEvents: ContestReadableEvent[];
}

export interface GetClientEventsInput {
  uk: string;
  afterEventId: number;
  limit: number;
  streamRevision: number;
  compactProgress?: boolean;
}

export interface GetClientEventsResult extends ContestEventsResponseBO {}

@Provide()
export default class ContestEventStreamService {
  private readonly fallbackBulkhead: ContestEventReadBulkhead;
  private readonly authoritativeStateFlights = new Map<
    string,
    Promise<Awaited<ReturnType<ContestEventStore['getStreamState']>>>
  >();

  public constructor(
    @Inject(TypeOrmContestEventStore) private readonly store: ContestEventStore,
    @Inject(ContestEventReadCache) private readonly readCache?: ContestEventReadCache,
    @Inject(ContestEventReadCacheConfig)
    private readonly readCacheConfig?: Partial<
      Pick<
        ContestEventReadCacheConfig,
        | 'mode'
        | 'fallbackConcurrency'
        | 'fallbackQueueSize'
        | 'fallbackQueueTimeoutMs'
        | 'retryAfterSeconds'
        | 'onCompareSampleRate'
        | 'bootstrapAuthorityCoalescingEnabled'
      >
    >,
  ) {
    this.fallbackBulkhead = new ContestEventReadBulkhead(
      readCacheConfig?.fallbackConcurrency ?? 4,
      readCacheConfig?.fallbackQueueSize ?? 32,
      readCacheConfig?.fallbackQueueTimeoutMs ?? 1_000,
    );
  }

  public async appendProducerEvents(input: AppendProducerEventsInput): Promise<AppendProducerEventsResult> {
    const producerId = normalizeProducerId(input.producerId);
    const storedEvents = input.batch.events.map((event) => eventToStoredEventInput(event, producerId));
    const eventIds = storedEvents.map((event) => event.eventId);

    return this.store.runInStreamTransaction(input.uk, async (transaction) => {
      const { stream } = transaction;
      if (input.batch.streamRevision !== stream.streamRevision) {
        throw new LogicException(
          ErrCode.ContestEventStreamRevisionMismatch,
          `expected stream revision ${stream.streamRevision} but received ${input.batch.streamRevision}`,
        );
      }
      if (!stream.producerId) {
        await transaction.setProducerLock(producerId);
        stream.producerId = producerId;
      } else if (stream.producerId !== producerId) {
        throw new LogicException(
          ErrCode.ContestEventProducerLocked,
          `contest ${input.uk} is locked by another producer`,
        );
      }

      const acceptedEventIds: number[] = [];
      const duplicateEventIds: number[] = [];
      const newEvents: typeof storedEvents = [];
      const existingEvents = await transaction.findEvents(eventIds);
      const existingEventsById = new Map(existingEvents.map((event) => [event.eventId, event]));
      const batchSubmitTimesByEventId = getBatchSubmitTimesByEventId(storedEvents);
      const solutionIdsNeedingLookup = new Set<number>();
      for (const stored of storedEvents) {
        if (existingEventsById.has(stored.eventId) || !needsSolutionSubmitTime(stored)) {
          continue;
        }
        if (!batchSubmitTimesByEventId.has(stored.eventId)) {
          solutionIdsNeedingLookup.add(stored.solutionId);
        }
      }
      const persistedSubmitTimesBySolutionId = await transaction.findNewSolutionSubmitTimes([
        ...solutionIdsNeedingLookup,
      ]);
      let cursor = stream.lastEventId;

      for (const stored of storedEvents) {
        const existing = existingEventsById.get(stored.eventId);
        if (existing) {
          if (existing.payloadHash !== stored.payloadHash) {
            throw new LogicException(
              ErrCode.ContestEventIdConflict,
              `event id ${stored.eventId} already exists with different payload`,
            );
          }
          duplicateEventIds.push(stored.eventId);
          cursor = Math.max(cursor, stored.eventId);
          continue;
        }

        fillSolutionSubmitTime(stored, batchSubmitTimesByEventId, persistedSubmitTimesBySolutionId);

        const expectedEventId = cursor + 1;
        if (stored.eventId !== expectedEventId) {
          throw new LogicException(
            ErrCode.ContestEventIdGap,
            `expected event id ${expectedEventId} but received ${stored.eventId}`,
          );
        }

        newEvents.push(stored);
        acceptedEventIds.push(stored.eventId);
        cursor = stored.eventId;
      }

      if (newEvents.length > 0) {
        await transaction.insertEvents(newEvents);
      }

      if (cursor !== stream.lastEventId) {
        await transaction.advanceLastEventId(cursor);
      }

      return {
        contestId: stream.contestId,
        canonicalUk: stream.uk,
        acceptedEventIds,
        duplicateEventIds,
        lastEventId: cursor,
        expectedNextEventId: cursor + 1,
        streamRevision: stream.streamRevision,
        committedEvents: newEvents.map((event) => ({
          contestId: stream.contestId,
          streamRevision: stream.streamRevision,
          eventId: event.eventId,
          type: event.type,
          solutionId: event.solutionId,
          solutionSubmitTimeNs: event.solutionSubmitTimeNs,
          payloadBytes: event.payloadBytes,
        })),
      };
    });
  }

  public async getClientEvents(input: GetClientEventsInput): Promise<GetClientEventsResult> {
    return this.getClientEventsAtFence(input);
  }

  private async getClientEventsAtFence(
    input: GetClientEventsInput,
    throughEventId?: number,
  ): Promise<GetClientEventsResult> {
    if (!Number.isInteger(input.streamRevision) || input.streamRevision < 1) {
      throw new LogicException(ErrCode.ContestEventInvalidBatch, 'streamRevision is required');
    }
    const afterEventId = Math.max(0, input.afterEventId ?? 0);
    const limit = Math.max(1, Math.min(input.limit ?? 1000, 1000));
    const snapshot = await this.store.readEventsSnapshot({
      uk: input.uk,
      afterEventId,
      limit: limit + 1,
      requestStreamRevision: input.streamRevision,
      compactProgress: input.compactProgress !== false,
      throughEventId,
    });
    const { stream } = snapshot;
    if (input.streamRevision !== stream.streamRevision) {
      return emptyResetResponse(input.uk, stream, 'stream revision changed');
    }
    if (afterEventId > stream.lastEventId) {
      return emptyResetResponse(input.uk, stream, 'afterEventId is ahead of latestEventId');
    }
    const storedEvents = snapshot.events;
    const page = storedEvents.slice(0, limit);
    const freezeVisiblePage = filterFrozenNonNewEvents(page, snapshot.frozenStartNs);
    const clientEvents: ContestClientEventBO[] = freezeVisiblePage.map(storedEventToClientEvent);
    const visibleEvents =
      input.compactProgress === false
        ? clientEvents
        : compactSettledProgressEvents(clientEvents, snapshot.settledEventIdsBySolutionId);
    const checkpointEventId = page.length ? page[page.length - 1].eventId : afterEventId;

    return {
      uk: input.uk,
      fromEventId: visibleEvents.length ? visibleEvents[0].eventId : null,
      toEventId: visibleEvents.length ? visibleEvents[visibleEvents.length - 1].eventId : null,
      checkpointEventId,
      latestEventId: stream.lastEventId,
      streamRevision: stream.streamRevision,
      hasMore: storedEvents.length > limit,
      events: visibleEvents,
      resetRequired: false,
    };
  }

  public async getClientEventsForTransport(
    input: GetClientEventsInput,
    format: ContestEventReadFormat,
  ): Promise<Record<string, any> | TrustedResponse> {
    const mode = this.readCacheConfig?.mode ?? 'off';
    if (mode === 'off' || !this.readCache) {
      return this.runLegacyRead(input);
    }
    if (mode === 'shadow') {
      const legacy = await this.runLegacyRead(input);
      this.runShadowRead(input, format, legacy).catch(() => undefined);
      return legacy;
    }

    try {
      const result = await this.readCache.getEvents(input, format);
      if (Math.random() < (this.readCacheConfig?.onCompareSampleRate ?? 0)) {
        this.runOnComparison(input, result).catch(() => undefined);
      }
      return result.format === 'protobuf'
        ? trustedPreEncodedProtobuf(result.body, result.release)
        : trustedPreNormalizedJson(result.data, result.release);
    } catch (error) {
      if (error instanceof ContestEventReadCacheUnavailableError) {
        if (error.reason === 'contest is oversize') {
          return this.runLegacyRead(input);
        }
        throw this.temporaryUnavailable();
      }
      throw error;
    }
  }

  public async releaseProducerLock(uk: string) {
    const state = await this.store.releaseProducerLock(uk);
    return { ...state, uk };
  }

  public async getStreamState(uk: string) {
    try {
      const state = await this.getAuthoritativeStreamState(uk);
      return { ...state, uk };
    } catch (error) {
      this.rethrowStreamAvailability(error);
    }
  }

  public async getCanonicalStreamState(uk: string) {
    try {
      return await this.getAuthoritativeStreamState(uk);
    } catch (error) {
      this.rethrowStreamAvailability(error);
    }
  }

  public async getAuthoritativeStreamState(uk: string) {
    if (this.readCacheConfig?.bootstrapAuthorityCoalescingEnabled === false) {
      return this.store.getStreamState(uk);
    }
    const key = normalizeAuthorityUk(uk);
    const existing = this.authoritativeStateFlights.get(key);
    if (existing) {
      contestEventReadMetrics.add('streamAuthoritySingleflightJoins');
      return existing;
    }
    const flight = this.store.getStreamState(uk);
    this.authoritativeStateFlights.set(key, flight);
    try {
      return await flight;
    } finally {
      if (this.authoritativeStateFlights.get(key) === flight) {
        this.authoritativeStateFlights.delete(key);
      }
    }
  }

  public async getFreshAuthoritativeStreamState(uk: string) {
    try {
      return await this.store.getStreamState(uk);
    } catch (error) {
      this.rethrowStreamAvailability(error);
    }
  }

  public async getAuthoritativeStreamStates(contestIds: readonly string[]) {
    try {
      return await this.store.getStreamStates(contestIds);
    } catch (error) {
      this.rethrowStreamAvailability(error);
    }
  }

  public async getAuthoritativeCacheStates(contestIds: readonly string[]) {
    return this.store.readAuthorityByContestIds(contestIds);
  }

  private async runShadowRead(
    input: GetClientEventsInput,
    format: ContestEventReadFormat,
    legacy: Record<string, any>,
  ): Promise<void> {
    if (!this.readCache) {
      return;
    }
    const result = await this.readCache.getEvents(input, format);
    try {
      this.readCache.recordComparison(
        input.uk,
        compareReadResponses(cacheResultToJson(result), legacy, 'inconclusive'),
      );
    } finally {
      result.release();
    }
  }

  private async runOnComparison(input: GetClientEventsInput, result: ContestEventReadCacheResult): Promise<void> {
    if (!this.readCache) {
      return;
    }
    const cached = result.format === 'json' ? structuredClone(result.data) : cacheResultToJson(result);
    const legacy = await this.runLegacyRead(input, Number(cached.latestEventId));
    this.readCache.recordComparison(input.uk, compareReadResponses(cached, legacy, 'authority-changed'));
  }

  private async runLegacyRead(input: GetClientEventsInput, throughEventId?: number): Promise<Record<string, any>> {
    try {
      contestEventReadMetrics.add('fallbackReads');
      return await this.fallbackBulkhead.run(async () =>
        getContestEventsResponseToJson(await this.getClientEventsAtFence(input, throughEventId)),
      );
    } catch (error) {
      if (error instanceof ContestEventReadBulkheadError) {
        contestEventReadMetrics.add('fallbackRejects');
        throw this.temporaryUnavailable();
      }
      if (error instanceof ContestEventReadDatabaseUnavailableError) {
        contestEventReadMetrics.add('fallbackRejects');
        throw this.temporaryUnavailable();
      }
      throw error;
    }
  }

  private temporaryUnavailable(): HttpException {
    return new HttpException(503, {
      'Retry-After': String(this.readCacheConfig?.retryAfterSeconds ?? 1),
    });
  }

  private rethrowStreamAvailability(error: unknown): never {
    if (error instanceof ContestEventReadDatabaseUnavailableError) {
      throw this.temporaryUnavailable();
    }
    throw error;
  }
}

function normalizeAuthorityUk(uk: string): string {
  return uk.normalize('NFC').toLocaleLowerCase('en-US');
}

function cacheResultToJson(result: ContestEventReadCacheResult): Record<string, any> {
  if (result.format === 'json') {
    return result.data as Record<string, any>;
  }
  const message = rankland_live_contest_client.GetContestEventsResponse.decode(result.body);
  const json = rankland_live_contest_client.GetContestEventsResponse.toObject(message, {
    longs: String,
    enums: String,
    arrays: true,
  }) as Record<string, any>;
  json.fromEventId = message._fromEventId ? message.fromEventId : null;
  json.toEventId = message._toEventId ? message.toEventId : null;
  delete json._fromEventId;
  delete json._toEventId;
  return json;
}

function compareReadResponses(
  cached: Record<string, any>,
  legacy: Record<string, any>,
  authorityDifference: 'inconclusive' | 'authority-changed',
): 'match' | 'mismatch' | 'inconclusive' | 'authority-changed' {
  if (
    cached.streamRevision !== legacy.streamRevision ||
    String(cached.latestEventId) !== String(legacy.latestEventId)
  ) {
    return authorityDifference;
  }
  return isDeepStrictEqual(cached, legacy) ? 'match' : 'mismatch';
}

function getBatchSubmitTimesByEventId(events: StoredEventInput[]): Map<number, string> {
  const submitTimesBySolutionId = new Map<number, string>();
  const result = new Map<number, string>();
  for (const event of events) {
    if (needsSolutionSubmitTime(event)) {
      const submitTimeNs = submitTimesBySolutionId.get(event.solutionId);
      if (submitTimeNs) {
        result.set(event.eventId, submitTimeNs);
      }
    }
    if (isNewSolutionEvent(event) && event.solutionId !== undefined && event.solutionId !== null && event.timeNs) {
      submitTimesBySolutionId.set(event.solutionId, event.timeNs);
    }
  }
  return result;
}

function fillSolutionSubmitTime(
  event: StoredEventInput,
  batchSubmitTimesByEventId: ReadonlyMap<number, string>,
  persistedSubmitTimesBySolutionId: ReadonlyMap<number, string>,
): void {
  if (isNewSolutionEvent(event)) {
    event.solutionSubmitTimeNs = event.timeNs || null;
    return;
  }
  if (!needsSolutionSubmitTime(event)) {
    return;
  }
  const submitTimeNs =
    batchSubmitTimesByEventId.get(event.eventId) || persistedSubmitTimesBySolutionId.get(event.solutionId);
  if (!submitTimeNs) {
    throw new LogicException(
      ErrCode.ContestEventInvalidBatch,
      `new solution for solution ${event.solutionId} is required before non-new events`,
    );
  }
  event.solutionSubmitTimeNs = submitTimeNs;
}

function filterFrozenNonNewEvents(
  events: ContestReadableEvent[],
  frozenStartNs?: string | null,
): ContestReadableEvent[] {
  if (!frozenStartNs) {
    return events;
  }
  const frozenStart = Long.fromString(frozenStartNs);
  return events.filter((event) => {
    if (!needsSolutionSubmitTime(event) || !event.solutionSubmitTimeNs) {
      return true;
    }
    return Long.fromString(event.solutionSubmitTimeNs).lt(frozenStart);
  });
}

function isNewSolutionEvent(event: StoredEventInput | ContestReadableEvent): boolean {
  return event.type === rankland_live_contest_common.EventType.NEW_SOLUTION;
}

function needsSolutionSubmitTime(
  event: StoredEventInput | ContestReadableEvent,
): event is (StoredEventInput | ContestReadableEvent) & { solutionId: number } {
  return (
    event.solutionId !== undefined &&
    event.solutionId !== null &&
    (event.type === rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS ||
      event.type === rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE ||
      event.type === rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_CHANGE)
  );
}

function normalizeProducerId(value: unknown): string {
  if (Array.isArray(value)) {
    throw new LogicException(ErrCode.ContestEventInvalidBatch, 'x-producer-id must be a single header');
  }
  if (typeof value !== 'string') {
    throw new LogicException(ErrCode.ContestEventInvalidBatch, 'x-producer-id is required');
  }
  const producerId = value.trim();
  if (!producerId) {
    throw new LogicException(ErrCode.ContestEventInvalidBatch, 'x-producer-id is required');
  }
  if (producerId.length > 128) {
    throw new LogicException(ErrCode.ContestEventInvalidBatch, 'x-producer-id must not exceed 128 characters');
  }
  return producerId;
}

function emptyResetResponse(
  uk: string,
  stream: { lastEventId: number; streamRevision: number },
  resetReason: string,
): GetClientEventsResult {
  return {
    uk,
    fromEventId: null,
    toEventId: null,
    checkpointEventId: 0,
    latestEventId: stream.lastEventId,
    streamRevision: stream.streamRevision,
    hasMore: false,
    events: [],
    resetRequired: true,
    resetReason,
  };
}
