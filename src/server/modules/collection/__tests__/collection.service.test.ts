import { describe, expect, it, vi } from 'vitest';

import { ErrCode } from '@common/enums/err-code.enum';
import { CollectionEntity } from '@server/entities/collection.entity';
import CollectionService from '../collection.service';

const FIRST_ID = '70346717215600640';
const SECOND_ID = '70346717215600641';
const CREATED_AT = new Date('2026-07-15T01:02:03.004Z');
const UPDATED_AT = new Date('2026-07-15T01:02:04.005Z');
const DELETED_AT = new Date('2026-07-15T01:02:05.006Z');

describe('CollectionService', () => {
  it('creates a collection with a Snowflake id and reserves deleted unique keys', async () => {
    const harness = createHarness();
    const service = harness.createService();

    await expect(service.createCollection({ uk: 'official', content: { ranks: ['rank-a'] } })).resolves.toEqual({
      _id: FIRST_ID,
    });
    expect(harness.rows[0]).toMatchObject({
      id: FIRST_ID,
      uk: 'official',
      content: { ranks: ['rank-a'] },
    });

    harness.rows[0].deletedAt = DELETED_AT;
    await expect(service.createCollection({ uk: 'official', content: {} })).rejects.toMatchObject({
      code: ErrCode.CollectionExisted,
    });
  });

  it('returns public and admin summaries in descending id order without content', async () => {
    const harness = createHarness([
      storedCollection(FIRST_ID, 'active', { private: 'active' }),
      storedCollection(SECOND_ID, 'deleted', { private: 'deleted' }, DELETED_AT),
    ]);
    const service = harness.createService();

    const publicResult = await service.getCollections(false);
    expect(publicResult.collections.map((collection) => collection._id)).toEqual([FIRST_ID]);
    expect(publicResult.collections[0]).toEqual({
      _id: FIRST_ID,
      uk: 'active',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(publicResult.collections[0]).not.toHaveProperty('content');
    expect(publicResult.collections[0]).not.toHaveProperty('deletedAt');

    const adminResult = await service.getCollections(true);
    expect(adminResult.collections.map((collection) => collection._id)).toEqual([SECOND_ID, FIRST_ID]);
    expect(adminResult.collections[0]).not.toHaveProperty('content');
    expect(adminResult.collections[0].deletedAt).toEqual(expect.any(String));
    expect(adminResult.collections[1].deletedAt).toBeNull();
    expect(harness.repository.find).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ withDeleted: false, order: { id: 'DESC' } }),
    );
    expect(harness.repository.find).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ withDeleted: true, order: { id: 'DESC' } }),
    );
  });

  it('hides deleted details publicly and exposes them through the admin projection', async () => {
    const harness = createHarness([
      storedCollection(FIRST_ID, 'active', { ranks: ['rank-a'] }),
      storedCollection(SECOND_ID, 'deleted', { ranks: ['rank-b'] }, DELETED_AT),
    ]);
    const service = harness.createService();

    await expect(service.getCollection('active', false)).resolves.toEqual({
      _id: FIRST_ID,
      uk: 'active',
      content: { ranks: ['rank-a'] },
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    await expect(service.getCollection('deleted', false)).rejects.toMatchObject({
      code: ErrCode.CollectionNotFound,
    });
    await expect(service.getCollection('deleted', true)).resolves.toEqual({
      _id: SECOND_ID,
      uk: 'deleted',
      content: { ranks: ['rank-b'] },
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: expect.any(String),
    });
  });

  it('updates and soft-deletes only active collections', async () => {
    const harness = createHarness([storedCollection(FIRST_ID, 'official', { revision: 1 })]);
    const service = harness.createService();

    await service.updateCollection('official', { revision: 2 });
    await expect(service.getCollection('official', false)).resolves.toMatchObject({
      content: { revision: 2 },
    });

    await service.deleteCollection('official');
    expect(harness.repository.softDelete).toHaveBeenCalledWith(expect.objectContaining({ id: FIRST_ID }));
    await expect(service.updateCollection('official', { revision: 3 })).rejects.toMatchObject({
      code: ErrCode.CollectionNotFound,
    });
    await expect(service.deleteCollection('official')).rejects.toMatchObject({
      code: ErrCode.CollectionNotFound,
    });
  });
});

function storedCollection(id: string, uk: string, content: unknown, deletedAt: Date | null = null): CollectionEntity {
  return Object.assign(new CollectionEntity(), {
    id,
    uk,
    content,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    deletedAt,
  });
}

function createHarness(initialRows: CollectionEntity[] = []) {
  const rows = [...initialRows];
  const repository = {
    create: vi.fn((input) => Object.assign(new CollectionEntity(), input)),
    save: vi.fn(async (entity: CollectionEntity) => {
      entity.createdAt ??= CREATED_AT;
      entity.updatedAt = UPDATED_AT;
      rows.push(entity);
      return entity;
    }),
    find: vi.fn(async ({ withDeleted }: { withDeleted?: boolean }) =>
      rows
        .filter((row) => withDeleted || row.deletedAt === null)
        .sort((left, right) => (BigInt(left.id) > BigInt(right.id) ? -1 : 1)),
    ),
    findOne: vi.fn(
      async ({ where, withDeleted }: any) =>
        rows.find((row) => row.uk === where.uk && (withDeleted || row.deletedAt === null)) ?? null,
    ),
    update: vi.fn(async ({ id }: { id: string }, data: Partial<CollectionEntity>) => {
      const row = rows.find((item) => item.id === id && item.deletedAt === null);
      if (!row) return { affected: 0 };
      Object.assign(row, data, { updatedAt: UPDATED_AT });
      return { affected: 1 };
    }),
    softDelete: vi.fn(async ({ id }: { id: string }) => {
      const row = rows.find((item) => item.id === id && item.deletedAt === null);
      if (!row) return { affected: 0 };
      row.deletedAt = DELETED_AT;
      return { affected: 1 };
    }),
  };
  const dataSource = {
    getRepository: vi.fn((target) => {
      if (target === CollectionEntity) return repository;
      throw new Error(`Unexpected repository ${String(target)}`);
    }),
  };

  return {
    rows,
    repository,
    createService() {
      return new CollectionService({ getDataSource: () => dataSource } as any, { nextId: () => FIRST_ID } as any);
    },
  };
}
