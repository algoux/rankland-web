import { afterEach, describe, expect, it, vi } from 'vitest';

describe('client routes', () => {
  const originalProbe = process.env.RANKLAND_E2E_PROBE;

  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('bwcx-client-vue3');

    if (originalProbe === undefined) {
      delete process.env.RANKLAND_E2E_PROBE;
    } else {
      process.env.RANKLAND_E2E_PROBE = originalProbe;
    }
  });

  it('does not add the probe route when the probe is disabled', async () => {
    delete process.env.RANKLAND_E2E_PROBE;

    const routes = (await import('@client/routes')).default;
    const ranklistRoute = routes.find((route) => route.name === 'Ranklist');
    const collectionRoute = routes.find((route) => route.name === 'Collection');

    expect(routes.some((route) => route.name === 'E2eRanklandProbe')).toBe(false);
    expect(routes.some((route) => route.path === '/__e2e/rankland-probe/:id')).toBe(false);
    expect(routes.some((route) => route.name === 'About')).toBe(false);
    expect(routes.some((route) => route.path === '/about')).toBe(false);
    expect(routes.some((route) => route.name === 'DemoDetail')).toBe(false);
    expect(routes.some((route) => route.path === '/demo/detail/:id')).toBe(false);
    expect(ranklistRoute).toMatchObject({
      path: '/ranklist/:id',
    });
    expect(collectionRoute).toMatchObject({
      path: '/collection/:id',
    });
  });

  it('generates public RankLand routes with typed route props', async () => {
    vi.doMock('bwcx-client-vue3', async () => {
      const actual = await vi.importActual<typeof import('bwcx-client-vue3')>('bwcx-client-vue3');

      return {
        ...actual,
        parseRoutes: vi.fn((routes) => routes),
      };
    });

    const routes = (await import('@client/router/routes')).default as Array<{
      name: string;
      path: string;
      routeProps?: unknown;
      renderMethod?: unknown;
    }>;
    const { RanklistRPO } = await import('@common/modules/ranklist/ranklist.rpo');
    const { CollectionRPO } = await import('@common/modules/collection/collection.rpo');
    const { LiveRPO } = await import('@common/modules/live/live.rpo');
    const ranklistRoute = routes.find((route) => route.name === 'Ranklist');
    const collectionRoute = routes.find((route) => route.name === 'Collection');
    const liveRoute = routes.find((route) => route.name === 'Live');
    const playgroundRoute = routes.find((route) => route.name === 'Playground');

    expect(routes.map((route) => route.name)).toEqual([
      'Collection',
      'Home',
      'Live',
      'Playground',
      'Ranklist',
      'Search',
    ]);
    expect(ranklistRoute?.routeProps).toBe(RanklistRPO);
    expect(collectionRoute?.routeProps).toBe(CollectionRPO);
    expect(liveRoute).toMatchObject({
      path: '/live/:id',
      routeProps: LiveRPO,
      renderMethod: undefined,
    });
    expect(playgroundRoute).toMatchObject({
      path: '/playground',
      routeProps: undefined,
      renderMethod: undefined,
    });
  });

  it('adds the probe route with the expected path when the probe is enabled', async () => {
    process.env.RANKLAND_E2E_PROBE = '1';

    const routes = (await import('@client/routes')).default;
    const probeRoute = routes.find((route) => route.name === 'E2eRanklandProbe');

    expect(probeRoute).toMatchObject({
      path: '/__e2e/rankland-probe/:id',
    });
  });
});
