import clientRoutes from './router/routes';
import { e2eClientRoutes } from './router/e2e-routes';

const enabledClientRoutes = process.env.RANKLAND_E2E_PROBE === '1' ? [...clientRoutes, ...e2eClientRoutes] : clientRoutes;

export default [
  ...enabledClientRoutes,
  {
    path: '/:catchAll(.*)',
    name: 'NotFound',
    component: () => import('./modules/fallback/not-found.view.vue'),
  },
];
