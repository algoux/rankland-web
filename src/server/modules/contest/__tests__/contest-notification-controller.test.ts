import 'reflect-metadata';

vi.mock('bwcx-core', () => ({
  Inject: () => () => undefined,
  Provide: () => (target: unknown) => target,
}));
vi.mock('bwcx-ljsm', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('bwcx-ljsm');
  return {
    ...actual,
    Contract: () => () => undefined,
    Data: () => () => undefined,
    Delete: () => () => undefined,
    Get: () => () => undefined,
    Guard: () => (target: unknown) => target,
    InjectCtx: () => () => undefined,
    Patch: () => () => undefined,
    Post: () => () => undefined,
    UseGuards: () => () => undefined,
  };
});
vi.mock('bwcx-api', () => ({ Api: { Summary: () => () => undefined } }));
vi.mock('@server/decorators', () => ({ ApiController: () => (target: unknown) => target }));
vi.mock('@server/decorators/protobuf-contract.decorator', () => ({
  ProtobufContract: () => () => undefined,
}));
vi.mock('@server/decorators/sse.decorator', () => ({ Sse: () => () => undefined }));
vi.mock('@server/middlewares/sse.middleware', () => ({ openSseResponse: vi.fn() }));

import ContestController from '../contest.controller';
import { rankland_live_contest_common } from '@common/proto/rankland_live_contest';
import { ResponseContentType } from '@server/http/content-type';
import { openSseResponse } from '@server/middlewares/sse.middleware';

const events = [
  {
    eventId: 1,
    type: rankland_live_contest_common.EventType.NEW_SOLUTION,
    newSolutionData: {
      solutionId: 1,
      userId: 'user-a',
      problemAlias: 'A',
      time: { value: 0, unit: rankland_live_contest_common.TimeUnit.S },
    },
  },
];

function createHarness(respContentType: ResponseContentType = ResponseContentType.Json) {
  const response = { write: vi.fn(() => true), end: vi.fn() };
  const contestService = {
    dropEvents: vi.fn(async () => ({
      contestId: '70346717215600640',
      canonicalUk: 'contest-a',
      latestEventId: 0,
      streamRevision: 2,
    })),
    updateContest: vi.fn(async () => ({
      type: 'metadata',
      contestId: '70346717215600640',
      canonicalUk: 'contest-a',
      visibilityFingerprint: 'duration=18000;frozen=3600',
    })),
    deleteContest: vi.fn(async () => ({
      type: 'delete',
      contestId: '70346717215600640',
      canonicalUk: 'contest-a',
    })),
  };
  const eventStreamService = {
    appendProducerEvents: vi.fn(async () => ({
      contestId: '70346717215600640',
      canonicalUk: 'contest-a',
      acceptedEventIds: [1],
      duplicateEventIds: [],
      lastEventId: 1,
      expectedNextEventId: 2,
      streamRevision: 1,
      committedEvents: [{ eventId: 1 }],
    })),
    getClientEventsForTransport: vi.fn(async (_request, format) => ({ format })),
  };
  const preparedAttachment = {
    activate: vi.fn(),
    abort: vi.fn(),
    closed: false,
  };
  const notificationCoordinator = {
    announceCommitted: vi.fn(async () => undefined),
    announceControl: vi.fn(async () => undefined),
    attachClient: vi.fn(async () => undefined),
    prepareClient: vi.fn(async () => preparedAttachment),
  };
  const controller = new ContestController(
    { headers: { 'x-producer-id': 'producer-a' }, res: response, state: { respContentType } } as any,
    contestService as any,
    eventStreamService as any,
    notificationCoordinator as any,
  );
  return {
    controller,
    contestService,
    eventStreamService,
    notificationCoordinator,
    preparedAttachment,
    response,
  };
}

describe('contest notification controller seam', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('announces a committed append but returns only the existing public DTO fields', async () => {
    const { controller, notificationCoordinator } = createHarness();

    const result = await controller.appendContestEvents({
      uk: 'Contest-A',
      streamRevision: 1,
      events,
    });

    expect(notificationCoordinator.announceCommitted).toHaveBeenCalledWith(
      {
        contestId: '70346717215600640',
        canonicalUk: 'contest-a',
        latestEventId: 1,
        streamRevision: 1,
      },
      [{ eventId: 1 }],
    );
    expect(result).toEqual({
      acceptedEventIds: [1],
      duplicateEventIds: [],
      lastEventId: 1,
      expectedNextEventId: 2,
      streamRevision: 1,
    });
  });

  it('does not announce when append or reset persistence fails', async () => {
    const appendHarness = createHarness();
    appendHarness.eventStreamService.appendProducerEvents.mockRejectedValueOnce(new Error('transaction failed'));
    await expect(
      appendHarness.controller.appendContestEvents({ uk: 'contest-a', streamRevision: 1, events }),
    ).rejects.toThrow('transaction failed');
    expect(appendHarness.notificationCoordinator.announceCommitted).not.toHaveBeenCalled();

    const resetHarness = createHarness();
    resetHarness.contestService.dropEvents.mockRejectedValueOnce(new Error('transaction failed'));
    await expect(resetHarness.controller.resetContestEvents({ uk: 'contest-a' })).rejects.toThrow('transaction failed');
    expect(resetHarness.notificationCoordinator.announceCommitted).not.toHaveBeenCalled();
  });

  it('publishes committed metadata and delete controls without changing the HTTP body', async () => {
    const harness = createHarness();

    await expect(
      harness.controller.updateContest({ uk: 'contest-a', frozenDuration: [1, 'h'] } as any),
    ).resolves.toBeUndefined();
    expect(harness.notificationCoordinator.announceControl).toHaveBeenNthCalledWith(1, {
      type: 'metadata',
      contestId: '70346717215600640',
      canonicalUk: 'contest-a',
      visibilityFingerprint: 'duration=18000;frozen=3600',
    });

    await expect(harness.controller.deleteContest({ uk: 'contest-a' })).resolves.toBeUndefined();
    expect(harness.notificationCoordinator.announceControl).toHaveBeenNthCalledWith(2, {
      type: 'delete',
      contestId: '70346717215600640',
      canonicalUk: 'contest-a',
    });
  });

  it('announces reset identity after commit and opens SSE only after preparation succeeds', async () => {
    const { controller, notificationCoordinator, preparedAttachment, response } = createHarness();

    await controller.resetContestEvents({ uk: 'Contest-A' });
    expect(notificationCoordinator.announceCommitted).toHaveBeenCalledWith({
      contestId: '70346717215600640',
      canonicalUk: 'contest-a',
      latestEventId: 0,
      streamRevision: 2,
    });

    await controller.streamPublicContestEventStreamNotifications({ uk: 'Contest-A' });
    expect(notificationCoordinator.prepareClient).toHaveBeenCalledWith('Contest-A', response);
    expect(openSseResponse).toHaveBeenCalledOnce();
    expect(vi.mocked(openSseResponse).mock.invocationCallOrder[0]).toBeLessThan(
      preparedAttachment.activate.mock.invocationCallOrder[0]!,
    );
    expect(preparedAttachment.activate).toHaveBeenCalledOnce();
  });

  it('does not commit an SSE 200 response when preparation fails', async () => {
    const { controller, notificationCoordinator, preparedAttachment } = createHarness();
    notificationCoordinator.prepareClient.mockRejectedValueOnce(new Error('pool unavailable'));

    await expect(controller.streamPublicContestEventStreamNotifications({ uk: 'Contest-A' })).rejects.toThrow(
      'pool unavailable',
    );
    expect(openSseResponse).not.toHaveBeenCalled();
    expect(preparedAttachment.activate).not.toHaveBeenCalled();
  });

  it('aborts the prepared Hub registration if opening the HTTP stream fails', async () => {
    const { controller, preparedAttachment } = createHarness();
    vi.mocked(openSseResponse).mockImplementationOnce(() => {
      throw new Error('socket head failed');
    });

    await expect(controller.streamPublicContestEventStreamNotifications({ uk: 'Contest-A' })).rejects.toThrow(
      'socket head failed',
    );
    expect(preparedAttachment.abort).toHaveBeenCalledOnce();
    expect(preparedAttachment.activate).not.toHaveBeenCalled();
  });

  it('passes only the negotiated response format into the event read seam', async () => {
    const { controller, eventStreamService } = createHarness(ResponseContentType.Protobuf);

    const result = await controller.getPublicContestEvents({
      uk: 'Contest-A',
      afterEventId: 2,
      limit: 25,
      streamRevision: 3,
      compactProgress: false,
    });

    expect(eventStreamService.getClientEventsForTransport).toHaveBeenCalledWith(
      {
        uk: 'Contest-A',
        afterEventId: 2,
        limit: 25,
        streamRevision: 3,
        compactProgress: false,
      },
      'protobuf',
    );
    expect(result).toEqual({ format: 'protobuf' });
  });
});
