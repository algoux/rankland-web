import {
  rankland_live_contest_common,
  rankland_live_contest_producer,
} from '@common/proto/rankland_live_contest';
import { InMemoryContestEventStore } from '../contest-event-store.memory';
import ContestEventStreamService from '../contest-event-stream.service';
import {
  ContestEventInsertInput,
  ContestEventStore,
  ContestEventTransaction,
  ContestStoredEvent,
  ContestStreamState,
} from '../contest-event-store';
import { parseProducerBatchJson } from '../contest-event-codec';
import { ContestClientEventBO } from '../contest-event-bo';

function progress(eventId: number, solutionId = 1, percentageProgress = 50) {
  return {
    eventId,
    type: rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS,
    solutionOnProgressData: { solutionId, percentageProgress },
  };
}

function newSolution(eventId: number, solutionId = 1, timeValue = 0) {
  return {
    eventId,
    type: rankland_live_contest_common.EventType.NEW_SOLUTION,
    newSolutionData: {
      solutionId,
      userId: `user-${solutionId}`,
      problemAlias: 'A',
      time: { value: timeValue, unit: rankland_live_contest_common.TimeUnit.S },
    },
  };
}

function settle(eventId: number, solutionId = 1, timeValue = 0) {
  return {
    eventId,
    type: rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE,
    solutionOnResultSettleData: {
      solutionId,
      result: rankland_live_contest_common.Result.AC,
      time: { value: timeValue, unit: rankland_live_contest_common.TimeUnit.S },
    },
  };
}

function batch(events: rankland_live_contest_producer.IProducerEvent[], streamRevision = 1) {
  return parseProducerBatchJson({ streamRevision, events });
}

function clientEventIds(events: ContestClientEventBO[]): number[] {
  return events.map((event) => event.eventId);
}

describe('contest event stream service', () => {
  it('lets the first producer claim the stream lock and rejects another producer', async () => {
    const store = new InMemoryContestEventStore();
    store.addContest('contest-a');
    const service = new ContestEventStreamService(store);

    await service.appendProducerEvents({
      uk: 'contest-a',
      producerId: 'producer-a',
      batch: batch([newSolution(1), progress(2)]),
    });

    await expect(
      service.appendProducerEvents({ uk: 'contest-a', producerId: 'producer-b', batch: batch([progress(3)]) }),
    ).rejects.toThrow(/locked by another producer/);
  });

  it('rejects event id gaps against the persisted high-water mark', async () => {
    const store = new InMemoryContestEventStore();
    store.addContest('contest-a');
    const service = new ContestEventStreamService(store);

    await service.appendProducerEvents({ uk: 'contest-a', producerId: 'producer-a', batch: batch([newSolution(1)]) });

    await expect(
      service.appendProducerEvents({ uk: 'contest-a', producerId: 'producer-a', batch: batch([progress(3)]) }),
    ).rejects.toThrow(/expected event id 2/);
  });

  it('accepts duplicate retries with the same payload without advancing twice', async () => {
    const store = new InMemoryContestEventStore();
    store.addContest('contest-a');
    const service = new ContestEventStreamService(store);
    const producerBatch = batch([newSolution(1), progress(2)]);

    const first = await service.appendProducerEvents({ uk: 'contest-a', producerId: 'producer-a', batch: producerBatch });
    const retry = await service.appendProducerEvents({ uk: 'contest-a', producerId: 'producer-a', batch: producerBatch });

    expect(first.acceptedEventIds).toEqual([1, 2]);
    expect(retry.acceptedEventIds).toEqual([]);
    expect(retry.duplicateEventIds).toEqual([1, 2]);
    expect(retry.lastEventId).toBe(2);
  });

  it('checks existing batch events once and bulk-inserts only new events', async () => {
    const store = new InstrumentedContestEventStore('contest-a');
    const service = new ContestEventStreamService(store);

    await service.appendProducerEvents({ uk: 'contest-a', producerId: 'producer-a', batch: batch([newSolution(1)]) });
    const result = await service.appendProducerEvents({
      uk: 'contest-a',
      producerId: 'producer-a',
      batch: batch([newSolution(1), progress(2), progress(3)]),
    });

    expect(result.duplicateEventIds).toEqual([1]);
    expect(result.acceptedEventIds).toEqual([2, 3]);
    expect(store.transaction.findEventsCalls).toBe(1);
    expect(store.transaction.insertEventsCalls).toBe(1);
    expect(store.transaction.findEventCalls).toBe(0);
    expect(store.transaction.insertEventCalls).toBe(0);
  });

  it('rejects duplicate retries with a different payload hash', async () => {
    const store = new InMemoryContestEventStore();
    store.addContest('contest-a');
    const service = new ContestEventStreamService(store);

    await service.appendProducerEvents({ uk: 'contest-a', producerId: 'producer-a', batch: batch([newSolution(1), progress(2, 1, 40)]) });

    await expect(
      service.appendProducerEvents({ uk: 'contest-a', producerId: 'producer-a', batch: batch([progress(2, 1, 80)]) }),
    ).rejects.toThrow(/already exists with different payload/);
  });

  it('allows an administrator to release the producer lock', async () => {
    const store = new InMemoryContestEventStore();
    store.addContest('contest-a');
    const service = new ContestEventStreamService(store);

    await service.appendProducerEvents({ uk: 'contest-a', producerId: 'producer-a', batch: batch([newSolution(1)]) });
    await service.releaseProducerLock('contest-a');
    const result = await service.appendProducerEvents({ uk: 'contest-a', producerId: 'producer-b', batch: batch([progress(2)]) });

    expect(result.lastEventId).toBe(2);
  });

  it('compacts stale progress events even when the settling event is outside the current page', async () => {
    const store = new InMemoryContestEventStore();
    store.addContest('contest-a');
    const service = new ContestEventStreamService(store);

    await service.appendProducerEvents({
      uk: 'contest-a',
      producerId: 'producer-a',
      batch: batch([newSolution(1, 10), newSolution(2, 11), progress(3, 10, 20), progress(4, 11, 30), settle(5, 10)]),
    });

    const page = await service.getClientEvents({ uk: 'contest-a', afterEventId: 2, limit: 2, streamRevision: 1 });

    expect(page.uk).toBe('contest-a');
    expect(clientEventIds(page.events)).toEqual([4]);
    expect(page.checkpointEventId).toBe(4);
    expect(page.hasMore).toBe(true);
  });

  it('filters non-new events for frozen submissions even when compaction is disabled', async () => {
    const store = new InMemoryContestEventStore();
    store.addContest('contest-a', {
      contest: { duration: [5, 'h'], frozenDuration: [1, 'h'] },
    });
    const service = new ContestEventStreamService(store);

    await service.appendProducerEvents({
      uk: 'contest-a',
      producerId: 'producer-a',
      batch: batch([newSolution(1, 20, 4 * 60 * 60), progress(2, 20), settle(3, 20)]),
    });

    const page = await service.getClientEvents({
      uk: 'contest-a',
      afterEventId: 0,
      limit: 10,
      streamRevision: 1,
      compactProgress: false,
    });

    expect(clientEventIds(page.events)).toEqual([1]);
    expect(page.checkpointEventId).toBe(3);
  });

  it('keeps non-frozen solution events even if a result event time is in the frozen period', async () => {
    const store = new InMemoryContestEventStore();
    store.addContest('contest-a', {
      contest: { duration: [5, 'h'], frozenDuration: [1, 'h'] },
    });
    const service = new ContestEventStreamService(store);

    await service.appendProducerEvents({
      uk: 'contest-a',
      producerId: 'producer-a',
      batch: batch([newSolution(1, 30, 60 * 60), progress(2, 30), settle(3, 30, 4 * 60 * 60)]),
    });

    const page = await service.getClientEvents({
      uk: 'contest-a',
      afterEventId: 0,
      limit: 10,
      streamRevision: 1,
      compactProgress: false,
    });

    expect(clientEventIds(page.events)).toEqual([1, 2, 3]);
  });

  it('does not filter frozen-looking submissions when frozenDuration is missing or zero', async () => {
    const store = new InMemoryContestEventStore();
    store.addContest('contest-a', {
      contest: { duration: [5, 'h'], frozenDuration: [0, 's'] },
    });
    const service = new ContestEventStreamService(store);

    await service.appendProducerEvents({
      uk: 'contest-a',
      producerId: 'producer-a',
      batch: batch([newSolution(1, 40, 6 * 60 * 60), progress(2, 40), settle(3, 40)]),
    });

    const page = await service.getClientEvents({
      uk: 'contest-a',
      afterEventId: 0,
      limit: 10,
      streamRevision: 1,
      compactProgress: false,
    });

    expect(clientEventIds(page.events)).toEqual([1, 2, 3]);
  });

  it('rejects non-new events when the corresponding new solution is unknown', async () => {
    const store = new InMemoryContestEventStore();
    store.addContest('contest-a');
    const service = new ContestEventStreamService(store);

    await expect(
      service.appendProducerEvents({ uk: 'contest-a', producerId: 'producer-a', batch: batch([progress(1, 50)]) }),
    ).rejects.toThrow(/new solution/);
  });

  it('denormalizes submit time onto non-new events created in the same batch', async () => {
    const store = new InstrumentedContestEventStore('contest-a');
    const service = new ContestEventStreamService(store);

    await service.appendProducerEvents({
      uk: 'contest-a',
      producerId: 'producer-a',
      batch: batch([newSolution(1, 60, 123), progress(2, 60)]),
    });

    expect(store.transaction.events.map((event) => event.solutionSubmitTimeNs)).toEqual([
      '123000000000',
      '123000000000',
    ]);
  });

  it('returns a reset envelope when the client stream revision is stale', async () => {
    const store = new InMemoryContestEventStore();
    store.addContest('contest-a');
    const service = new ContestEventStreamService(store);

    await service.appendProducerEvents({ uk: 'contest-a', producerId: 'producer-a', batch: batch([newSolution(1)]) });
    await store.runInStreamTransaction('contest-a', async (transaction) => {
      transaction.stream.streamRevision = 2;
      await transaction.advanceLastEventId(0);
    });

    const page = await service.getClientEvents({ uk: 'contest-a', afterEventId: 1, limit: 10, streamRevision: 1 });

    expect(page.uk).toBe('contest-a');
    expect(page.resetRequired).toBe(true);
    expect(page.streamRevision).toBe(2);
    expect(page.checkpointEventId).toBe(0);
    expect(clientEventIds(page.events)).toEqual([]);
  });

  it('rejects append batches whose stream revision does not match the current stream', async () => {
    const store = new InMemoryContestEventStore();
    store.addContest('contest-a');
    const service = new ContestEventStreamService(store);

    await expect(
      service.appendProducerEvents({
        uk: 'contest-a',
        producerId: 'producer-a',
        batch: batch([newSolution(1)], 2),
      }),
    ).rejects.toMatchObject({ code: 'STREAM_REVISION_MISMATCH' });

    await expect(service.getStreamState('contest-a')).resolves.toMatchObject({
      lastEventId: 0,
      streamRevision: 1,
      producerId: null,
    });
  });

  it('requires a client stream revision for catch-up', async () => {
    const store = new InMemoryContestEventStore();
    store.addContest('contest-a');
    const service = new ContestEventStreamService(store);

    await expect(
      service.getClientEvents({ uk: 'contest-a', afterEventId: 0, limit: 10 } as any),
    ).rejects.toThrow(/streamRevision is required/);
  });

  it('retains old revision events while allowing a reset stream to reuse event ids', async () => {
    const store = new InMemoryContestEventStore();
    store.addContest('contest-a');
    const service = new ContestEventStreamService(store);

    await service.appendProducerEvents({
      uk: 'contest-a',
      producerId: 'producer-a',
      batch: batch([newSolution(1, 1)]),
    });
    await store.runInStreamTransaction('contest-a', async (transaction) => {
      transaction.stream.lastEventId = 0;
      transaction.stream.streamRevision = 2;
      transaction.stream.producerId = null;
      await transaction.advanceLastEventId(0);
    });

    const appendResult = await service.appendProducerEvents({
      uk: 'contest-a',
      producerId: 'producer-b',
      batch: batch([newSolution(1, 2)], 2),
    });
    const page = await service.getClientEvents({ uk: 'contest-a', afterEventId: 0, limit: 10, streamRevision: 2 });

    expect(appendResult.acceptedEventIds).toEqual([1]);
    expect(clientEventIds(page.events)).toEqual([1]);
    expect(page.streamRevision).toBe(2);
    expect((store as any).events.get('contest-a').map((event: ContestStoredEvent) => event.streamRevision)).toEqual([
      1,
      2,
    ]);
  });

  it('rejects blank producer ids before claiming the stream lock', async () => {
    const store = new InMemoryContestEventStore();
    store.addContest('contest-a');
    const service = new ContestEventStreamService(store);

    await expect(
      service.appendProducerEvents({ uk: 'contest-a', producerId: '   ', batch: batch([progress(1)]) }),
    ).rejects.toThrow(/x-producer-id is required/);
  });
});

class InstrumentedContestEventStore implements ContestEventStore {
  public readonly transaction: InstrumentedContestEventTransaction;

  public constructor(uk: string) {
    this.transaction = new InstrumentedContestEventTransaction({
      contestId: uk,
      uk,
      lastEventId: 0,
      streamRevision: 1,
      producerId: null,
    });
  }

  public async runInStreamTransaction<T>(
    _uk: string,
    runner: (transaction: ContestEventTransaction) => Promise<T>,
  ): Promise<T> {
    this.transaction.resetCounters();
    return runner(this.transaction);
  }

  public async releaseProducerLock(): Promise<ContestStreamState> {
    this.transaction.stream.producerId = null;
    return { ...this.transaction.stream };
  }

  public async getStreamState(): Promise<ContestStreamState> {
    return { ...this.transaction.stream };
  }

  public async readEventsSnapshot(): Promise<never> {
    throw new Error('not implemented');
  }
}

class InstrumentedContestEventTransaction implements ContestEventTransaction {
  public readonly events: ContestStoredEvent[] = [];
  public findEventCalls = 0;
  public insertEventCalls = 0;
  public findEventsCalls = 0;
  public insertEventsCalls = 0;
  public findNewSolutionSubmitTimesCalls = 0;

  public constructor(public readonly stream: ContestStreamState) {}

  public resetCounters(): void {
    this.findEventCalls = 0;
    this.insertEventCalls = 0;
    this.findEventsCalls = 0;
    this.insertEventsCalls = 0;
    this.findNewSolutionSubmitTimesCalls = 0;
  }

  public async findEvent(eventId: number): Promise<ContestStoredEvent | null> {
    this.findEventCalls += 1;
    const event = this.events.find((item) => item.eventId === eventId);
    return event ? { ...event, payloadBytes: Buffer.from(event.payloadBytes) } : null;
  }

  public async findEvents(eventIds: number[]): Promise<ContestStoredEvent[]> {
    this.findEventsCalls += 1;
    return this.events
      .filter((item) => item.streamRevision === this.stream.streamRevision && eventIds.includes(item.eventId))
      .map((event) => ({ ...event, payloadBytes: Buffer.from(event.payloadBytes) }));
  }

  public async findNewSolutionSubmitTimes(solutionIds: number[]): Promise<Map<number, string>> {
    this.findNewSolutionSubmitTimesCalls += 1;
    const solutionIdsSet = new Set(solutionIds);
    const result = new Map<number, string>();
    for (const event of this.events) {
      if (
        event.type === rankland_live_contest_common.EventType.NEW_SOLUTION &&
        event.streamRevision === this.stream.streamRevision &&
        event.solutionId !== undefined &&
        event.solutionId !== null &&
        solutionIdsSet.has(event.solutionId)
      ) {
        const submitTimeNs = event.solutionSubmitTimeNs || event.timeNs;
        if (submitTimeNs) {
          result.set(event.solutionId, submitTimeNs);
        }
      }
    }
    return result;
  }

  public async insertEvent(input: ContestEventInsertInput): Promise<void> {
    this.insertEventCalls += 1;
    await this.insertEvents([input]);
  }

  public async insertEvents(inputs: ContestEventInsertInput[]): Promise<void> {
    this.insertEventsCalls += 1;
    for (const input of inputs) {
      this.events.push({
        ...input,
        contestId: this.stream.contestId,
        streamRevision: this.stream.streamRevision,
        payloadBytes: Buffer.from(input.payloadBytes),
      });
    }
  }

  public async setProducerLock(producerId: string): Promise<void> {
    this.stream.producerId = producerId;
  }

  public async advanceLastEventId(lastEventId: number): Promise<void> {
    this.stream.lastEventId = lastEventId;
  }
}
