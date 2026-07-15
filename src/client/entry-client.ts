import App from './App.vue';
import routes from './routes';
import viteSSR from 'vite-ssr/vue/entry-client';
import { ApiFactory } from './api/api-factory.client';
import { ApiClientFactory, API_REQUEST_TOKEN, API_CLIENT_TOKEN } from './api';
import { createClientRanklandApi } from './services/ranklist-api/factory.client';
import { RANKLAND_API_TOKEN } from './services/ranklist-api';
import { mainEntry } from './main';

export default viteSSR(App, { routes }, (hookParams) => {
  const { app } = hookParams;

  // init api
  const apiRequest = ApiFactory.createInstance();
  const apiClient = ApiClientFactory.createInstance(apiRequest);
  const api = createClientRanklandApi(apiClient);
  app.provide(API_REQUEST_TOKEN, apiRequest);
  app.provide(API_CLIENT_TOKEN, apiClient);
  app.provide(RANKLAND_API_TOKEN, api);

  return mainEntry({ ...hookParams, api, apiClient });
});
