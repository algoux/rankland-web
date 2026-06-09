import { describe, expect, it, vi } from 'vitest';
import { SSR_SKIP_CACHE_HEADER } from '@common/ssr-cache';
import { CollectionItemType } from '@/services/ranklist-api';
import Home from './home/home.view.vue';
import Search from './search/search.view.vue';
import Ranklist from './ranklist/ranklist.view.vue';
import Collection from './collection/collection.view.vue';
import Live from './live/live.view.vue';
import Playground from './playground/playground.view.vue';
import NotFound from './fallback/not-found.view.vue';

describe('rankland migrated pages', () => {
  it('keeps the SSR page SFCs importable before route generation wires them in', () => {
    expect(Home).toBeTruthy();
    expect(Search).toBeTruthy();
    expect(Ranklist).toBeTruthy();
    expect(Collection).toBeTruthy();
    expect(Live).toBeTruthy();
    expect(Playground).toBeTruthy();
    expect(NotFound).toBeTruthy();
  });

  it('marks collection SSR output as not cacheable when the selected ranklist transiently fails', async () => {
    const asyncData = getComponentAsyncData(Collection);
    const writeResponse = vi.fn();

    await expect(asyncData({
      api: {
        getCollection: vi.fn(async () => ({
          root: {
            children: [
              { type: CollectionItemType.File, uniqueKey: 'regional-2026', name: 'Regional 2026' },
            ],
          },
        })),
        getRanklist: vi.fn(async () => {
          throw new Error('upstream down');
        }),
      },
      isClient: false,
      to: {
        params: { id: 'official' },
        query: { rankId: 'regional-2026' },
      },
      writeResponse,
    })).resolves.toMatchObject({
      collectionPageData: {
        ranklistHasError: true,
      },
      errorKind: undefined,
    });

    expect(writeResponse).toHaveBeenCalledWith({
      headers: {
        [SSR_SKIP_CACHE_HEADER]: '1',
      },
    });
  });
});

function getComponentAsyncData(component: unknown) {
  const maybeComponent = component as {
    asyncData?: unknown;
    methods?: { asyncData?: unknown };
    __vccOpts?: {
      asyncData?: unknown;
      methods?: { asyncData?: unknown };
    };
  };
  const asyncData = maybeComponent.asyncData
    || maybeComponent.methods?.asyncData
    || maybeComponent.__vccOpts?.asyncData
    || maybeComponent.__vccOpts?.methods?.asyncData;
  if (typeof asyncData !== 'function') {
    throw new Error('Component asyncData not found');
  }
  return asyncData;
}
