import { describe, expect, it } from 'vitest';
import collection from '../fixtures/collection.json';
import {
  getAncestorDirectoryKeys,
  getFlatRanklistUniqueKeys,
  isRanklistInCollection,
  normalizeCollectionId,
} from '@client/modules/collection/collection-tree';
import type { IApiCollection } from '@common/rankland-api';

const fixtureCollection = collection as IApiCollection;

describe('collection-tree helpers', () => {
  it('normalizes public collection aliases', () => {
    expect(normalizeCollectionId('official')).toBe('official');
    expect(normalizeCollectionId('由官方整理和维护的')).toBe('official');
    expect(normalizeCollectionId('custom')).toBe('custom');
  });

  it('collects ranklist keys from nested collection items', () => {
    expect(getFlatRanklistUniqueKeys(fixtureCollection)).toEqual(['test-key', 'another-key']);
  });

  it('detects whether a ranklist belongs to the collection', () => {
    expect(isRanklistInCollection(fixtureCollection, 'test-key')).toBe(true);
    expect(isRanklistInCollection(fixtureCollection, 'missing-key')).toBe(false);
  });

  it('returns ancestor directory keys for a selected ranklist', () => {
    expect(getAncestorDirectoryKeys(fixtureCollection, 'test-key')).toEqual(['dir-icpc']);
    expect(getAncestorDirectoryKeys(fixtureCollection, 'missing-key')).toEqual([]);
  });
});
