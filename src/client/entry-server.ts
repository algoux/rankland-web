import App from './App.vue';
import routes from './routes';
import viteSSR from 'vite-ssr/vue/entry-server';
import { ApiFactory } from './api/api-factory.server';
import { ApiClientFactory, API_REQUEST_TOKEN, API_CLIENT_TOKEN } from './api';
import { createServerRanklandApi } from './services/ranklist-api/factory.server';
import { RANKLAND_API_TOKEN } from './services/ranklist-api';
import { mainEntry } from './main';
import {
  createSsrRequestLanguageInitialState,
  parseAcceptLanguageHeader,
} from '@common/request-language';

export default viteSSR(App, { routes }, (hookParams) => {
  const { app, initialState, request } = hookParams;
  const requestLanguageInitialState = createSsrRequestLanguageInitialState(
    parseAcceptLanguageHeader(request.headers['accept-language']),
  );
  if (requestLanguageInitialState) {
    Object.assign(initialState, requestLanguageInitialState);
  }

  // init api
  const getIp = (req: typeof request): string => {
    const ssrIp = req.socket.remoteAddress === '127.0.0.1' ? (request.headers.server_render_ip as string) : '';
    let ip = ssrIp || (request.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    if (ip.substr(0, 7) === '::ffff:') {
      ip = ip.substr(7);
    }
    return ip;
  };
  const apiRequest = ApiFactory.createInstance({
    cookie: request.headers.cookie,
    ip: getIp(request),
    ua: request.headers['user-agent'],
  });
  const apiClient = ApiClientFactory.createInstance(apiRequest);
  const api = createServerRanklandApi();
  app.provide(API_REQUEST_TOKEN, apiRequest);
  app.provide(API_CLIENT_TOKEN, apiClient);
  app.provide(RANKLAND_API_TOKEN, api);

  return mainEntry({ ...hookParams, api, apiClient });
});
