import { afterEach, describe, expect, it, vi } from 'vitest';
import { START_LOCATION, type Router } from 'vue-router';
import { installRouteProgress } from './route-progress';

type RouterHook = (...args: unknown[]) => unknown;

const nprogressMock = vi.hoisted(() => ({
  configure: vi.fn(),
  done: vi.fn(),
  set: vi.fn(),
  start: vi.fn(),
}));

vi.mock('nprogress', () => ({
  default: nprogressMock,
}));

describe('installRouteProgress', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('configures NProgress without the spinner', () => {
    const { router } = createRouterDouble();

    installRouteProgress(router);

    expect(nprogressMock.configure).toHaveBeenCalledWith({
      showSpinner: false,
      trickleSpeed: 120,
    });
  });

  it('skips the initial SSR hydration navigation', () => {
    const { hooks, router } = createRouterDouble();

    installRouteProgress(router);
    hooks.beforeEach[0](route('/search'), START_LOCATION);
    hooks.afterEach[0](route('/search'), START_LOCATION);

    expect(nprogressMock.start).not.toHaveBeenCalled();
    expect(nprogressMock.set).not.toHaveBeenCalled();
    expect(nprogressMock.done).not.toHaveBeenCalled();
  });

  it('starts before client navigation and advances before asyncData', () => {
    const { hooks, router } = createRouterDouble();
    const from = route('/');
    const to = route('/search');

    installRouteProgress(router);
    hooks.beforeEach[0](to, from);
    hooks.beforeResolve[0](to, from);

    expect(nprogressMock.start).toHaveBeenCalledTimes(1);
    expect(nprogressMock.set).toHaveBeenCalledWith(0.65);
  });

  it('finishes after successful and cancelled navigations', () => {
    const { hooks, router } = createRouterDouble();
    const from = route('/');
    const to = route('/search');

    installRouteProgress(router);
    hooks.beforeEach[0](to, from);
    hooks.afterEach[0](to, from);
    hooks.beforeEach[0](route('/collection/official'), to);
    hooks.afterEach[0](route('/collection/official'), to, { type: 4 });

    expect(nprogressMock.done).toHaveBeenCalledTimes(2);
  });

  it('finishes when the router reports an error', () => {
    const { hooks, router } = createRouterDouble();

    installRouteProgress(router);
    hooks.beforeEach[0](route('/search'), route('/'));
    hooks.onError[0](new Error('chunk failed'));

    expect(nprogressMock.done).toHaveBeenCalledTimes(1);
  });
});

function createRouterDouble() {
  const hooks = {
    afterEach: [] as RouterHook[],
    beforeEach: [] as RouterHook[],
    beforeResolve: [] as RouterHook[],
    onError: [] as RouterHook[],
  };

  const router = {
    afterEach: vi.fn((handler: RouterHook) => {
      hooks.afterEach.push(handler);
      return vi.fn();
    }),
    beforeEach: vi.fn((handler: RouterHook) => {
      hooks.beforeEach.push(handler);
      return vi.fn();
    }),
    beforeResolve: vi.fn((handler: RouterHook) => {
      hooks.beforeResolve.push(handler);
      return vi.fn();
    }),
    onError: vi.fn((handler: RouterHook) => {
      hooks.onError.push(handler);
      return vi.fn();
    }),
  } as unknown as Router;

  return { hooks, router };
}

function route(fullPath: string) {
  return { fullPath };
}
