import { describe, expect, it } from 'vitest';
import {
  rankland_live_contest_client as serverClientProto,
  rankland_live_contest_common as commonProto,
} from '@common/proto/rankland_live_contest';
import { decodeLiveContestEventPage } from './live-contest-protobuf';

function encodePage() {
  return serverClientProto.GetContestEventsResponse.encode(
    serverClientProto.GetContestEventsResponse.fromObject({
      uk: 'summer-2026',
      checkpointEventId: 5,
      latestEventId: 5,
      streamRevision: 2,
      hasMore: false,
      resetRequired: false,
      events: [
        {
          eventId: 1,
          type: commonProto.EventType.NEW_SOLUTION,
          newSolutionData: {
            solutionId: 7,
            userId: 'alice',
            problemAlias: 'A',
            time: {
              value: '9223372036854775807',
              unit: commonProto.TimeUnit.NS,
            },
          },
        },
        {
          eventId: 2,
          type: commonProto.EventType.SOLUTION_ON_PROGRESS,
          solutionOnProgressData: {
            solutionId: 7,
            percentageProgress: 50,
            time: {
              value: 90,
              unit: commonProto.TimeUnit.S,
            },
          },
        },
        {
          eventId: 3,
          type: commonProto.EventType.SOLUTION_ON_RESULT_SETTLE,
          solutionOnResultSettleData: {
            solutionId: 7,
            result: commonProto.Result.AC,
            time: {
              value: 91_250,
              unit: commonProto.TimeUnit.MS,
            },
          },
        },
        {
          eventId: 4,
          type: commonProto.EventType.SOLUTION_ON_RESULT_CHANGE,
          solutionOnResultChangeData: {
            solutionId: 7,
            previousResult: commonProto.Result.AC,
            result: commonProto.Result.WA,
            time: {
              value: 92_000_000,
              unit: commonProto.TimeUnit.US,
            },
          },
        },
        {
          eventId: 5,
          type: commonProto.EventType.CONTEST_CONFIG_CHANGE,
          contestConfigChangeData: {
            changedFields: ['problems', 'sorter'],
          },
        },
      ],
    }),
  ).finish();
}

function encodeSingleEvent(event: Record<string, unknown>) {
  return serverClientProto.GetContestEventsResponse.encode(
    serverClientProto.GetContestEventsResponse.fromObject({
      uk: 'summer-2026',
      checkpointEventId: 1,
      latestEventId: 1,
      streamRevision: 1,
      events: [event],
    }),
  ).finish();
}

describe('decodeLiveContestEventPage', () => {
  it('decodes generated protobuf types into transport-independent live events', () => {
    const page = decodeLiveContestEventPage(encodePage());

    expect(page).toMatchObject({
      uk: 'summer-2026',
      fromEventId: null,
      toEventId: null,
      checkpointEventId: 5,
      latestEventId: 5,
      streamRevision: 2,
      hasMore: false,
      resetRequired: false,
    });
    expect(page.events).toEqual([
      {
        eventId: 1,
        type: 'NEW',
        solutionId: 7,
        userId: 'alice',
        problemAlias: 'A',
        time: [9_223_372_036.854776, 's'],
        timeNs: '9223372036854775807',
      },
      {
        eventId: 2,
        type: 'PROGRESS',
        solutionId: 7,
        percentageProgress: 50,
        time: [90, 's'],
      },
      {
        eventId: 3,
        type: 'SETTLE',
        solutionId: 7,
        result: 'AC',
        time: [91.25, 's'],
      },
      {
        eventId: 4,
        type: 'CHANGE',
        solutionId: 7,
        previousResult: 'AC',
        result: 'WA',
        time: [92, 's'],
      },
      {
        eventId: 5,
        type: 'CONFIG_CHANGE',
        changedFields: ['problems', 'sorter'],
      },
    ]);
  });

  it('rejects a truncated protobuf response', () => {
    const bytes = encodePage();
    expect(() => decodeLiveContestEventPage(bytes.subarray(0, bytes.length - 1))).toThrow();
  });

  it('rejects invalid ids and progress values even when protobuf defaults decode cleanly', () => {
    const invalidEventId = encodeSingleEvent({
      eventId: 0,
      type: commonProto.EventType.CONTEST_CONFIG_CHANGE,
      contestConfigChangeData: {},
    });
    const invalidProgress = encodeSingleEvent({
      eventId: 1,
      type: commonProto.EventType.SOLUTION_ON_PROGRESS,
      solutionOnProgressData: {
        solutionId: 7,
        percentageProgress: 101,
      },
    });

    expect(() => decodeLiveContestEventPage(invalidEventId)).toThrow('eventId');
    expect(() => decodeLiveContestEventPage(invalidProgress)).toThrow('percentageProgress');
  });

  it('rejects negative and unsafe event times after unit conversion', () => {
    const negativeTime = encodeSingleEvent({
      eventId: 1,
      type: commonProto.EventType.NEW_SOLUTION,
      newSolutionData: {
        solutionId: 7,
        userId: 'alice',
        problemAlias: 'A',
        time: {
          value: '-1',
          unit: commonProto.TimeUnit.NS,
        },
      },
    });
    const unsafeSeconds = encodeSingleEvent({
      eventId: 1,
      type: commonProto.EventType.NEW_SOLUTION,
      newSolutionData: {
        solutionId: 7,
        userId: 'alice',
        problemAlias: 'A',
        time: {
          value: '9007199254740992',
          unit: commonProto.TimeUnit.S,
        },
      },
    });
    const unsafeFractionalSeconds = encodeSingleEvent({
      eventId: 1,
      type: commonProto.EventType.NEW_SOLUTION,
      newSolutionData: {
        solutionId: 7,
        userId: 'alice',
        problemAlias: 'A',
        time: {
          value: '9007199254740991001',
          unit: commonProto.TimeUnit.MS,
        },
      },
    });

    expect(() => decodeLiveContestEventPage(negativeTime)).toThrow('cannot be negative');
    expect(() => decodeLiveContestEventPage(unsafeSeconds)).toThrow('safe SRK range');
    expect(() => decodeLiveContestEventPage(unsafeFractionalSeconds)).toThrow('safe SRK range');
  });
});
