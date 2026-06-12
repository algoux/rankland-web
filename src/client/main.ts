import './index.less';
import './index.css';
import { ClientOnly } from 'vite-ssr';
import { createHead, Head } from '@vueuse/head';
import type { HookParams } from 'vite-ssr/vue/types';
import { Vue } from 'vue-class-component';
import { BwcxClientRouterPlugin } from 'bwcx-client-vue3';
import { clientRoutesMap } from '@common/router/client-routes';
import { ApiClientPlugin } from './plugins/api-client.plugin';
import type { ApiClientType } from './api';
import type { ApiService } from './services/ranklist-api';
import { createThemeService, THEME_TOKEN } from './lib/theme';
import { installRanklandAnalytics } from './app/analytics';
import { applyMacBlinkOptimizations } from './app/platform';
import { installRouteProgress } from './app/route-progress';
import {
  SSR_REQUEST_LANGUAGES_TOKEN,
  resolveSsrRequestLanguagesFromInitialState,
} from './app/request-languages';

Vue.registerHooks(['setup', 'beforeRouteEnter', 'beforeRouteUpdate', 'beforeRouteLeave', 'asyncData']);

export function mainEntry({
  app,
  router,
  isClient,
  initialState,
  writeResponse,
  api,
  apiClient,
}: HookParams & { api: ApiService; apiClient: ApiClientType }) {
  const head = createHead();
  const theme = createThemeService();
  const requestLanguages = resolveSsrRequestLanguagesFromInitialState(initialState);
  app.use(head);
  app.use(BwcxClientRouterPlugin, {
    routesMap: clientRoutesMap,
  });
  app.use(ApiClientPlugin, {
    apiClient,
  });
  app.provide(THEME_TOKEN, theme);
  if (requestLanguages) {
    app.provide(SSR_REQUEST_LANGUAGES_TOKEN, requestLanguages);
  }
  app.config.globalProperties.$theme = theme;
  app.config.globalProperties.$ranklandApi = api;
  app.component(Head.name, Head);
  app.component(ClientOnly.name, ClientOnly);

  if (isClient) {
    installRouteProgress(router);
    // Defer system theme sync until after Vue hydrates the SSR markup.
    window.setTimeout(() => {
      theme.mount(window);
      applyMacBlinkOptimizations(window);
      installRanklandAnalytics(router, window);
    }, 0);
  }

  app.config.errorHandler = (err, vm, info) => {
    console.error('Vue error:', err, vm, info);
    if (isClient) {
      // 可以在此展示全局错误提示
    }
  };

  router.onError((err) => {
    console.error('Vue Router error:', err);
    if (isClient) {
      // 可以在此展示全局错误提示
    }
  });

  router.beforeResolve(async (to, from, next) => {
    const component = to.matched[0].components.default;
    // const instance = to.matched[0].instances.default;

    // @ts-ignore
    if (!component.asyncData || !component) {
      return next();
    }

    // @ts-ignore
    if (isClient && !from.href && to.meta.state && Object.keys(to.meta.state).length > 0) {
      return next();
    }

    // 可以在这里加入全局 loading 进度条。或改写这个钩子实现 Route-Update-First 的导航
    try {
      // @ts-ignore
      const result = await component.asyncData({
        app,
        router,
        initialState,
        isClient,
        writeResponse,
        to,
        from,
        api,
        apiClient,
      });
      // eslint-disable-next-line no-param-reassign
      to.meta.state = result;
      return next();
    } catch (e) {
      console.error(`[asyncData] failed to run while navigating to ${to.fullPath}`);
      throw e;
    }
  });

  return { head };
}
