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

import ContestController from '../contest.controller';
import { rankland_live_contest_common } from '@common/proto/rankland_live_contest';

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

function createHarness() {
  const response = { write: vi.fn(() => true), end: vi.fn() };
  const contestService = {
    dropEvents: vi.fn(async () => ({
      contestId: '70346717215600640',
      canonicalUk: 'contest-a',
      latestEventId: 0,
      streamRevision: 2,
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
    })),
  };
  const notificationCoordinator = {
    announceCommitted: vi.fn(async () => undefined),
    attachClient: vi.fn(async () => undefined),
  };
  const controller = new ContestController(
    { headers: { 'x-producer-id': 'producer-a' }, res: response } as any,
    contestService as any,
    eventStreamService as any,
    notificationCoordinator as any,
  );
  return { controller, contestService, eventStreamService, notificationCoordinator, response };
}

describe('contest notification controller seam', () => {
  it('announces a committed append but returns only the existing public DTO fields', async () => {
    const { controller, notificationCoordinator } = createHarness();

    const result = await controller.appendContestEvents({
      uk: 'Contest-A',
      streamRevision: 1,
      events,
    });

    expect(notificationCoordinator.announceCommitted).toHaveBeenCalledWith({
      contestId: '70346717215600640',
      canonicalUk: 'contest-a',
      latestEventId: 1,
      streamRevision: 1,
    });
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

  it('announces reset identity after commit and delegates SSE attachment only to the coordinator', async () => {
    const { controller, notificationCoordinator, response } = createHarness();

    await controller.resetContestEvents({ uk: 'Contest-A' });
    expect(notificationCoordinator.announceCommitted).toHaveBeenCalledWith({
      contestId: '70346717215600640',
      canonicalUk: 'contest-a',
      latestEventId: 0,
      streamRevision: 2,
    });

    await controller.streamPublicContestEventStreamNotifications({ uk: 'Contest-A' });
    expect(notificationCoordinator.attachClient).toHaveBeenCalledWith('Contest-A', response);
  });
});
