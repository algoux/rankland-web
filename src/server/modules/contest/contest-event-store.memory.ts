import {
  ContestEventInsertInput,
  ContestEventStore,
  ContestEventsSnapshot,
  ContestEventTransaction,
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

  public addContest(uk: string, options: { contest?: any } = {}) {
    this.streams.set(uk, {
      contestId: uk,
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
    const stream = this.getExistingStream(uk);
    const transaction = new InMemoryContestEventTransaction(stream, this.events.get(uk));
    const result = await runner(transaction);
    this.streams.set(uk, { ...transaction.stream });
    this.events.set(uk, transaction.events);
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

  public async readEventsSnapshot(uk: string, afterEventId: number, limit: number): Promise<ContestEventsSnapshot> {
    const stream = this.getExistingStream(uk);
    const currentRevisionEvents = (this.events.get(uk) || [])
      .filter((event) => event.streamRevision === stream.streamRevision)
      .sort((a, b) => a.eventId - b.eventId);
    const page = currentRevisionEvents
      .filter((event) => event.eventId > afterEventId)
      .slice(0, limit)
      .map((event) => ({ ...event, payloadBytes: Buffer.from(event.payloadBytes) }));
    return {
      stream: { ...stream },
      events: page,
      settledEventIdsBySolutionId: collectSettledEventIdsBySolutionId(currentRevisionEvents, afterEventId),
      frozenStartNs: getFrozenStartNs(this.contestConfigs.get(uk)),
    };
  }

  private getExistingStream(uk: string): ContestStreamState {
    const stream = this.streams.get(uk);
    if (!stream) {
      throw new LogicException(ErrCode.ContestNotFound, `contest ${uk} not found`);
    }
    return stream;
  }
}

function collectSettledEventIdsBySolutionId(
  events: ContestStoredEvent[],
  afterEventId: number,
): Map<number, number> {
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

  public constructor(
    public readonly stream: ContestStreamState,
    events: ContestStoredEvent[] = [],
  ) {
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
