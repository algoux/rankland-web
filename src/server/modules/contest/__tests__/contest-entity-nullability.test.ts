import { getMetadataArgsStorage } from 'typeorm';
import type { ValueTransformer } from 'typeorm';
import { describe, expect, it } from 'vitest';

import { ContestEntity } from '@server/entities/contest.entity';
import { ContestUserEntity } from '@server/entities/contest-user.entity';
import { nullableOutputTransformer } from '@server/entities/nullable-output.transformer';

function findColumnTransformer(target: Function, propertyName: string) {
  return getMetadataArgsStorage().columns.find(
    (column) => column.target === target && column.propertyName === propertyName,
  )?.options.transformer;
}

function expectNullableOutputTransformer(target: Function, propertyNames: string[]) {
  for (const propertyName of propertyNames) {
    const transformer = findColumnTransformer(target, propertyName);
    const transformers = (Array.isArray(transformer) ? transformer : [transformer]) as ValueTransformer[];
    expect(transformers, `${target.name}.${propertyName}`).toContain(nullableOutputTransformer);
    const transformed = transformers
      .slice()
      .reverse()
      .reduce((value, currentTransformer) => currentTransformer.from(value), null as any);
    expect(transformed, `${target.name}.${propertyName}`).toBeUndefined();
  }
}

describe('contest entity nullable output fields', () => {
  it('normalizes database nulls to undefined without changing explicit null writes', () => {
    expect(nullableOutputTransformer.from(null)).toBeUndefined();
    expect(nullableOutputTransformer.from('value')).toBe('value');
    expect(nullableOutputTransformer.from([])).toEqual([]);

    expect(nullableOutputTransformer.to(undefined)).toBeNull();
    expect(nullableOutputTransformer.to(null)).toBeNull();
    expect(nullableOutputTransformer.to('value')).toBe('value');
    expect(nullableOutputTransformer.to([])).toEqual([]);
  });

  it('applies to optional contest user fields exposed as SRK response properties', () => {
    expectNullableOutputTransformer(ContestUserEntity, [
      'avatar',
      'photo',
      'organization',
      'location',
      'teamMembers',
      'markers',
      'broadcasterToken',
    ]);
  });

  it('applies to optional contest fields exposed in contest responses', () => {
    expectNullableOutputTransformer(ContestEntity, ['contributors']);
    for (const propertyName of ['problems', 'markers', 'series', 'sorter']) {
      expect(findColumnTransformer(ContestEntity, propertyName), `ContestEntity.${propertyName}`).toBeUndefined();
    }
  });
});
