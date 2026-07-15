import { describe, expect, it, vi } from 'vitest';

import type TypeOrmClient from '@server/database/typeorm-client';
import { ContestEntity } from '@server/entities/contest.entity';
import { ContestEventEntity } from '@server/entities/contest-event.entity';
import { ContestEventStreamEntity } from '@server/entities/contest-event-stream.entity';
import { ContestUserEntity } from '@server/entities/contest-user.entity';
import type { IdGenerator } from '@server/services/id-generator.service';
import { rankland_live_contest_common } from '@common/proto/rankland_live_contest';
import ContestService from '../contest.service';
import type { ContestEventInsertInput } from '../contest-event-store';
import TypeOrmContestEventStore from '../contest-event-store.typeorm';

describe('contest Snowflake ID assignment', () => {
  it('assigns decimal-string ids to a new contest and its new users', async () => {
    const generatedIds = ['9007199254740993', '9007199254740994'];
    const idGenerator = sequenceGenerator(generatedIds);
    const harness = contestServiceHarness();
    const service = new ContestService(harness.typeOrmClient, idGenerator);

    const result = await service.createContest({
      uk: 'contest-a',
      name: 'Contest A',
      title: { fallback: 'Contest A' },
      startAt: '2026-01-01T00:00:00Z',
      duration: [5, 'h'],
      problems: [],
      markers: [],
      series: [],
      users: [{ id: 'team-a', name: 'Team A' }],
    });

    expect(result).toEqual({ _id: generatedIds[0] });
    expect(harness.savedContests[0].id).toBe(generatedIds[0]);
    expect(harness.savedStreams[0].contestId).toBe(generatedIds[0]);
    expect(harness.savedUsers[0]).toMatchObject({
      id: generatedIds[1],
      contestId: generatedIds[0],
      userId: 'team-a',
    });
    expect(idGenerator.nextId).toHaveBeenCalledTimes(2);
  });

  it('preserves an existing contest-user primary key during upsert', async () => {
    const idGenerator = sequenceGenerator(['9007199254740999']);
    const harness = contestServiceHarness({
      existingUser: {
        id: '9007199254740900',
        contestId: '9007199254740000',
        userId: 'team-a',
        name: 'Old Name',
        official: true,
        banned: false,
        sortIndex: 0,
      },
    });
    const service = new ContestService(harness.typeOrmClient, idGenerator);

    await service.upsertContestUsers('9007199254740000', [{ id: 'team-a', name: 'New Name' }]);

    expect(harness.savedUsers).toHaveLength(1);
    expect(harness.savedUsers[0]).toMatchObject({
      id: '9007199254740900',
      userId: 'team-a',
      name: 'New Name',
    });
    expect(idGenerator.nextId).not.toHaveBeenCalled();
  });

  it('assigns one id per event while preserving the single bulk insert', async () => {
    const idGenerator = sequenceGenerator(['9007199254741001', '9007199254741002']);
    const insertedBatches: any[][] = [];
    const contestRepository = {
      findOne: vi.fn(async () => ({ id: '9007199254740000', uk: 'contest-a' })),
    };
    const streamRepository = {
      findOne: vi.fn(async () => ({
        contestId: '9007199254740000',
        lastEventId: 0,
        streamRevision: 1,
        producerId: null,
      })),
    };
    const eventRepository = {
      create: vi.fn((values) => values),
      insert: vi.fn(async (values) => {
        insertedBatches.push(values);
      }),
    };
    const manager = {
      getRepository: vi.fn((target) => {
        if (target === ContestEntity) return contestRepository;
        if (target === ContestEventStreamEntity) return streamRepository;
        if (target === ContestEventEntity) return eventRepository;
        throw new Error(`Unexpected repository: ${String(target)}`);
      }),
    };
    const typeOrmClient = {
      getDataSource: () => ({
        transaction: async (callback: (value: typeof manager) => Promise<unknown>) => callback(manager),
      }),
    } as unknown as TypeOrmClient;
    const store = new TypeOrmContestEventStore(typeOrmClient, idGenerator);

    await store.runInStreamTransaction('contest-a', (transaction) =>
      transaction.insertEvents([eventInput(1), eventInput(2)]),
    );

    expect(eventRepository.insert).toHaveBeenCalledOnce();
    expect(insertedBatches[0].map((event) => event.id)).toEqual(['9007199254741001', '9007199254741002']);
    expect(idGenerator.nextId).toHaveBeenCalledTimes(2);
  });
});

function sequenceGenerator(ids: string[]): IdGenerator {
  let index = 0;
  return {
    nextId: vi.fn(() => {
      const id = ids[index];
      index += 1;
      if (!id) {
        throw new Error('Test ID sequence exhausted');
      }
      return id;
    }),
  };
}

function contestServiceHarness(options: { existingUser?: Partial<ContestUserEntity> } = {}) {
  const savedContests: any[] = [];
  const savedStreams: any[] = [];
  const savedUsers: any[] = [];
  const contestRepository = {
    findOne: vi.fn(async () => null),
    create: vi.fn((value) => ({ ...value })),
    save: vi.fn(async (value) => {
      savedContests.push(value);
      return value;
    }),
  };
  const streamRepository = {
    create: vi.fn((value) => ({ ...value })),
    save: vi.fn(async (value) => {
      savedStreams.push(value);
      return value;
    }),
  };
  const userRepository = {
    findOne: vi.fn(async () => options.existingUser ?? null),
    create: vi.fn((value) => ({ ...value })),
    save: vi.fn(async (value) => {
      savedUsers.push(value);
      return value;
    }),
  };
  const manager = {
    getRepository: vi.fn((target) => {
      if (target === ContestEntity) return contestRepository;
      if (target === ContestEventStreamEntity) return streamRepository;
      if (target === ContestUserEntity) return userRepository;
      throw new Error(`Unexpected repository: ${String(target)}`);
    }),
  };
  const typeOrmClient = {
    getDataSource: () => ({
      transaction: async (callback: (value: typeof manager) => Promise<unknown>) => callback(manager),
    }),
  } as unknown as TypeOrmClient;

  return { typeOrmClient, savedContests, savedStreams, savedUsers };
}

function eventInput(eventId: number): ContestEventInsertInput {
  const input: ContestEventInsertInput = {
    eventId,
    type: rankland_live_contest_common.EventType.NEW_SOLUTION,
    producerId: 'producer-a',
    solutionId: eventId,
    userId: `user-${eventId}`,
    problemAlias: 'A',
    timeNs: '0',
    solutionSubmitTimeNs: '0',
    payloadHash: String(eventId).padStart(64, '0'),
    payloadBytes: Buffer.from([eventId]),
  };
  return input;
}
