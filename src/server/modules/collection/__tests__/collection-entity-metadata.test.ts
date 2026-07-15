import { getMetadataArgsStorage } from 'typeorm';
import { describe, expect, it } from 'vitest';

import MysqlConfig from '@server/configs/mysql/mysql.config';
import { getMysqlDataSourceOptions } from '@server/database/typeorm-data-source';
import { CollectionEntity } from '@server/entities/collection.entity';
import { mysqlJsonValueTransformer } from '@server/entities/mysql-json-value.transformer';

describe('collection entity metadata', () => {
  it('maps the collection schema and registers it in the shared data source', () => {
    expectColumn('id', { type: 'bigint', unsigned: true, primary: true });
    expectColumn('uk', { type: 'varchar', length: 64 });
    expectColumn('content', { type: 'json' });
    expectColumn('createdAt', { name: 'created_at', type: 'datetime', precision: 6 });
    expectColumn('deletedAt', { name: 'deleted_at', type: 'datetime', precision: 6, nullable: true });

    expect(
      getMetadataArgsStorage().generations.find(
        (generation) => generation.target === CollectionEntity && generation.propertyName === 'id',
      ),
    ).toBeUndefined();
    expect(
      getMetadataArgsStorage().indices.find(
        (index) => index.target === CollectionEntity && index.name === 'IDX_collection_uk',
      )?.unique,
    ).toBe(true);
    expect(getMysqlDataSourceOptions(new MysqlConfig()).entities).toContain(CollectionEntity);
  });

  it('delegates updated_at generation to MySQL with microsecond precision', () => {
    const column = getMetadataArgsStorage().columns.find(
      (item) => item.target === CollectionEntity && item.propertyName === 'updatedAt',
    );

    expect(column?.mode).toBe('regular');
    expect(column?.options).toMatchObject({
      name: 'updated_at',
      type: 'datetime',
      precision: 6,
      default: expect.any(Function),
      onUpdate: 'CURRENT_TIMESTAMP(6)',
      update: false,
    });
    expect((column?.options.default as () => string)()).toBe('CURRENT_TIMESTAMP(6)');
  });

  it('persists JS null as the JSON null literal instead of SQL NULL', () => {
    const transformedNull = mysqlJsonValueTransformer.to(null);

    expect(transformedNull).not.toBeNull();
    expect(JSON.stringify(transformedNull)).toBe('null');
    expect(mysqlJsonValueTransformer.from(null)).toBeNull();
    expect(mysqlJsonValueTransformer.to({ value: null })).toEqual({ value: null });
  });
});

function expectColumn(propertyName: string, expected: Record<string, unknown>) {
  const column = getMetadataArgsStorage().columns.find(
    (item) => item.target === CollectionEntity && item.propertyName === propertyName,
  );
  expect(column?.options, `CollectionEntity.${propertyName}`).toMatchObject(expected);
}
