import { parseRoutes, RenderMethodKind } from 'bwcx-client-vue3';

export const e2eClientRoutes = parseRoutes([
  {
    name: 'E2eRanklandProbe',
    path: '/__e2e/rankland-probe/:id',
    fullPath: '/__e2e/rankland-probe/:id',
    component: () => import(/* webpackChunkName: "E2eRanklandProbe" */ '../modules/e2e/rankland-probe.view.vue'),
    routeProps: undefined,
    priority: undefined,
    renderMethod: RenderMethodKind.SSR,
    otherOptions: undefined,
  },
]);
