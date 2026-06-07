# RankLand Full-Chain E2E Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local-only full-chain E2E foundation that drives Playwright through the real bwcx/Koa server, SSR/CSR Vue rendering, `RanklandApiService`, and a controlled local RankLand API mock backend.

**Architecture:** Add concrete RankLand axios adapters and a Vue injection plugin, then expose a hidden SSR probe route only when `RANKLAND_E2E_PROBE=1`. Add explicit E2E server switches for Mongo and Socket.IO, plus a separate Playwright full-chain config that starts a Node HTTP mock backend and the real app server together.

**Tech Stack:** TypeScript, Vue 3, vite-ssr, bwcx, axios 0.26, Vitest, Playwright, Node built-in `http`, existing JSON fixtures.

---

## Source References

- Design spec: `docs/superpowers/specs/2026-05-16-full-chain-e2e-foundation-design.md`
- Existing RankLand service: `src/common/rankland-api/rankland-api.service.ts`
- Existing RankLand service tests: `tests/unit/rankland-api.service.spec.ts`
- Existing Vue app entry: `src/client/main.ts`
- Existing SSR entry: `src/client/entry-server.ts`
- Existing CSR entry: `src/client/entry-client.ts`
- Existing routes: `src/client/routes.ts`, `src/client/router/routes.ts`, `src/common/router/client-routes.ts`
- Existing server bootstrap: `src/server/index.ts`
- Existing Playwright config: `playwright.config.ts`
- Existing E2E fixtures: `tests/fixtures/*.json`

## Target Files

- Create: `src/client/rankland-api/adapters.ts`
- Create: `src/client/rankland-api/factory.ts`
- Create: `src/client/rankland-api/index.ts`
- Create: `src/client/plugins/rankland-api.plugin.ts`
- Modify: `src/client/typings.ts`
- Modify: `src/client/main.ts`
- Modify: `src/client/entry-server.ts`
- Modify: `src/client/entry-client.ts`
- Create: `src/common/router/e2e-client-routes.ts`
- Modify: `src/server/index.ts`
- Create: `src/client/router/e2e-routes.ts`
- Modify: `src/client/routes.ts`
- Create: `src/client/modules/e2e/rankland-probe.view.vue`
- Create: `tests/unit/rankland-api-adapter.spec.ts`
- Create: `tests/unit/rankland-api-factory.spec.ts`
- Create: `tests/unit/e2e-client-routes.spec.ts`
- Create: `tests/e2e/support/start-full-chain-e2e.js`
- Create: `playwright.full-chain.config.ts`
- Create: `tests/e2e/full-chain/rankland-probe.spec.ts`
- Modify: `playwright.config.ts`
- Modify: `package.json`

## Task 1: Add RankLand API Axios Adapters, Factory, And Vue Plugin

**Files:**

- Create: `src/client/rankland-api/adapters.ts`
- Create: `src/client/rankland-api/factory.ts`
- Create: `src/client/rankland-api/index.ts`
- Create: `src/client/plugins/rankland-api.plugin.ts`
- Modify: `src/client/typings.ts`
- Modify: `src/client/main.ts`
- Modify: `src/client/entry-server.ts`
- Modify: `src/client/entry-client.ts`
- Test: `tests/unit/rankland-api-adapter.spec.ts`
- Test: `tests/unit/rankland-api-factory.spec.ts`

- [ ] **Step 1: Write failing adapter tests**

Create `tests/unit/rankland-api-adapter.spec.ts`:

```ts
import Axios from 'axios';
import type { AxiosInstance } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { AxiosRanklandApiAdapter } from '@client/rankland-api';
import { RanklandApiException, RanklandHttpException } from '@common/rankland-api';

function makeAxios(request: ReturnType<typeof vi.fn>): AxiosInstance {
  return {
    request,
  } as unknown as AxiosInstance;
}

describe('AxiosRanklandApiAdapter', () => {
  it('unwraps successful RankLand wrapped responses', async () => {
    const request = vi.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      data: {
        code: 0,
        message: 'success',
        data: { totalSrkCount: 1234 },
      },
    });
    const adapter = new AxiosRanklandApiAdapter(makeAxios(request));

    await expect(adapter.get('/statistics')).resolves.toEqual({ totalSrkCount: 1234 });
    expect(request).toHaveBeenCalledWith({ method: 'GET', url: '/statistics' });
  });

  it('maps wrapped API errors to RanklandApiException', async () => {
    const request = vi.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      data: {
        code: 11,
        message: 'not found',
      },
    });
    const adapter = new AxiosRanklandApiAdapter(makeAxios(request));

    await expect(adapter.get('/rank/missing')).rejects.toMatchObject({
      name: 'RanklandApiException',
      code: 11,
    });
  });

  it('maps non-2xx HTTP responses to RanklandHttpException when axios resolves them', async () => {
    const request = vi.fn().mockResolvedValue({
      status: 404,
      statusText: 'Not Found',
      data: 'missing',
    });
    const adapter = new AxiosRanklandApiAdapter(makeAxios(request));

    await expect(adapter.get('/rank/missing')).rejects.toBeInstanceOf(RanklandHttpException);
  });

  it('maps axios HTTP rejections to RanklandHttpException', async () => {
    const request = vi.fn().mockRejectedValue({
      response: {
        status: 500,
        statusText: 'Internal Server Error',
      },
    });
    const adapter = new AxiosRanklandApiAdapter(makeAxios(request));

    await expect(adapter.get('/statistics')).rejects.toMatchObject({
      name: 'RanklandHttpException',
      status: 500,
    });
  });

  it('returns a raw response wrapper for SRK downloads', async () => {
    const request = vi.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      data: '{"type":"general"}',
    });
    const adapter = new AxiosRanklandApiAdapter(makeAxios(request));

    const result = await adapter.get<{ response: { headers: { get(name: string): string | null }; text(): Promise<string> } }>(
      '/file/download?id=file-test-1',
      { getResponse: true },
    );

    expect(request).toHaveBeenCalledWith({
      method: 'GET',
      url: '/file/download?id=file-test-1',
      responseType: 'text',
      transformResponse: expect.any(Array),
    });
    expect(result.response.headers.get('content-type')).toBe('application/json; charset=utf-8');
    await expect(result.response.text()).resolves.toBe('{"type":"general"}');
  });

  it('treats unwrapped successful data as data for local raw helpers', async () => {
    const request = vi.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      data: { ranks: [] },
    });
    const adapter = new AxiosRanklandApiAdapter(makeAxios(request));

    await expect(adapter.get('/rank/listall')).resolves.toEqual({ ranks: [] });
  });

  it('throws RanklandApiException class for wrapped errors', async () => {
    const request = vi.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      data: {
        code: 99,
        msg: 'boom',
      },
    });
    const adapter = new AxiosRanklandApiAdapter(makeAxios(request));

    await expect(adapter.get('/statistics')).rejects.toBeInstanceOf(RanklandApiException);
  });
});
```

- [ ] **Step 2: Write failing factory tests**

Create `tests/unit/rankland-api-factory.spec.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import Axios from 'axios';
import { createRanklandApiService } from '@client/rankland-api';

vi.mock('axios', () => ({
  default: {
    create: vi.fn(),
  },
}));

const mockedCreate = Axios.create as unknown as ReturnType<typeof vi.fn>;

function setEnv(values: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe('createRanklandApiService', () => {
  afterEach(() => {
    mockedCreate.mockReset();
    setEnv({
      RANKLAND_API_BASE_SERVER: undefined,
      RANKLAND_CDN_API_BASE_SERVER: undefined,
      RANKLAND_API_BASE_CLIENT: undefined,
      RANKLAND_CDN_API_BASE_CLIENT: undefined,
    });
  });

  it('uses server base URLs and forwards SSR headers', () => {
    mockedCreate.mockReturnValue({ request: vi.fn() });
    setEnv({
      RANKLAND_API_BASE_SERVER: 'http://127.0.0.1:3101',
      RANKLAND_CDN_API_BASE_SERVER: 'http://127.0.0.1:3102',
    });

    createRanklandApiService({
      isClient: false,
      requestHeaders: {
        cookie: 'sid=abc',
        'user-agent': 'SSR-UA',
        server_render_ip: '127.0.0.9',
      },
    });

    expect(mockedCreate).toHaveBeenNthCalledWith(1, {
      baseURL: 'http://127.0.0.1:3101',
      timeout: 30000,
      headers: {
        Cookie: 'sid=abc',
        'user-agent': 'SSR-UA',
        server_render_ip: '127.0.0.9',
      },
    });
    expect(mockedCreate).toHaveBeenNthCalledWith(2, {
      baseURL: 'http://127.0.0.1:3102',
      timeout: 30000,
      headers: {
        Cookie: 'sid=abc',
        'user-agent': 'SSR-UA',
        server_render_ip: '127.0.0.9',
      },
    });
  });

  it('uses client base URLs without SSR-only headers', () => {
    mockedCreate.mockReturnValue({ request: vi.fn() });
    setEnv({
      RANKLAND_API_BASE_CLIENT: 'http://127.0.0.1:3101',
      RANKLAND_CDN_API_BASE_CLIENT: 'http://127.0.0.1:3102',
    });

    createRanklandApiService({ isClient: true });

    expect(mockedCreate).toHaveBeenNthCalledWith(1, {
      baseURL: 'http://127.0.0.1:3101',
      timeout: 30000,
      headers: {},
    });
    expect(mockedCreate).toHaveBeenNthCalledWith(2, {
      baseURL: 'http://127.0.0.1:3102',
      timeout: 30000,
      headers: {},
    });
  });

  it('falls back to same-origin /api for unset client base URLs', () => {
    mockedCreate.mockReturnValue({ request: vi.fn() });

    createRanklandApiService({ isClient: true });

    expect(mockedCreate).toHaveBeenNthCalledWith(1, {
      baseURL: '/api',
      timeout: 30000,
      headers: {},
    });
    expect(mockedCreate).toHaveBeenNthCalledWith(2, {
      baseURL: '/api',
      timeout: 30000,
      headers: {},
    });
  });
});
```

- [ ] **Step 3: Run the focused tests and verify they fail**

Run:

```bash
pnpm exec vitest run tests/unit/rankland-api-adapter.spec.ts tests/unit/rankland-api-factory.spec.ts
```

Expected: FAIL because `@client/rankland-api` does not exist.

- [ ] **Step 4: Implement the axios adapter**

Create `src/client/rankland-api/adapters.ts`:

```ts
import Axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import {
  RanklandApiException,
  RanklandHttpException,
  type RanklandApiRequestAdapter,
  type RanklandApiRequestOptions,
} from '@common/rankland-api';

interface WrappedRanklandResponse<T> {
  code?: number;
  message?: string;
  msg?: string;
  data?: T;
}

function getHeader(headers: Record<string, unknown> | undefined, name: string): string | null {
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(headers || {})) {
    if (key.toLowerCase() === lowerName) {
      return Array.isArray(value) ? String(value[0]) : String(value);
    }
  }
  return null;
}

function assertHttpOk(response: Pick<AxiosResponse, 'status' | 'statusText'>) {
  if (response.status < 200 || response.status >= 300) {
    throw new RanklandHttpException(response.status, response.statusText || '');
  }
}

function unwrapRanklandData<T>(body: WrappedRanklandResponse<T> | T): T {
  if (body && typeof body === 'object' && Object.prototype.hasOwnProperty.call(body, 'code')) {
    const wrapped = body as WrappedRanklandResponse<T>;
    if (wrapped.code === 0) {
      return wrapped.data as T;
    }
    throw new RanklandApiException(wrapped.code || -1, wrapped.message || wrapped.msg || 'unknown error');
  }
  return body as T;
}

export class AxiosRanklandApiAdapter implements RanklandApiRequestAdapter {
  public constructor(private readonly axios: AxiosInstance) {}

  public async get<T = unknown>(url: string, opts: RanklandApiRequestOptions = {}): Promise<T> {
    try {
      if (opts.getResponse) {
        const response = await this.axios.request({
          method: 'GET',
          url,
          responseType: 'text',
          transformResponse: [(data) => data],
        });
        assertHttpOk(response);
        return {
          response: {
            headers: {
              get: (name: string) => getHeader(response.headers, name),
            },
            text: async () => (typeof response.data === 'string' ? response.data : JSON.stringify(response.data)),
          },
        } as T;
      }

      const response = await this.axios.request({ method: 'GET', url });
      assertHttpOk(response);
      return unwrapRanklandData<T>(response.data);
    } catch (error) {
      if (error instanceof RanklandApiException || error instanceof RanklandHttpException) {
        throw error;
      }
      if (Axios.isAxiosError(error) && error.response) {
        throw new RanklandHttpException(error.response.status, error.response.statusText || '');
      }
      throw error;
    }
  }
}
```

- [ ] **Step 5: Implement the factory**

Create `src/client/rankland-api/factory.ts`:

```ts
import Axios from 'axios';
import { RanklandApiService } from '@common/rankland-api';
import { AxiosRanklandApiAdapter } from './adapters';

interface CreateRanklandApiServiceOptions {
  isClient: boolean;
  requestHeaders?: Record<string, string | string[] | undefined>;
}

function env(name: string): string | undefined {
  return process.env[name] || undefined;
}

function pickBaseURL(isClient: boolean, kind: 'api' | 'cdnApi') {
  if (isClient) {
    return kind === 'api' ? env('RANKLAND_API_BASE_CLIENT') || '/api' : env('RANKLAND_CDN_API_BASE_CLIENT') || '/api';
  }

  return kind === 'api'
    ? env('RANKLAND_API_BASE_SERVER') || 'http://127.0.0.1:3000/api'
    : env('RANKLAND_CDN_API_BASE_SERVER') || 'http://127.0.0.1:3000/api';
}

function firstHeader(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function buildHeaders(isClient: boolean, requestHeaders: Record<string, string | string[] | undefined> = {}) {
  if (isClient) {
    return {};
  }
  return {
    Cookie: firstHeader(requestHeaders.cookie),
    'user-agent': firstHeader(requestHeaders['user-agent']),
    server_render_ip: firstHeader(requestHeaders.server_render_ip),
  };
}

export function createRanklandApiService(opts: CreateRanklandApiServiceOptions): RanklandApiService {
  const headers = buildHeaders(opts.isClient, opts.requestHeaders);
  const api = Axios.create({
    baseURL: pickBaseURL(opts.isClient, 'api'),
    timeout: 30000,
    headers,
  });
  const cdnApi = Axios.create({
    baseURL: pickBaseURL(opts.isClient, 'cdnApi'),
    timeout: 30000,
    headers,
  });

  return new RanklandApiService({
    api: new AxiosRanklandApiAdapter(api),
    cdnApi: new AxiosRanklandApiAdapter(cdnApi),
  });
}
```

- [ ] **Step 6: Export the client RankLand API module**

Create `src/client/rankland-api/index.ts`:

```ts
export * from './adapters';
export * from './factory';
```

- [ ] **Step 7: Add the Vue plugin**

Create `src/client/plugins/rankland-api.plugin.ts`:

```ts
import type { App } from 'vue';
import { inject } from 'vue';
import type { RanklandApiService } from '@common/rankland-api';

export const RANKLAND_API_SERVICE_TOKEN = Symbol('RanklandApiService');

export interface RanklandApiPluginOptions {
  ranklandApiService: RanklandApiService;
}

export const RanklandApiPlugin = {
  install(app: App, opts: RanklandApiPluginOptions) {
    app.provide(RANKLAND_API_SERVICE_TOKEN, opts.ranklandApiService);
  },
};

export function useRanklandApiService(): RanklandApiService {
  const service = inject<RanklandApiService>(RANKLAND_API_SERVICE_TOKEN);
  if (!service) {
    throw new Error('RanklandApiService is not provided');
  }
  return service;
}
```

- [ ] **Step 8: Thread the service through Vue main and typings**

Modify `src/client/typings.ts` so `AsyncDataOptions` includes `ranklandApiService`:

```ts
import type { HookParams } from 'vite-ssr/vue/types';
import type { RouteLocationNormalized } from 'vue-router';
import type { RanklandApiService } from '@common/rankland-api';
import type { ApiType, ApiClientType } from './api';

export interface AsyncDataOptions {
  app: HookParams['app'];
  router: HookParams['router'];
  initialState: HookParams['initialState'];
  to: RouteLocationNormalized;
  from: RouteLocationNormalized;
  api: ApiType;
  apiClient: ApiClientType;
  ranklandApiService: RanklandApiService;
}
```

Modify `src/client/main.ts`:

```ts
import { RanklandApiPlugin } from './plugins/rankland-api.plugin';
import type { RanklandApiService } from '@common/rankland-api';
```

Change `mainEntry` params to include `ranklandApiService`. The function signature should become:

```ts
export function mainEntry({
  app,
  router,
  isClient,
  initialState,
  api,
  apiClient,
  ranklandApiService,
}: HookParams & { api: ApiType; apiClient: ApiClientType; ranklandApiService: RanklandApiService }) {
```

Install `RanklandApiPlugin` immediately after `ApiClientPlugin`:

```ts
  app.use(ApiClientPlugin, {
    apiClient,
  });
  app.use(RanklandApiPlugin, {
    ranklandApiService,
  });
```

In `router.beforeResolve`, replace the `component.asyncData` call with:

```ts
  const result = await component.asyncData({ app, router, initialState, to, from, api, apiClient, ranklandApiService });
```

- [ ] **Step 9: Create the service in SSR and CSR entries**

Modify `src/client/entry-server.ts`:

```ts
import { createRanklandApiService } from './rankland-api';
```

After `apiClient` is created:

```ts
const ranklandApiService = createRanklandApiService({
  isClient: false,
  requestHeaders: request.headers as Record<string, string | string[] | undefined>,
});
```

Pass it to `mainEntry`:

```ts
return mainEntry({ ...hookParams, api, apiClient, ranklandApiService });
```

Modify `src/client/entry-client.ts`:

```ts
import { createRanklandApiService } from './rankland-api';
```

After `apiClient` is created:

```ts
const ranklandApiService = createRanklandApiService({ isClient: true });
```

Pass it to `mainEntry`:

```ts
return mainEntry({ ...hookParams, api, apiClient, ranklandApiService });
```

- [ ] **Step 10: Run focused tests and unit suite**

Run:

```bash
pnpm exec vitest run tests/unit/rankland-api-adapter.spec.ts tests/unit/rankland-api-factory.spec.ts
pnpm test:unit
```

Expected: both commands pass.

- [ ] **Step 11: Commit**

Run:

```bash
git add src/client/rankland-api src/client/plugins/rankland-api.plugin.ts src/client/typings.ts src/client/main.ts src/client/entry-server.ts src/client/entry-client.ts tests/unit/rankland-api-adapter.spec.ts tests/unit/rankland-api-factory.spec.ts
git commit -m "feat: wire RankLand API service into Vue"
```

Expected: commit succeeds.

## Task 2: Add Gated E2E Route Contract And Server Test Switches

**Files:**

- Create: `src/common/router/e2e-client-routes.ts`
- Modify: `src/server/index.ts`
- Test: `tests/unit/e2e-client-routes.spec.ts`

- [ ] **Step 1: Write failing route contract tests**

Create `tests/unit/e2e-client-routes.spec.ts`:

```ts
import { afterEach, describe, expect, it } from 'vitest';
import { RenderMethodKind } from 'bwcx-client-vue/enums';
import { getClientRoutesMapForServer } from '@common/router/e2e-client-routes';

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

  it('adds the probe route as SSR only when RANKLAND_E2E_PROBE=1', () => {
    process.env.RANKLAND_E2E_PROBE = '1';

    const routes = getClientRoutesMapForServer();

    expect(routes.get('E2eRanklandProbe')).toEqual({
      path: '/__e2e/rankland-probe/:id',
      routeProps: undefined,
      renderMethod: RenderMethodKind.SSR,
    });
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm exec vitest run tests/unit/e2e-client-routes.spec.ts
```

Expected: FAIL because `@common/router/e2e-client-routes` does not exist.

- [ ] **Step 3: Add the server route map helper**

Create `src/common/router/e2e-client-routes.ts`:

```ts
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
```

- [ ] **Step 4: Bind the helper in the server**

Modify `src/server/index.ts`.

Replace:

```ts
import { clientRoutesMap } from '@common/router/client-routes';
```

with:

```ts
import { getClientRoutesMapForServer } from '@common/router/e2e-client-routes';
```

Replace the constructor binding:

```ts
this.container.bind(BwcxClientVueClientRoutesMapId).toConstantValue(clientRoutesMap);
```

with:

```ts
this.container.bind(BwcxClientVueClientRoutesMapId).toConstantValue(getClientRoutesMapForServer());
```

- [ ] **Step 5: Add explicit E2E skip guards for Mongo and Socket.IO**

Modify `src/server/index.ts`.

In `afterWire()`, replace:

```ts
const mongoClient = getDependency<MongoClient>(MongoClient, this.container);
await mongoClient.init();
```

with:

```ts
if (process.env.RANKLAND_E2E_SKIP_MONGO === '1') {
  console.warn('[E2E] Skipping Mongo initialization');
  return;
}

const mongoClient = getDependency<MongoClient>(MongoClient, this.container);
await mongoClient.init();
```

In the bootstrap block, replace:

```ts
const socketIOServer = getDependency<SocketIOServer>(SocketIOServer, app.container);
await app.startManually(async () => {
  const httpServer = http.createServer(app.instance.callback());
  socketIOServer.init(httpServer);
  const listenPromise = new Promise((resolve, _reject) => {
    httpServer.listen(app.port, app.hostname, () => {
      resolve(true);
    });
  });
  await listenPromise;
});
```

with:

```ts
await app.startManually(async () => {
  const httpServer = http.createServer(app.instance.callback());
  if (process.env.RANKLAND_E2E_SKIP_SOCKET === '1') {
    console.warn('[E2E] Skipping Socket.IO initialization');
  } else {
    const socketIOServer = getDependency<SocketIOServer>(SocketIOServer, app.container);
    socketIOServer.init(httpServer);
  }
  const listenPromise = new Promise((resolve, _reject) => {
    httpServer.listen(app.port, app.hostname, () => {
      resolve(true);
    });
  });
  await listenPromise;
});
```

- [ ] **Step 6: Run focused tests and build**

Run:

```bash
pnpm exec vitest run tests/unit/e2e-client-routes.spec.ts
pnpm run build
```

Expected: both commands pass.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/common/router/e2e-client-routes.ts src/server/index.ts tests/unit/e2e-client-routes.spec.ts
git commit -m "feat: add gated E2E route contract"
```

Expected: commit succeeds.

## Task 3: Add The Test-Only RankLand Probe Vue Route

**Files:**

- Create: `src/client/router/e2e-routes.ts`
- Modify: `src/client/routes.ts`
- Create: `src/client/modules/e2e/rankland-probe.view.vue`

- [ ] **Step 1: Add the client route module**

Create `src/client/router/e2e-routes.ts`:

```ts
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
```

- [ ] **Step 2: Gate the client route in the visible router**

Modify `src/client/routes.ts`:

```ts
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
```

- [ ] **Step 3: Add the probe page**

Create `src/client/modules/e2e/rankland-probe.view.vue`:

```vue
<template>
  <main data-testid="rankland-probe">
    <h1 data-testid="rankland-probe-title">{{ ranklistName }}</h1>
    <p data-testid="rankland-probe-key">{{ uniqueKey }}</p>
    <p data-testid="rankland-probe-row-count">{{ rowCount }}</p>
    <p data-testid="rankland-probe-total-srk-count">{{ totalSrkCount }}</p>
    <p data-testid="rankland-probe-render-source">{{ renderSource }}</p>
    <p data-testid="rankland-probe-hydrated">{{ hydrated ? 'hydrated' : 'ssr' }}</p>
    <p data-testid="rankland-probe-client-refresh-count">{{ clientRefreshCount }}</p>
    <button type="button" data-testid="rankland-probe-refresh" @click="refreshStatistics">Refresh statistics</button>
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { routeView, RenderMethodKind } from 'bwcx-client-vue3';
import type { AsyncDataOptions } from '@client/typings';
import type { IApiRanklist, IApiStatistics } from '@common/rankland-api';
import { useRanklandApiService } from '@client/plugins/rankland-api.plugin';

interface ProbeState {
  ranklist: IApiRanklist;
  statistics: IApiStatistics;
  renderSource: string;
}

const RanklandProbe = defineComponent({
  name: 'E2eRanklandProbe',
  props: {
    id: {
      type: String,
      required: true,
    },
    ranklist: {
      type: Object,
      required: false,
    },
    statistics: {
      type: Object,
      required: false,
    },
    renderSource: {
      type: String,
      required: false,
      default: 'unknown',
    },
  },
  setup() {
    const ranklandApiService = useRanklandApiService();
    return { ranklandApiService };
  },
  data() {
    return {
      hydrated: false,
      clientRefreshCount: 0,
    };
  },
  computed: {
    ranklistName(): string {
      return ((this.ranklist as IApiRanklist | undefined)?.info.name) || '';
    },
    uniqueKey(): string {
      return ((this.ranklist as IApiRanklist | undefined)?.info.uniqueKey) || '';
    },
    rowCount(): number {
      return ((this.ranklist as IApiRanklist | undefined)?.srk as any)?.rows?.length || 0;
    },
    totalSrkCount(): number {
      return (this.statistics as IApiStatistics | undefined)?.totalSrkCount || 0;
    },
  },
  mounted() {
    this.hydrated = true;
  },
  methods: {
    async refreshStatistics() {
      const statistics = await this.ranklandApiService.getStatistics();
      this.clientRefreshCount += statistics.totalSrkCount;
    },
  },
  async asyncData({ ranklandApiService, to }: AsyncDataOptions): Promise<ProbeState> {
    const uniqueKey = String(to.params.id);
    const [ranklist, statistics] = await Promise.all([
      ranklandApiService.getRanklist({ uniqueKey }),
      ranklandApiService.getStatistics(),
    ]);
    return {
      ranklist,
      statistics,
      renderSource: 'asyncData',
    };
  },
});

export default routeView(RanklandProbe, '/__e2e/rankland-probe/:id', undefined, undefined, {
  renderMethod: RenderMethodKind.SSR,
});
</script>
```

- [ ] **Step 4: Run build and SSR smoke**

Run:

```bash
pnpm run build
pnpm test:ssr
```

Expected: both commands pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/client/router/e2e-routes.ts src/client/routes.ts src/client/modules/e2e/rankland-probe.view.vue
git commit -m "feat: add E2E RankLand probe route"
```

Expected: commit succeeds.

## Task 4: Add Full-Chain Playwright Harness And Mock Backend

**Files:**

- Create: `tests/e2e/support/start-full-chain-e2e.js`
- Create: `playwright.full-chain.config.ts`
- Create: `tests/e2e/full-chain/rankland-probe.spec.ts`
- Modify: `playwright.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Add the full-chain server launcher**

Create `tests/e2e/support/start-full-chain-e2e.js`:

```js
/* eslint-disable @typescript-eslint/no-require-imports */

const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const appPort = process.env.FULL_CHAIN_APP_PORT || '3100';
const mockPort = process.env.FULL_CHAIN_MOCK_PORT || '3101';
const projectRoot = path.resolve(__dirname, '../../..');

const fixtures = {
  ranklistInfo: require('../fixtures/ranklist-info.json'),
  srk: require('../fixtures/ranklist.srk.json'),
  statistics: require('../fixtures/statistics.json'),
  listall: require('../fixtures/listall.json'),
  collection: require('../fixtures/collection.json'),
  liveInfo: require('../fixtures/live-info.json'),
};

const requests = [];

function ok(data) {
  return { code: 0, message: 'success', data };
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

function sendRawJson(res, body) {
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

const mockServer = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  requests.push({ method: req.method, path: url.pathname, search: url.search });

  if (req.method === 'GET' && url.pathname === '/__requests') {
    sendJson(res, 200, requests);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/__reset') {
    requests.length = 0;
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'GET' && /^\/rank\/[^/]+$/.test(url.pathname) && !url.pathname.startsWith('/rank/group/')) {
    sendJson(res, 200, ok(fixtures.ranklistInfo));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/file/download') {
    sendRawJson(res, fixtures.srk);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/statistics') {
    sendJson(res, 200, ok(fixtures.statistics));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/rank/listall') {
    sendJson(res, 200, ok(fixtures.listall));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/rank/search') {
    sendJson(res, 200, ok(fixtures.listall));
    return;
  }

  if (req.method === 'GET' && /^\/rank\/group\/[^/]+$/.test(url.pathname)) {
    sendJson(res, 200, ok({ content: JSON.stringify(fixtures.collection) }));
    return;
  }

  if (req.method === 'GET' && /^\/ranking\/config\/[^/]+$/.test(url.pathname)) {
    sendJson(res, 200, ok(fixtures.liveInfo));
    return;
  }

  if (req.method === 'GET' && /^\/ranking\/[^/]+$/.test(url.pathname)) {
    sendJson(res, 200, ok(fixtures.srk));
    return;
  }

  sendJson(res, 404, { code: 11, message: `No mock route for ${req.method} ${url.pathname}` });
});

let appProcess;

function shutdown(code = 0) {
  if (appProcess && !appProcess.killed) {
    appProcess.kill('SIGTERM');
  }
  mockServer.close(() => process.exit(code));
}

mockServer.listen(Number(mockPort), '127.0.0.1', () => {
  const mockBaseURL = `http://127.0.0.1:${mockPort}`;
  appProcess = spawn('pnpm', ['run', 'dev:start'], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      RANKLAND_E2E_PROBE: '1',
      RANKLAND_E2E_SKIP_MONGO: '1',
      RANKLAND_E2E_SKIP_SOCKET: '1',
      SERVER_HOST: '127.0.0.1',
      SERVER_PORT: appPort,
      RANKLAND_API_BASE_SERVER: mockBaseURL,
      RANKLAND_CDN_API_BASE_SERVER: mockBaseURL,
      RANKLAND_API_BASE_CLIENT: mockBaseURL,
      RANKLAND_CDN_API_BASE_CLIENT: mockBaseURL,
    },
  });

  appProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      shutdown(code);
    }
  });
});

process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));
```

- [ ] **Step 2: Add the full-chain Playwright config**

Create `playwright.full-chain.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

const appPort = process.env.FULL_CHAIN_APP_PORT || '3100';
const baseURL = process.env.E2E_BASE_URL || `http://127.0.0.1:${appPort}`;

export default defineConfig({
  testDir: './tests/e2e/full-chain',
  timeout: 45_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'node tests/e2e/support/start-full-chain-e2e.js',
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
```

- [ ] **Step 3: Keep the default Vite E2E config shallow**

Modify `playwright.config.ts` to ignore the full-chain suite:

```ts
export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: ['**/full-chain/**'],
  timeout: 30_000,
```

- [ ] **Step 4: Add the full-chain package script**

Modify `package.json` scripts:

```json
"test:e2e": "playwright test",
"test:e2e:full-chain": "playwright test -c playwright.full-chain.config.ts",
"test:migration": "pnpm run build && pnpm test:unit && pnpm test:ssr && pnpm test:e2e && pnpm test:e2e:full-chain",
```

- [ ] **Step 5: Add the full-chain E2E test**

Create `tests/e2e/full-chain/rankland-probe.spec.ts`:

```ts
import { expect, test } from '@playwright/test';
import { denyExternalCalls } from '../helpers/mock-api';

const mockBaseURL = `http://127.0.0.1:${process.env.FULL_CHAIN_MOCK_PORT || '3101'}`;

test.describe('RankLand full-chain probe', () => {
  test('renders RankLand data through bwcx SSR, hydration, and client refresh', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/__e2e/rankland-probe/test-key');
    expect(response?.ok()).toBe(true);
    expect(await response?.text()).toContain('Test Contest 2024');

    await expect(page.getByTestId('rankland-probe-title')).toHaveText('Test Contest 2024');
    await expect(page.getByTestId('rankland-probe-key')).toHaveText('test-key');
    await expect(page.getByTestId('rankland-probe-row-count')).toHaveText('2');
    await expect(page.getByTestId('rankland-probe-total-srk-count')).toHaveText('1234');
    await expect(page.getByTestId('rankland-probe-render-source')).toHaveText('asyncData');
    await expect(page.getByTestId('rankland-probe-hydrated')).toHaveText('hydrated');
    await expect(page.getByTestId('rankland-probe-client-refresh-count')).toHaveText('0');

    await page.getByTestId('rankland-probe-refresh').click();
    await expect(page.getByTestId('rankland-probe-client-refresh-count')).toHaveText('1234');

    const requests = (await (await request.get(`${mockBaseURL}/__requests`)).json()) as Array<{ path: string }>;
    expect(requests.some((entry) => entry.path === '/rank/test-key')).toBe(true);
    expect(requests.some((entry) => entry.path === '/file/download')).toBe(true);
    expect(requests.filter((entry) => entry.path === '/statistics')).toHaveLength(2);
  });
});
```

- [ ] **Step 6: Run the full-chain test and fix startup issues**

Run:

```bash
pnpm test:e2e:full-chain
```

Expected: PASS with one Chromium test. If it fails during app startup, inspect the Playwright webServer output and fix only issues directly related to E2E startup, the probe route, or RankLand API wiring.

- [ ] **Step 7: Commit**

Run:

```bash
git add tests/e2e/support/start-full-chain-e2e.js playwright.full-chain.config.ts tests/e2e/full-chain/rankland-probe.spec.ts playwright.config.ts package.json
git commit -m "test: add full-chain RankLand E2E harness"
```

Expected: commit succeeds.

## Task 5: Run Final Branch Gate And Record Result

**Files:**

- Modify only files needed to fix failures found by the final gate.

- [ ] **Step 1: Run build**

Run:

```bash
pnpm run build
```

Expected: PASS.

- [ ] **Step 2: Run unit tests**

Run:

```bash
pnpm test:unit
```

Expected: PASS.

- [ ] **Step 3: Run SSR smoke tests**

Run:

```bash
pnpm test:ssr
```

Expected: PASS.

- [ ] **Step 4: Run shallow E2E tests**

Run:

```bash
pnpm test:e2e
```

Expected: PASS.

- [ ] **Step 5: Run full-chain E2E tests**

Run:

```bash
pnpm test:e2e:full-chain
```

Expected: PASS.

- [ ] **Step 6: Run the combined migration gate**

Run:

```bash
pnpm test:migration
```

Expected: PASS.

- [ ] **Step 7: Confirm local-only branch state**

Run:

```bash
git status --short --branch
git log --oneline --decorate -8
```

Expected:

```text
## migration/full-chain-e2e-foundation
```

The log should show local commits for the design spec, implementation plan, and implementation tasks. Do not merge and do not push.

- [ ] **Step 8: Commit final fixes if any were needed**

If Steps 1-6 required code changes, run:

```bash
git add <changed-files>
git commit -m "fix: stabilize full-chain E2E gate"
```

If no fixes were needed, do not create an empty commit.

## Plan Self-Review

- Spec coverage: API adapter wiring, Vue injection, gated probe route, server Mongo/socket switches, Node HTTP mock backend, full-chain Playwright config, CSR refresh, request-log assertions, and final gates are covered.
- Placeholder scan: no incomplete sections or deferred implementation steps are present.
- Type consistency: `ranklandApiService`, `AxiosRanklandApiAdapter`, `createRanklandApiService`, `E2eRanklandProbe`, and `getClientRoutesMapForServer` use consistent names across tasks.
- Scope check: no real RankLand page migration, SRK renderer integration, Node runtime upgrade, merge, or push is included.
