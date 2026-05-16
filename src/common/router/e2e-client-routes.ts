import { RenderMethodKind } from 'bwcx-client-vue/enums';
import { clientRoutesMap } from './client-routes';

export function isE2eProbeEnabled() {
  return process.env.RANKLAND_E2E_PROBE === '1';
}

export function getClientRoutesMapForServer() {
  if (!isE2eProbeEnabled()) {
    return clientRoutesMap;
  }

  const routesMap = new Map(clientRoutesMap);
  routesMap.set('E2eRanklandProbe', {
    path: '/__e2e/rankland-probe/:id',
    routeProps: undefined,
    renderMethod: RenderMethodKind.SSR,
  });
  return routesMap;
}
