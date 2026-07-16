import { describe, expect, it, vi } from 'vitest';
import { createHead } from '@vueuse/head';
import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { createMemoryHistory, createRouter } from 'vue-router';
import { SSR_SKIP_CACHE_HEADER } from '@common/ssr-cache';
import { CollectionItemType } from '@/services/ranklist-api';
import { RANKLAND_RSS_PATH } from '@/app/config';
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

  it('enables browser view reporting for CSR data loads but not SSR hydration state', async () => {
    const ranklistData = {
      info: { uniqueKey: 'regional-2026' },
      srk: { rows: [] },
      srkUrl: '/file/regional-2026.json',
    };
    const ranklistAsyncData = getComponentAsyncData(Ranklist);
    const ranklistOptions = {
      api: { getRanklist: vi.fn(async () => ranklistData) },
      to: { params: { id: 'regional-2026' }, query: {} },
      writeResponse: vi.fn(),
    };

    await expect(ranklistAsyncData({ ...ranklistOptions, isClient: false })).resolves.toMatchObject({
      reportViewOnClient: false,
    });
    await expect(ranklistAsyncData({ ...ranklistOptions, isClient: true })).resolves.toMatchObject({
      reportViewOnClient: true,
    });

    const collectionAsyncData = getComponentAsyncData(Collection);
    const collectionOptions = {
      api: {
        getCollection: vi.fn(async () => ({
          root: {
            children: [
              { type: CollectionItemType.File, uniqueKey: 'regional-2026', name: 'Regional 2026' },
            ],
          },
        })),
        getRanklist: vi.fn(async () => ranklistData),
      },
      to: {
        params: { id: 'official' },
        query: { rankId: 'regional-2026' },
      },
      writeResponse: vi.fn(),
    };

    await expect(collectionAsyncData({ ...collectionOptions, isClient: false })).resolves.toMatchObject({
      reportViewOnClient: false,
    });
    await expect(collectionAsyncData({ ...collectionOptions, isClient: true })).resolves.toMatchObject({
      reportViewOnClient: true,
    });
  });

  it('SSR-renders the RSS feed link in the home footer other links', async () => {
    const app = createSSRApp(Home, {
      statistics: {
        totalSrkCount: 1,
        totalViewCount: 2,
      },
    });
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: Home },
        { path: '/search', component: { template: '<div />' } },
        { path: '/collection/:id', component: { template: '<div />' } },
      ],
    });
    app.use(createHead());
    app.use(router);
    await router.push('/');
    await router.isReady();

    const html = await renderToString(app);

    expect(html).toContain('其他链接');
    expect(html).toContain(`href="${RANKLAND_RSS_PATH}"`);
    expect(html).toContain('RSS');
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
