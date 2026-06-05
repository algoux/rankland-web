import Long from 'long';
import {
  rankland_live_contest_client,
  rankland_live_contest_common,
  rankland_live_contest_producer,
} from '@common/proto/rankland_live_contest';
import {
  getContestEventsResponseToJson,
  compactSettledProgressEvents,
  eventToStoredEventInput,
  parseProducerBatchJson,
  storedEventToClientEvent,
} from '../contest-event-codec';

function event(overrides: Partial<rankland_live_contest_producer.IProducerEvent>) {
  return overrides as rankland_live_contest_producer.IProducerEvent;
}

describe('contest event codec', () => {
  it('rejects batches whose event ids are not strictly increasing', () => {
    const data = {
      streamRevision: 1,
      events: [
        event({
          eventId: 2,
          type: rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS,
          solutionOnProgressData: { solutionId: 10, percentageProgress: 40 },
        }),
        event({
          eventId: 2,
          type: rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS,
          solutionOnProgressData: { solutionId: 10, percentageProgress: 60 },
        }),
      ],
    };

    expect(() => parseProducerBatchJson(data)).toThrow(/strictly increasing/);
  });

  it('rejects events with missing required semantic fields', () => {
    const data = {
      streamRevision: 1,
      events: [
        event({
          eventId: 1,
          type: rankland_live_contest_common.EventType.NEW_SOLUTION,
          newSolutionData: {
            solutionId: 11,
            userId: 'team-a',
            problemAlias: 'A',
          },
        }),
      ],
    };

    expect(() => parseProducerBatchJson(data)).toThrow(/newSolutionData\.time is required/);
  });

  it('rejects invalid progress percentages', () => {
    const data = {
      streamRevision: 1,
      events: [
        event({
          eventId: 1,
          type: rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS,
          solutionOnProgressData: { solutionId: 10, percentageProgress: 101 },
        }),
      ],
    };

    expect(() => parseProducerBatchJson(data)).toThrow(/percentageProgress/);
  });

  it('normalizes all event time values to nanoseconds without losing int64 precision', () => {
    const parsed = parseProducerBatchJson({
      streamRevision: 1,
      events: [
        event({
          eventId: 1,
          type: rankland_live_contest_common.EventType.NEW_SOLUTION,
          newSolutionData: {
            solutionId: 11,
            userId: 'team-a',
            problemAlias: 'A',
            time: {
              value: Long.fromString('9007199254740993'),
              unit: rankland_live_contest_common.TimeUnit.NS,
            },
          },
        }),
      ],
    });

    const stored = eventToStoredEventInput(parsed.events[0], 'producer-a');

    expect(stored.timeNs).toBe('9007199254740993');
    expect(stored.payloadHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('accepts producer batches after generic protobuf middleware conversion', () => {
    const bytes = rankland_live_contest_producer.BatchProducerEvent.encode({
      streamRevision: 1,
      events: [
        event({
          eventId: 1,
          type: rankland_live_contest_common.EventType.NEW_SOLUTION,
          newSolutionData: {
            solutionId: 11,
            userId: 'team-a',
            problemAlias: 'A',
            time: {
              value: Long.fromString('9007199254740993'),
              unit: rankland_live_contest_common.TimeUnit.NS,
            },
          },
        }),
      ],
    }).finish();
    const decoded = rankland_live_contest_producer.BatchProducerEvent.decode(bytes);
    const data = rankland_live_contest_producer.BatchProducerEvent.toObject(decoded, {
      longs: String,
      enums: String,
    });

    const parsed = parseProducerBatchJson(data);

    expect(parsed.streamRevision).toBe(1);
    expect(parsed.events[0].type).toBe(rankland_live_contest_common.EventType.NEW_SOLUTION);
    expect(parsed.events[0].newSolutionData?.time.value).toBe('9007199254740993');
    expect(data).not.toHaveProperty('eventsBase64');
  });

  it('requires a producer stream revision in protobuf and JSON batches', () => {
    const dataWithoutRevision = {
      events: [
        event({
          eventId: 1,
          type: rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS,
          solutionOnProgressData: { solutionId: 10, percentageProgress: 50 },
        }),
      ],
    };

    expect(() => parseProducerBatchJson(dataWithoutRevision)).toThrow(/streamRevision/);
    expect(() => parseProducerBatchJson({ events: [] })).toThrow(/streamRevision/);
  });

  it('accepts direct producer batch JSON with enum names and int64 strings', () => {
    const parsed = parseProducerBatchJson({
      streamRevision: 1,
      events: [
        {
          eventId: 1,
          type: 'NEW_SOLUTION',
          newSolutionData: {
            solutionId: 11,
            userId: 'team-a',
            problemAlias: 'A',
            time: {
              value: '9007199254740993',
              unit: 'NS',
            },
          },
        },
      ],
    });

    const stored = eventToStoredEventInput(parsed.events[0], 'producer-a');

    expect(Object.getPrototypeOf(parsed.events[0])).toBe(Object.prototype);
    expect((parsed as any).streamRevision).toBe(1);
    expect(stored.timeNs).toBe('9007199254740993');
  });

  it('rejects unsafe numeric JSON time values before protobuf conversion can lose precision', () => {
    expect(() => parseProducerBatchJson({
      streamRevision: 1,
      events: [
        {
          eventId: 1,
          type: 'NEW_SOLUTION',
          newSolutionData: {
            solutionId: 11,
            userId: 'team-a',
            problemAlias: 'A',
            time: {
              value: 9007199254740993,
              unit: 'NS',
            },
          },
        },
      ],
    })).toThrow(/safe integer or string/);
  });

  it('rejects the legacy eventsBase64 JSON envelope', () => {
    expect(() => parseProducerBatchJson({ eventsBase64: 'AAAA' })).toThrow(/eventsBase64/);
  });

  it('exposes get-events JSON without eventsBase64', () => {
    const response = {
      uk: 'contest-a',
      fromEventId: 1,
      toEventId: 1,
      checkpointEventId: 1,
      latestEventId: 1,
      streamRevision: 2,
      hasMore: false,
      resetRequired: false,
      events: [
        {
          eventId: 1,
          type: rankland_live_contest_common.EventType.NEW_SOLUTION,
          newSolutionData: {
            solutionId: 11,
            userId: 'team-a',
            problemAlias: 'A',
            time: {
              value: '9007199254740993',
              unit: rankland_live_contest_common.TimeUnit.NS,
            },
          },
        },
      ],
    };

    const json = getContestEventsResponseToJson(response);

    expect(json.events[0].type).toBe('NEW_SOLUTION');
    expect(json.events[0].newSolutionData.time.value).toBe('9007199254740993');
    expect(json).not.toHaveProperty('eventsBase64');
  });

  it('encodes stored times back to client events as nanoseconds', () => {
    const clientEvent = storedEventToClientEvent({
      eventId: 1,
      type: rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE,
      payloadBytes: rankland_live_contest_client.ClientEvent.encode({
        eventId: 1,
        type: rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE,
        solutionOnResultSettleData: {
          solutionId: 12,
          result: rankland_live_contest_common.Result.AC,
          time: { value: Long.fromString('123456789'), unit: rankland_live_contest_common.TimeUnit.NS },
        },
      }).finish(),
    });

    expect(clientEvent.solutionOnResultSettleData?.time?.unit).toBe(rankland_live_contest_common.TimeUnit.NS);
    expect(Long.fromValue(clientEvent.solutionOnResultSettleData?.time?.value).toString()).toBe('123456789');
  });

  it('compacts stale progress events only when a later result event exists for the same solution', () => {
    const progressA = {
      eventId: 1,
      type: rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS,
      solutionOnProgressData: { solutionId: 20, percentageProgress: 40 },
    };
    const progressB = {
      eventId: 2,
      type: rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS,
      solutionOnProgressData: { solutionId: 21, percentageProgress: 50 },
    };
    const settleA = {
      eventId: 3,
      type: rankland_live_contest_common.EventType.SOLUTION_ON_RESULT_SETTLE,
      solutionOnResultSettleData: {
        solutionId: 20,
        result: rankland_live_contest_common.Result.AC,
        time: { value: Long.ZERO, unit: rankland_live_contest_common.TimeUnit.NS },
      },
    };

    const compacted = compactSettledProgressEvents([progressA, progressB, settleA]);

    expect(compacted.map((item) => item.eventId)).toEqual([2, 3]);
  });
});
