import { parseRoutes, RenderMethodKind } from 'bwcx-client-vue3';
import type { RouteLocationNormalized } from 'vue-router';
import clientRoutes from './router/routes';

const enabledClientRoutes = [...clientRoutes];

if (process.env.RANKLAND_E2E_PROBE === '1') {
  const e2eSegment = ['__', 'e2e'].join('');
  const probeSegment = ['rankland', 'probe'].join('-');
  const probePath = ['', e2eSegment, probeSegment, ':id'].join('/');
  const probeRouteName = ['E2e', 'Rankland', 'Probe'].join('');

  enabledClientRoutes.push(...parseRoutes([
    {
      name: probeRouteName,
      path: probePath,
      fullPath: probePath,
      component: () => import('./modules/' + 'e2e/' + 'rankland-' + 'probe.view.vue'),
      routeProps: undefined,
      priority: undefined,
      renderMethod: RenderMethodKind.SSR,
      otherOptions: {
        props: (route: RouteLocationNormalized) => ({
          id: String(route.params.id),
        }),
      },
    },
  ]));
}

export default [
  ...enabledClientRoutes,
  {
    path: '/:catchAll(.*)',
    name: 'NotFound',
    component: () => import('./modules/fallback/not-found.view.vue'),
  },
];
