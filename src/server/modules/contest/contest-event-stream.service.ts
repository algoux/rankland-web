import { Inject, Provide } from 'bwcx-core';
import {
  compactSettledProgressEvents,
  eventToStoredEventInput,
  StoredEventInput,
  storedEventToClientEvent,
} from './contest-event-codec';
import { ContestEventStore, ContestStoredEvent } from './contest-event-store';
import { ContestEventError, ContestEventErrorCode } from './contest-event-errors';
import TypeOrmContestEventStore from './contest-event-store.typeorm';
import { rankland_live_contest_common } from '@common/proto/rankland_live_contest';
import Long from 'long';
import { ContestClientEventBO, ContestEventsResponseBO, ContestProducerBatchBO } from './contest-event-bo';

export interface AppendProducerEventsInput {
  uk: string;
  producerId: unknown;
  batch: ContestProducerBatchBO;
}

export interface AppendProducerEventsResult {
  acceptedEventIds: number[];
  duplicateEventIds: number[];
  lastEventId: number;
  expectedNextEventId: number;
  streamRevision: number;
}

export interface GetClientEventsInput {
  uk: string;
  afterEventId: number;
  limit: number;
  streamRevision?: number;
  compactProgress?: boolean;
}

export interface GetClientEventsResult extends ContestEventsResponseBO {}

@Provide()
export default class ContestEventStreamService {
  public constructor(@Inject(TypeOrmContestEventStore) private readonly store: ContestEventStore) {}

  public async appendProducerEvents(input: AppendProducerEventsInput): Promise<AppendProducerEventsResult> {
    const producerId = normalizeProducerId(input.producerId);
    const storedEvents = input.batch.events.map((event) => eventToStoredEventInput(event, producerId));
    const eventIds = storedEvents.map((event) => event.eventId);

    return this.store.runInStreamTransaction(input.uk, async (transaction) => {
      const { stream } = transaction;
      if (!stream.producerId) {
        await transaction.setProducerLock(producerId);
        stream.producerId = producerId;
      } else if (stream.producerId !== producerId) {
        throw new ContestEventError(
          ContestEventErrorCode.ProducerLocked,
          `contest ${input.uk} is locked by another producer`,
          { producerId: stream.producerId },
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
            throw new ContestEventError(
              ContestEventErrorCode.EventIdConflict,
              `event id ${stored.eventId} already exists with different payload`,
              { conflictEventId: stored.eventId },
            );
          }
          duplicateEventIds.push(stored.eventId);
          cursor = Math.max(cursor, stored.eventId);
          continue;
        }

        fillSolutionSubmitTime(stored, batchSubmitTimesByEventId, persistedSubmitTimesBySolutionId);

        const expectedEventId = cursor + 1;
        if (stored.eventId !== expectedEventId) {
          throw new ContestEventError(
            ContestEventErrorCode.EventIdGap,
            `expected event id ${expectedEventId} but received ${stored.eventId}`,
            { expectedEventId, receivedEventId: stored.eventId },
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
        acceptedEventIds,
        duplicateEventIds,
        lastEventId: cursor,
        expectedNextEventId: cursor + 1,
        streamRevision: stream.streamRevision,
      };
    });
  }

  public async getClientEvents(input: GetClientEventsInput): Promise<GetClientEventsResult> {
    const limit = Math.max(1, Math.min(input.limit || 1000, 5000));
    const snapshot = await this.store.readEventsSnapshot(input.uk, input.afterEventId, limit + 1);
    const { stream } = snapshot;
    if (input.streamRevision !== undefined && input.streamRevision !== stream.streamRevision) {
      return emptyResetResponse(input.uk, stream, 'stream revision changed');
    }
    if (input.afterEventId > stream.lastEventId) {
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
    const checkpointEventId = page.length ? page[page.length - 1].eventId : input.afterEventId;

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

  public async releaseProducerLock(uk: string) {
    return this.store.releaseProducerLock(uk);
  }

  public async getStreamState(uk: string) {
    return this.store.getStreamState(uk);
  }
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
  const submitTimeNs = batchSubmitTimesByEventId.get(event.eventId) || persistedSubmitTimesBySolutionId.get(event.solutionId);
  if (!submitTimeNs) {
    throw new ContestEventError(
      ContestEventErrorCode.InvalidEventBatch,
      `new solution for solution ${event.solutionId} is required before non-new events`,
      { solutionId: event.solutionId },
    );
  }
  event.solutionSubmitTimeNs = submitTimeNs;
}

function filterFrozenNonNewEvents(events: ContestStoredEvent[], frozenStartNs?: string | null): ContestStoredEvent[] {
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

function isNewSolutionEvent(event: StoredEventInput | ContestStoredEvent): boolean {
  return event.type === rankland_live_contest_common.EventType.NEW_SOLUTION;
}

function needsSolutionSubmitTime(
  event: StoredEventInput | ContestStoredEvent,
): event is (StoredEventInput | ContestStoredEvent) & { solutionId: number } {
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
    throw new ContestEventError(ContestEventErrorCode.InvalidEventBatch, 'x-producer-id must be a single header');
  }
  if (typeof value !== 'string') {
    throw new ContestEventError(ContestEventErrorCode.InvalidEventBatch, 'x-producer-id is required');
  }
  const producerId = value.trim();
  if (!producerId) {
    throw new ContestEventError(ContestEventErrorCode.InvalidEventBatch, 'x-producer-id is required');
  }
  if (producerId.length > 128) {
    throw new ContestEventError(
      ContestEventErrorCode.InvalidEventBatch,
      'x-producer-id must not exceed 128 characters',
    );
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
