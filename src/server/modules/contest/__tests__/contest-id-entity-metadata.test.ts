import { getMetadataArgsStorage } from 'typeorm';
import { describe, expect, it } from 'vitest';

import MysqlConfig from '@server/configs/mysql/mysql.config';
import { getMysqlDataSourceOptions } from '@server/database/typeorm-data-source';
import { ContestEntity } from '@server/entities/contest.entity';
import { ContestEventEntity } from '@server/entities/contest-event.entity';
import { ContestEventStreamEntity } from '@server/entities/contest-event-stream.entity';
import { ContestUserEntity } from '@server/entities/contest-user.entity';
import { IdWorkerRegistryEntity } from '@server/entities/id-worker-registry.entity';

describe('contest Snowflake entity metadata', () => {
  it('maps all contest row ids and contest references to unsigned BIGINT strings', () => {
    expectColumn(ContestEntity, 'id', { type: 'bigint', unsigned: true, primary: true });
    expectColumn(ContestUserEntity, 'id', { type: 'bigint', unsigned: true, primary: true });
    expectColumn(ContestUserEntity, 'contestId', { type: 'bigint', unsigned: true });
    expectColumn(ContestEventEntity, 'id', { type: 'bigint', unsigned: true, primary: true });
    expectColumn(ContestEventEntity, 'contestId', { type: 'bigint', unsigned: true });
    expectColumn(ContestEventStreamEntity, 'contestId', { type: 'bigint', unsigned: true, primary: true });

    for (const target of [ContestEntity, ContestUserEntity, ContestEventEntity]) {
      expect(
        getMetadataArgsStorage().generations.find(
          (generation) => generation.target === target && generation.propertyName === 'id',
        ),
      ).toBeUndefined();
    }
  });

  it('keeps only registry ids auto-incremented and registers the entity in the shared data source', () => {
    expectColumn(IdWorkerRegistryEntity, 'id', {
      type: 'bigint',
      unsigned: true,
      primary: true,
    });
    expectColumn(IdWorkerRegistryEntity, 'workerId', { type: 'smallint', unsigned: true, nullable: true });
    expectColumn(IdWorkerRegistryEntity, 'reservedUntilMs', { type: 'bigint', unsigned: true, nullable: true });
    expect(
      getMetadataArgsStorage().generations.find(
        (generation) => generation.target === IdWorkerRegistryEntity && generation.propertyName === 'id',
      )?.strategy,
    ).toBe('increment');

    expect(getMysqlDataSourceOptions(new MysqlConfig()).entities).toContain(IdWorkerRegistryEntity);
  });

  it('delegates updated_at generation to MySQL with microsecond precision', () => {
    for (const target of [ContestEntity, ContestUserEntity, ContestEventStreamEntity, IdWorkerRegistryEntity]) {
      const column = getMetadataArgsStorage().columns.find(
        (item) => item.target === target && item.propertyName === 'updatedAt',
      );

      expect(column?.mode, `${target.name}.updatedAt mode`).toBe('regular');
      expect(column?.options, `${target.name}.updatedAt options`).toMatchObject({
        name: 'updated_at',
        type: 'datetime',
        precision: 6,
        default: expect.any(Function),
        onUpdate: 'CURRENT_TIMESTAMP(6)',
        update: false,
      });
      expect((column?.options.default as () => string)()).toBe('CURRENT_TIMESTAMP(6)');
    }
  });
});

function expectColumn(target: Function, propertyName: string, expected: Record<string, unknown>) {
  const column = getMetadataArgsStorage().columns.find(
    (item) => item.target === target && item.propertyName === propertyName,
  );
  expect(column?.options, `${target.name}.${propertyName}`).toMatchObject(expected);
}
