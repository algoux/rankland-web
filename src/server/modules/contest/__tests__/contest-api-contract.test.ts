import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ApiClient } from '@common/api/api-client';
import {
  rankland_live_contest_common,
  rankland_live_contest_producer,
} from '@common/proto/rankland_live_contest';
import {
  AppendContestEventsReqDTO,
  GetPublicContestEventsReqDTO,
  MAX_APPEND_CONTEST_EVENTS_BATCH_SIZE,
} from '@common/modules/contest/contest.dto';

function createProgressEvents(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    eventId: index + 1,
    type: rankland_live_contest_common.EventType.SOLUTION_ON_PROGRESS,
    solutionOnProgressData: {
      solutionId: index + 1,
      percentageProgress: 50,
    },
  }));
}

async function validationProperties(instance: object): Promise<string[]> {
  const errors = await validate(instance as any);
  return errors.map((error) => error.property);
}

describe('contest API contract', () => {
  it('keeps the created contest Snowflake id as a decimal string', async () => {
    const request = vi.fn(async () => ({
      success: true,
      code: 0,
      data: { _id: '70346717215600640' },
    }));
    const responseParser = {
      pat: vi.fn((_dto, resp) => resp.data),
    };
    const client = new ApiClient({ request }, responseParser as any);

    const result = await client.createContest({
      uk: 'contest-a',
      name: 'Contest A',
      contest: { title: 'Contest A', startAt: '2026-01-01T00:00:00Z', duration: [5, 'h'] },
      problems: [],
      users: [],
      markers: [],
      series: [],
    });

    expect(result._id).toBe('70346717215600640');
    expect(typeof result._id).toBe('string');
  });

  it('requires streamRevision on append requests', async () => {
    const missing = plainToInstance(AppendContestEventsReqDTO, {
      uk: 'contest-a',
      events: [{ eventId: 1 }],
    });
    const valid = plainToInstance(AppendContestEventsReqDTO, {
      uk: 'contest-a',
      streamRevision: 1,
      events: [{ eventId: 1 }],
    });

    await expect(validationProperties(missing)).resolves.toContain('streamRevision');
    await expect(validationProperties(valid)).resolves.not.toContain('streamRevision');
  });

  it('limits append request batches to at most 1000 events for JSON and protobuf bodies', async () => {
    const atLimit = plainToInstance(AppendContestEventsReqDTO, {
      uk: 'contest-a',
      streamRevision: 1,
      events: createProgressEvents(MAX_APPEND_CONTEST_EVENTS_BATCH_SIZE),
    });
    const overLimit = plainToInstance(AppendContestEventsReqDTO, {
      uk: 'contest-a',
      streamRevision: 1,
      events: createProgressEvents(MAX_APPEND_CONTEST_EVENTS_BATCH_SIZE + 1),
    });
    const protobufBytes = rankland_live_contest_producer.BatchProducerEvent.encode({
      streamRevision: 1,
      events: createProgressEvents(MAX_APPEND_CONTEST_EVENTS_BATCH_SIZE + 1),
    }).finish();
    const protobufBody = rankland_live_contest_producer.BatchProducerEvent.toObject(
      rankland_live_contest_producer.BatchProducerEvent.decode(protobufBytes),
      { longs: String, enums: String },
    );
    const protobufOverLimit = plainToInstance(AppendContestEventsReqDTO, {
      uk: 'contest-a',
      ...protobufBody,
    });

    await expect(validationProperties(atLimit)).resolves.not.toContain('events');
    await expect(validationProperties(overLimit)).resolves.toContain('events');
    await expect(validationProperties(protobufOverLimit)).resolves.toContain('events');
  });

  it('requires a positive integer streamRevision on catch-up requests', async () => {
    const missing = plainToInstance(GetPublicContestEventsReqDTO, {
      uk: 'contest-a',
      afterEventId: 0,
      limit: 100,
    });
    const invalid = plainToInstance(GetPublicContestEventsReqDTO, {
      uk: 'contest-a',
      afterEventId: -1,
      limit: 0,
      streamRevision: 0,
    });
    const valid = plainToInstance(GetPublicContestEventsReqDTO, {
      uk: 'contest-a',
      afterEventId: 0,
      limit: 100,
      streamRevision: 1,
    });

    await expect(validationProperties(missing)).resolves.toContain('streamRevision');
    await expect(validationProperties(invalid)).resolves.toEqual(
      expect.arrayContaining(['afterEventId', 'limit', 'streamRevision']),
    );
    await expect(validationProperties(valid)).resolves.toEqual([]);
  });

  it('builds public contest event catch-up requests', async () => {
    const request = vi.fn(async () => ({
      success: true,
      code: 0,
      data: {
        uk: 'contest-a',
        fromEventId: null,
        toEventId: null,
        checkpointEventId: 0,
        latestEventId: 0,
        streamRevision: 3,
        hasMore: false,
        resetRequired: false,
        events: [],
      },
    }));
    const responseParser = {
      pat: vi.fn((_dto, resp) => resp.data),
    };
    const client = new ApiClient({ request }, responseParser as any);

    await client.getPublicContestEvents({
      uk: 'contest-a',
      afterEventId: 12,
      limit: 100,
      streamRevision: 3,
      compactProgress: false,
    });

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/api/v2/public/contests/contest-a/events?afterEventId=12&limit=100&streamRevision=3&compactProgress=false',
        data: {},
        metadata: expect.objectContaining({
          name: 'getPublicContestEvents',
          path: '/api/v2/public/contests/:uk/events',
          req: GetPublicContestEventsReqDTO,
        }),
      }),
    );
  });

  it('builds the public event-stream bootstrap request', async () => {
    const request = vi.fn(async () => ({
      success: true,
      code: 0,
      data: { uk: 'contest-a', lastEventId: 12, streamRevision: 3 },
    }));
    const responseParser = {
      pat: vi.fn((_dto, resp) => resp.data),
    };
    const client = new ApiClient({ request }, responseParser as any);

    const result = await client.getPublicContestEventStream({ uk: 'contest-a' });

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/api/v2/public/contests/contest-a/event-stream',
        data: {},
        metadata: expect.objectContaining({
          name: 'getPublicContestEventStream',
          path: '/api/v2/public/contests/:uk/event-stream',
        }),
      }),
    );
    expect(result).toEqual({ uk: 'contest-a', lastEventId: 12, streamRevision: 3 });
  });

  it('builds the admin event-stream state request', async () => {
    const request = vi.fn(async () => ({
      success: true,
      code: 0,
      data: { contestId: '70346717215600640', uk: 'contest-a', lastEventId: 12, streamRevision: 3, producerId: null },
    }));
    const responseParser = {
      pat: vi.fn((_dto, resp) => resp.data),
    };
    const client = new ApiClient({ request }, responseParser as any);

    const result = await client.getContestEventStream({ uk: 'contest-a' });

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/api/v2/contests/contest-a/event-stream',
        data: {},
        metadata: expect.objectContaining({
          name: 'getContestEventStream',
          path: '/api/v2/contests/:uk/event-stream',
        }),
      }),
    );
    expect(result).toEqual({
      contestId: '70346717215600640',
      uk: 'contest-a',
      lastEventId: 12,
      streamRevision: 3,
      producerId: null,
    });
  });

  it('builds the producer-lock delete request', async () => {
    const request = vi.fn(async () => ({
      success: true,
      code: 0,
      data: { contestId: '70346717215600640', uk: 'contest-a', lastEventId: 12, streamRevision: 3, producerId: null },
    }));
    const responseParser = {
      pat: vi.fn((_dto, resp) => resp.data),
    };
    const client = new ApiClient({ request }, responseParser as any);

    await client.deleteContestEventStreamProducerLock({ uk: 'contest-a' });

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'DELETE',
        url: '/api/v2/contests/contest-a/event-stream/producer-lock',
        data: {},
        metadata: expect.objectContaining({
          name: 'deleteContestEventStreamProducerLock',
          method: 'DELETE',
          path: '/api/v2/contests/:uk/event-stream/producer-lock',
        }),
      }),
    );
  });

  it('builds the public event-stream notifications SSE request', async () => {
    const request = vi.fn(async () => ({
      success: true,
      code: 0,
      data: null,
    }));
    const responseParser = {
      pat: vi.fn((_dto, resp) => resp.data),
    };
    const client = new ApiClient({ request }, responseParser as any);

    await client.streamPublicContestEventStreamNotifications({ uk: 'contest-a' });

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/api/v2/public/contests/contest-a/event-stream/notifications',
        data: {},
        metadata: expect.objectContaining({
          name: 'streamPublicContestEventStreamNotifications',
          path: '/api/v2/public/contests/:uk/event-stream/notifications',
        }),
      }),
    );
  });

  it('builds contest partial update requests with PATCH', async () => {
    const request = vi.fn(async () => ({
      success: true,
      code: 0,
      data: null,
    }));
    const responseParser = {
      pat: vi.fn((_dto, resp) => resp.data),
    };
    const client = new ApiClient({ request }, responseParser as any);

    await client.updateContest({ uk: 'contest-a', name: 'Renamed Contest' });

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PATCH',
        url: '/api/v2/contests/contest-a',
        data: expect.objectContaining({
          name: 'Renamed Contest',
        }),
        metadata: expect.objectContaining({
          method: 'PATCH',
        }),
      }),
    );
  });

  it('builds contest user partial update requests with PATCH', async () => {
    const request = vi.fn(async () => ({
      success: true,
      code: 0,
      data: null,
    }));
    const responseParser = {
      pat: vi.fn((_dto, resp) => resp.data),
    };
    const client = new ApiClient({ request }, responseParser as any);

    await client.updateContestUser({ uk: 'contest-a', userId: 'team-a', official: false });

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PATCH',
        url: '/api/v2/contests/contest-a/users/team-a',
        data: expect.objectContaining({
          official: false,
        }),
        metadata: expect.objectContaining({
          method: 'PATCH',
        }),
      }),
    );
  });
});
