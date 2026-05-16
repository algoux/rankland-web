import { afterEach, describe, expect, it, vi } from 'vitest';

describe('client routes', () => {
  const originalProbe = process.env.RANKLAND_E2E_PROBE;

  afterEach(() => {
    vi.resetModules();

    if (originalProbe === undefined) {
      delete process.env.RANKLAND_E2E_PROBE;
    } else {
      process.env.RANKLAND_E2E_PROBE = originalProbe;
    }
  });

  it('does not add the probe route when the probe is disabled', async () => {
    delete process.env.RANKLAND_E2E_PROBE;

    const routes = (await import('@client/routes')).default;

    expect(routes.some((route) => route.name === 'E2eRanklandProbe')).toBe(false);
    expect(routes.some((route) => route.path === '/__e2e/rankland-probe/:id')).toBe(false);
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
