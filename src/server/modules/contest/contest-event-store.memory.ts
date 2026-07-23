import {
  ContestEventInsertInput,
  ContestEventAuthorityState,
  ContestEventRangeMemoryEstimate,
  ContestEventRangeRead,
  ContestEventStore,
  ContestEventsSnapshot,
  ContestEventsSnapshotReadRequest,
  ContestEventTransaction,
  ContestReadableEvent,
  ContestStoredEvent,
  ContestStreamState,
} from './contest-event-store';
import { rankland_live_contest_common } from '@common/proto/rankland_live_contest';
import { getFrozenStartNs } from './contest-time';
import LogicException from '@server/exceptions/logic.exception';
import { ErrCode } from '@common/enums/err-code.enum';

export class InMemoryContestEventStore implements ContestEventStore {
  private readonly streams = new Map<string, ContestStreamState>();
  private readonly events = new Map<string, ContestStoredEvent[]>();
  private readonly contestConfigs = new Map<string, any>();

  public addContest(uk: string, options: { contest?: any; contestId?: string } = {}) {
    this.streams.set(uk, {
      contestId: options.contestId ?? uk,
      uk,
      lastEventId: 0,
      streamRevision: 1,
      producerId: null,
    });
    this.events.set(uk, []);
    if (options.contest) {
      this.contestConfigs.set(uk, options.contest);
    }
  }

  public async runInStreamTransaction<T>(
    uk: string,
    runner: (transaction: ContestEventTransaction) => Promise<T>,
  ): Promise<T> {
    const canonicalUk = this.resolveUk(uk);
    const stream = this.getExistingStream(canonicalUk);
    const transaction = new InMemoryContestEventTransaction({ ...stream }, this.events.get(canonicalUk));
    const result = await runner(transaction);
    this.streams.set(canonicalUk, { ...transaction.stream });
    this.events.set(canonicalUk, transaction.events);
    return result;
  }

  public async releaseProducerLock(uk: string): Promise<ContestStreamState> {
    const stream = this.getExistingStream(uk);
    stream.producerId = null;
    return { ...stream };
  }

  public async getStreamState(uk: string): Promise<ContestStreamState> {
    return { ...this.getExistingStream(uk) };
  }

  public async getStreamStates(contestIds: readonly string[]): Promise<ContestStreamState[]> {
    if (contestIds.length === 0) {
      return [];
    }
    const contestIdSet = new Set(contestIds);
    return [...this.streams.values()]
      .filter((stream) => contestIdSet.has(stream.contestId))
      .map((stream) => ({ ...stream }));
  }

  public async readAuthorityByUk(uk: string): Promise<ContestEventAuthorityState> {
    const canonicalUk = this.resolveUk(uk);
    return this.toAuthorityState(canonicalUk, this.getExistingStream(canonicalUk));
  }

  public async readAuthorityByContestIds(contestIds: readonly string[]): Promise<ContestEventAuthorityState[]> {
    if (contestIds.length === 0) {
      return [];
    }
    const contestIdSet = new Set(contestIds);
    return [...this.streams.entries()]
      .filter(([, stream]) => contestIdSet.has(stream.contestId))
      .map(([uk, stream]) => this.toAuthorityState(uk, stream));
  }

  public async readEventRange(request: ContestEventRangeRead): Promise<ContestReadableEvent[]> {
    return this.selectEventRange(request).map((event) => ({
      contestId: event.contestId,
      eventId: event.eventId,
      streamRevision: event.streamRevision,
      type: event.type,
      solutionId: event.solutionId,
      solutionSubmitTimeNs: event.solutionSubmitTimeNs,
      payloadBytes: Buffer.from(event.payloadBytes),
    }));
  }

  public async estimateEventRangeMemory(request: ContestEventRangeRead): Promise<ContestEventRangeMemoryEstimate> {
    const rows = this.selectEventRange(request);
    return {
      rowCount: rows.length,
      payloadBytes: rows.reduce((total, event) => total + event.payloadBytes.byteLength, 0),
      solutionSubmitTimeBytes: rows.reduce(
        (total, event) => total + Buffer.byteLength(event.solutionSubmitTimeNs ?? '', 'utf8'),
        0,
      ),
    };
  }

  private selectEventRange(request: ContestEventRangeRead): ContestStoredEvent[] {
    const streamEntry = [...this.streams.entries()].find(([, stream]) => stream.contestId === request.contestId);
    if (!streamEntry || request.afterEventId >= request.throughEventId || request.limit < 1) {
      return [];
    }
    const [uk] = streamEntry;
    return (this.events.get(uk) || [])
      .filter(
        (event) =>
          event.streamRevision === request.streamRevision &&
          event.eventId > request.afterEventId &&
          event.eventId <= request.throughEventId,
      )
      .sort((a, b) => a.eventId - b.eventId)
      .slice(0, request.limit);
  }

  public async readEventsSnapshot(request: ContestEventsSnapshotReadRequest): Promise<ContestEventsSnapshot> {
    const canonicalUk = this.resolveUk(request.uk);
    const stream = this.getExistingStream(canonicalUk);
    const snapshotLastEventId =
      request.throughEventId === undefined
        ? stream.lastEventId
        : Math.min(stream.lastEventId, Math.max(0, Math.trunc(request.throughEventId)));
    const currentRevisionEvents = (this.events.get(canonicalUk) || [])
      .filter((event) => event.streamRevision === stream.streamRevision)
      .sort((a, b) => a.eventId - b.eventId);
    const shouldReadEvents =
      request.requestStreamRevision === stream.streamRevision && request.afterEventId <= snapshotLastEventId;
    const page = (shouldReadEvents ? currentRevisionEvents : [])
      .filter((event) => event.eventId > request.afterEventId && event.eventId <= snapshotLastEventId)
      .slice(0, request.limit)
      .map((event) => ({ ...event, payloadBytes: Buffer.from(event.payloadBytes) }));
    return {
      stream: { ...stream, lastEventId: snapshotLastEventId },
      events: page,
      settledEventIdsBySolutionId:
        shouldReadEvents && request.compactProgress
          ? collectSettledEventIdsBySolutionId(
              currentRevisionEvents.filter((event) => event.eventId <= snapshotLastEventId),
              request.afterEventId,
            )
          : new Map(),
      frozenStartNs: getFrozenStartNs(this.contestConfigs.get(canonicalUk)),
    };
  }

  private getExistingStream(uk: string): ContestStreamState {
    const stream = this.streams.get(this.resolveUk(uk));
    if (!stream) {
      throw new LogicException(ErrCode.ContestNotFound, `contest ${uk} not found`);
    }
    return stream;
  }

  private resolveUk(uk: string): string {
    if (this.streams.has(uk)) {
      return uk;
    }
    const normalizedUk = uk.toLowerCase();
    const canonicalUk = [...this.streams.keys()].find((candidate) => candidate.toLowerCase() === normalizedUk);
    return canonicalUk ?? uk;
  }

  private toAuthorityState(uk: string, stream: ContestStreamState): ContestEventAuthorityState {
    const frozenStartNs = getFrozenStartNs(this.contestConfigs.get(uk));
    return {
      contestId: stream.contestId,
      canonicalUk: stream.uk,
      streamRevision: stream.streamRevision,
      lastEventId: stream.lastEventId,
      frozenStartNs,
      visibilityFingerprint: `frozenStartNs=${frozenStartNs ?? 'null'}`,
    };
  }
}

function collectSettledEventIdsBySolutionId(events: ContestStoredEvent[], afterEventId: number): Map<number, number> {
  const result = new Map<number, number>();
  for (const event of events) {
    if (event.eventId <= afterEventId || event.solutionId === undefined || event.solutionId === null) {
      continue;
    }
    if (
      event.type !== rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE &&
      event.type !== rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_CHANGE
    ) {
      continue;
    }
    result.set(event.solutionId, Math.max(result.get(event.solutionId) || 0, event.eventId));
  }
  return result;
}

class InMemoryContestEventTransaction implements ContestEventTransaction {
  public readonly events: ContestStoredEvent[];

  public constructor(public readonly stream: ContestStreamState, events: ContestStoredEvent[] = []) {
    this.events = events.map((event) => ({ ...event, payloadBytes: Buffer.from(event.payloadBytes) }));
  }

  public async findEvents(eventIds: number[]): Promise<ContestStoredEvent[]> {
    const eventIdsSet = new Set(eventIds);
    return this.events
      .filter((item) => item.streamRevision === this.stream.streamRevision && eventIdsSet.has(item.eventId))
      .map((event) => ({ ...event, payloadBytes: Buffer.from(event.payloadBytes) }));
  }

  public async findNewSolutionSubmitTimes(solutionIds: number[]): Promise<Map<number, string>> {
    const solutionIdsSet = new Set(solutionIds);
    const result = new Map<number, string>();
    for (const event of this.events) {
      if (
        event.type !== rankland_live_contest_common.EventType.NEW_SOLUTION ||
        event.streamRevision !== this.stream.streamRevision ||
        event.solutionId === undefined ||
        event.solutionId === null ||
        !solutionIdsSet.has(event.solutionId)
      ) {
        continue;
      }
      const submitTimeNs = event.solutionSubmitTimeNs || event.timeNs;
      if (submitTimeNs) {
        result.set(event.solutionId, submitTimeNs);
      }
    }
    return result;
  }

  public async insertEvents(inputs: ContestEventInsertInput[]): Promise<void> {
    this.events.push(
      ...inputs.map((input) => ({
        ...input,
        contestId: this.stream.contestId,
        streamRevision: this.stream.streamRevision,
        payloadBytes: Buffer.from(input.payloadBytes),
      })),
    );
  }

  public async setProducerLock(producerId: string): Promise<void> {
    this.stream.producerId = producerId;
  }

  public async advanceLastEventId(lastEventId: number): Promise<void> {
    this.stream.lastEventId = lastEventId;
  }
}
