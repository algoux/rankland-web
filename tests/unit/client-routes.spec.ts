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

    expect(routes.some((route) => route.name === 'E2eRanklandProbe')).toBe(false);
    expect(routes.some((route) => route.path === '/__e2e/rankland-probe/:id')).toBe(false);
    expect(ranklistRoute).toMatchObject({
      path: '/ranklist/:id',
    });
  });

  it('generates the public ranklist route with typed route props', async () => {
    vi.doMock('bwcx-client-vue3', async () => {
      const actual = await vi.importActual<typeof import('bwcx-client-vue3')>('bwcx-client-vue3');

      return {
        ...actual,
        parseRoutes: vi.fn((routes) => routes),
      };
    });

    const routes = (await import('@client/router/routes')).default as Array<{ name: string; routeProps?: unknown }>;
    const { RanklistRPO } = await import('@common/modules/ranklist/ranklist.rpo');
    const ranklistRoute = routes.find((route) => route.name === 'Ranklist');

    expect(ranklistRoute?.routeProps).toBe(RanklistRPO);
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
