import { describe, expect, it, vi } from 'vitest';
import { CollectionItemType, type ApiService, type IApiCollection, type IApiRanklist } from '@/services/ranklist-api';
import { LogicException, LogicExceptionKind } from '@/services/ranklist-api';
import {
  flattenCollectionRanklistKeys,
  findCollectionAncestorKeys,
  loadCollectionPageData,
  normalizeCollectionId,
} from './page-data';

const collection: IApiCollection = {
  root: {
    children: [
      {
        type: CollectionItemType.Directory,
        uniqueKey: 'dir-icpc',
        name: 'ICPC',
        children: [
          { type: CollectionItemType.File, uniqueKey: 'regional-2026', name: 'Regional 2026' },
        ],
      },
      { type: CollectionItemType.File, uniqueKey: 'ccpc-2026', name: 'CCPC 2026' },
    ],
  },
};

const ranklist = {
  info: { uniqueKey: 'regional-2026', name: 'Regional 2026' },
  srk: { rows: [] },
} as IApiRanklist;

function createApi(overrides: Partial<ApiService> = {}) {
  return {
    getCollection: vi.fn(async () => collection),
    getRanklist: vi.fn(async () => ranklist),
    ...overrides,
  } as unknown as ApiService;
}

describe('collection page data helpers', () => {
  it('keeps source-compatible collection id aliases', () => {
    expect(normalizeCollectionId('official')).toBe('official');
    expect(normalizeCollectionId('由官方整理和维护的')).toBe('official');
    expect(normalizeCollectionId('custom')).toBe('custom');
  });

  it('flattens ranklist keys from nested collection directories', () => {
    expect(flattenCollectionRanklistKeys(collection)).toEqual(['regional-2026', 'ccpc-2026']);
  });

  it('finds directory ancestors for the selected ranklist', () => {
    expect(findCollectionAncestorKeys(collection, 'regional-2026')).toEqual(['dir-icpc']);
    expect(findCollectionAncestorKeys(collection, 'ccpc-2026')).toEqual([]);
    expect(findCollectionAncestorKeys(collection, 'missing-ranklist')).toEqual([]);
  });

  it('loads collection data without a selected ranklist', async () => {
    const api = createApi();

    await expect(loadCollectionPageData({ api, id: '由官方整理和维护的' })).resolves.toMatchObject({
      collection,
      ranklist: undefined,
      ranklistHasError: false,
      ranklistIdInvalid: false,
    });
    expect(api.getCollection).toHaveBeenCalledWith({ uniqueKey: 'official' });
    expect(api.getRanklist).not.toHaveBeenCalled();
  });

  it('loads a selected ranklist only when it exists in the collection tree', async () => {
    const api = createApi();

    await expect(loadCollectionPageData({ api, id: 'official', rankId: 'regional-2026' })).resolves.toMatchObject({
      collection,
      ranklist,
      ranklistHasError: false,
      ranklistIdInvalid: false,
    });
    expect(api.getRanklist).toHaveBeenCalledWith({ uniqueKey: 'regional-2026' });
  });

  it('treats invalid rankId values as page-level not found without fetching the ranklist', async () => {
    const api = createApi();

    await expect(loadCollectionPageData({ api, id: 'official', rankId: 'missing-ranklist' })).rejects.toMatchObject({
      name: 'LogicException',
      kind: LogicExceptionKind.NotFound,
    });
    expect(api.getRanklist).not.toHaveBeenCalled();
  });

  it('treats selected ranklist not found errors as page-level not found', async () => {
    const api = createApi({
      getRanklist: vi.fn(async () => {
        throw new LogicException(LogicExceptionKind.NotFound);
      }),
    });

    await expect(loadCollectionPageData({ api, id: 'official', rankId: 'regional-2026' })).rejects.toMatchObject({
      name: 'LogicException',
      kind: LogicExceptionKind.NotFound,
    });
  });

  it('keeps the collection visible when the selected ranklist fails to load', async () => {
    const api = createApi({
      getRanklist: vi.fn(async () => {
        throw new Error('ranklist unavailable');
      }),
    });

    await expect(loadCollectionPageData({ api, id: 'official', rankId: 'regional-2026' })).resolves.toMatchObject({
      collection,
      ranklist: undefined,
      ranklistHasError: true,
      ranklistIdInvalid: false,
    });
  });
});
