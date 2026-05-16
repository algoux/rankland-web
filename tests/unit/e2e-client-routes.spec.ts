import { afterEach, describe, expect, it } from 'vitest';
import { RenderMethodKind } from 'bwcx-client-vue/enums';
import { getClientRoutesMapForServer } from '@common/router/e2e-client-routes';
import { clientRoutesMap } from '@common/router/client-routes';

describe('getClientRoutesMapForServer', () => {
  const originalProbe = process.env.RANKLAND_E2E_PROBE;

  afterEach(() => {
    if (originalProbe === undefined) {
      delete process.env.RANKLAND_E2E_PROBE;
    } else {
      process.env.RANKLAND_E2E_PROBE = originalProbe;
    }
  });

  it('does not expose the probe route unless RANKLAND_E2E_PROBE=1', () => {
    delete process.env.RANKLAND_E2E_PROBE;

    const routes = getClientRoutesMapForServer();

    expect(routes.has('E2eRanklandProbe')).toBe(false);
    expect(routes.has('Home')).toBe(true);
  });

  it('does not expose the probe route for non-1 values', () => {
    process.env.RANKLAND_E2E_PROBE = 'true';

    const routes = getClientRoutesMapForServer();

    expect(routes.has('E2eRanklandProbe')).toBe(false);
  });

  it('adds the probe route as SSR only when RANKLAND_E2E_PROBE=1', () => {
    process.env.RANKLAND_E2E_PROBE = '1';

    const routes = getClientRoutesMapForServer();

    expect(routes.get('E2eRanklandProbe')).toEqual({
      path: '/__e2e/rankland-probe/:id',
      routeProps: undefined,
      renderMethod: RenderMethodKind.SSR,
    });
  });

  it('keeps the base client routes map isolated when adding the probe route', () => {
    process.env.RANKLAND_E2E_PROBE = '1';

    const routes = getClientRoutesMapForServer();

    expect(routes).not.toBe(clientRoutesMap);
    expect(routes.has('E2eRanklandProbe')).toBe(true);
    expect(clientRoutesMap.has('E2eRanklandProbe')).toBe(false);
  });
});
