import NProgress from 'nprogress';
import { START_LOCATION, type Router } from 'vue-router';

export function installRouteProgress(router: Router) {
  let pendingNavigation = false;

  NProgress.configure({
    showSpinner: false,
    trickleSpeed: 120,
  });

  const finish = () => {
    if (!pendingNavigation) {
      return;
    }
    pendingNavigation = false;
    NProgress.done();
  };

  router.beforeEach((_to, from) => {
    if (from === START_LOCATION) {
      return;
    }
    pendingNavigation = true;
    NProgress.start();
  });

  router.beforeResolve(() => {
    if (pendingNavigation) {
      NProgress.set(0.25);
    }
  });

  router.afterEach(() => {
    finish();
  });

  router.onError(() => {
    finish();
  });
}
