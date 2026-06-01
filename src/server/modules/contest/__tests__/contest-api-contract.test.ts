import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ApiClient } from '@common/api/api-client';
import {
  AppendContestEventsReqDTO,
  GetPublicContestEventsReqDTO,
} from '@common/modules/contest/contest.dto';

async function validationProperties(instance: object): Promise<string[]> {
  const errors = await validate(instance as any);
  return errors.map((error) => error.property);
}

describe('contest event API contract', () => {
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
      data: { contestId: 'contest-id', uk: 'contest-a', lastEventId: 12, streamRevision: 3, producerId: null },
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
      contestId: 'contest-id',
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
      data: { contestId: 'contest-id', uk: 'contest-a', lastEventId: 12, streamRevision: 3, producerId: null },
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
