# RankLand Vue API Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add RankLand API service and public route contracts to `rankland-web` so later Vue page migration can consume stable, tested SSR/CSR-safe domain APIs.

**Architecture:** Add a focused `src/common/rankland-api` module that mirrors the source `rankland-fe` API behavior while depending only on small injected request/cache interfaces. Add a separate `src/common/rankland-router` module for public URL builders; do not wire these routes into visible Vue pages in this slice.

**Tech Stack:** TypeScript, Vitest, existing fixtures, `@algoux/standard-ranklist`, `urlcat-fork`, current Node 16 harness with future Node 24 compatibility in mind.

---

## Source References

- Source API service: `/Users/cooper/Projects/RankLand/rankland-fe/src/services/api/index.ts`
- Source API types: `/Users/cooper/Projects/RankLand/rankland-fe/src/services/api/interface.ts`
- Source API tests: `/Users/cooper/Projects/RankLand/rankland-fe/tests/unit/api.service.test.ts`
- Target design spec: `docs/superpowers/specs/2026-05-16-rankland-vue-api-routing-design.md`
- Existing fixtures: `tests/fixtures/*.json`

## Target Files

- Create: `src/common/rankland-api/interfaces.ts`
- Create: `src/common/rankland-api/exceptions.ts`
- Create: `src/common/rankland-api/request-adapter.ts`
- Create: `src/common/rankland-api/rankland-api.service.ts`
- Create: `src/common/rankland-api/index.ts`
- Create: `src/common/rankland-router/routes.ts`
- Create: `src/common/rankland-router/index.ts`
- Create: `tests/unit/rankland-api.service.spec.ts`
- Create: `tests/unit/rankland-routes.spec.ts`

## Task 1: Add API Domain Types And Exceptions

**Files:**

- Create: `src/common/rankland-api/interfaces.ts`
- Create: `src/common/rankland-api/exceptions.ts`
- Create: `src/common/rankland-api/request-adapter.ts`
- Create: `src/common/rankland-api/index.ts`

- [ ] **Step 1: Add RankLand API interfaces**

Create `src/common/rankland-api/interfaces.ts`:

```ts
import type * as srk from '@algoux/standard-ranklist';
import Long from 'long';

export interface IApiRanklistInfo {
  id: string;
  uniqueKey: string;
  name: string;
  fileID: string;
  viewCnt: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface IApiRanklist {
  info: IApiRanklistInfo;
  srk: srk.Ranklist;
}

export enum CollectionItemType {
  File = 1,
  Directory = 2,
}

export interface IApiCollectionItem {
  type: CollectionItemType;
  uniqueKey: string;
  name: string;
  children?: IApiCollectionItem[];
}

export interface IApiCollection {
  root: {
    children: IApiCollectionItem[];
  };
}

export interface IApiStatistics {
  totalSrkCount: number;
  totalViewCount: number;
}

export interface IApiLiveRanklistInfo {
  id: string;
  uniqueKey: string;
  title: srk.Contest['title'];
  startAt: srk.Contest['startAt'];
  duration: srk.Contest['duration'];
  frozenDuration: srk.Contest['frozenDuration'];
  unfrozenAt: srk.DatetimeISOString;
  problems: srk.Problem[];
  members: srk.User[];
  markers: srk.Marker[];
  series: srk.RankSeries[];
  sorter: srk.SorterICPC;
  contributors: srk.Contributor[];
  type: srk.Type;
}

export interface IApiLiveScrollSolution {
  id: Long;
  problemAlias: string;
  userId: string;
  result: 'AC' | 'FB' | 'RJ' | '?';
  solved: number;
}
```

- [ ] **Step 2: Add request adapter and cache interfaces**

Create `src/common/rankland-api/request-adapter.ts`:

```ts
export interface RanklandApiRequestOptions {
  getResponse?: boolean;
}

export interface RanklandApiRequestAdapter {
  get<T = unknown>(url: string, opts?: RanklandApiRequestOptions): Promise<T>;
}

export interface RanklandApiCache {
  get(key: string): Promise<unknown>;
  setEx(key: string, ttlSeconds: number, value: string): Promise<void>;
  del(key: string): Promise<void>;
}
```

- [ ] **Step 3: Add exception classes**

Create `src/common/rankland-api/exceptions.ts`:

```ts
export class RanklandApiException extends Error {
  public readonly code: number;

  public constructor(code: number, message: string) {
    super(`RankLand API request failed with code ${code}: ${message}`);
    this.name = 'RanklandApiException';
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
    // @ts-ignore
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class RanklandHttpException extends Error {
  public readonly status: number;

  public constructor(status: number, statusText: string) {
    super(`RankLand HTTP request failed: ${status} ${statusText}`);
    this.name = 'RanklandHttpException';
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
    // @ts-ignore
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export enum RanklandLogicExceptionKind {
  NotFound = 'NotFound',
}

export class RanklandLogicException extends Error {
  public readonly kind: RanklandLogicExceptionKind;

  public constructor(kind: RanklandLogicExceptionKind) {
    super(`RankLand logic exception: ${kind}`);
    this.name = 'RanklandLogicException';
    this.kind = kind;
    Object.setPrototypeOf(this, new.target.prototype);
    // @ts-ignore
    Error.captureStackTrace?.(this, this.constructor);
  }
}
```

- [ ] **Step 4: Export the API module**

Create `src/common/rankland-api/index.ts`:

```ts
export * from './exceptions';
export * from './interfaces';
export * from './request-adapter';
```

- [ ] **Step 5: Run TypeScript build**

Run:

```bash
fnm exec --using=16.20.2 pnpm run build
```

Expected: build passes.

- [ ] **Step 6: Commit**

```bash
git add src/common/rankland-api
git commit -m "feat: add RankLand API domain types"
```

## Task 2: Add RankLand API Service Core Behavior

**Files:**

- Create: `src/common/rankland-api/rankland-api.service.ts`
- Modify: `src/common/rankland-api/index.ts`
- Create: `tests/unit/rankland-api.service.spec.ts`

- [ ] **Step 1: Add failing service tests**

Create `tests/unit/rankland-api.service.spec.ts` with tests ported from `rankland-fe/tests/unit/api.service.test.ts`. The file must use `@common/rankland-api`.

The test helper must be:

```ts
import { describe, expect, it, vi } from 'vitest';
import {
  RanklandApiException,
  RanklandApiService,
  RanklandHttpException,
  RanklandLogicException,
  RanklandLogicExceptionKind,
  type RanklandApiRequestAdapter,
} from '@common/rankland-api';

type GetMock = ReturnType<typeof vi.fn>;

function makeAdapter(getMock: GetMock): RanklandApiRequestAdapter {
  return { get: getMock };
}

function buildService(opts: { apiGet?: GetMock; cdnGet?: GetMock } = {}) {
  const apiGet = opts.apiGet || vi.fn();
  const cdnGet = opts.cdnGet || vi.fn();
  const service = new RanklandApiService({
    api: makeAdapter(apiGet),
    cdnApi: makeAdapter(cdnGet),
  });
  return { service, apiGet, cdnGet };
}
```

Tests must cover:

- `getRanklistInfo` calls `/rank/test-key` on CDN adapter.
- `getSrkFile` calls `/file/download?id=fid` with `{ getResponse: true }`.
- `getSrkFile` parses `application/json; charset=utf-8`.
- `getSrkFile` throws on `application/octet-stream`.
- `getRanklist` combines ranklist info and SRK payload.
- `getRanklist` maps `new RanklandApiException(11, 'not found')` to `RanklandLogicExceptionKind.NotFound`.
- `getRanklist` maps `new RanklandHttpException(404, 'Not Found')` to `RanklandLogicExceptionKind.NotFound`.
- `getRanklist` rethrows other API exceptions.
- `searchRanklist` calls `/rank/search?query=hello`.
- `listAllRanklists` calls `/rank/listall`.
- `getCollection` calls `/rank/group/official` and parses `content`.
- `getStatistics` calls `/statistics`.
- `getLiveRanklistInfo` calls `/ranking/config/lk` with `_t`.
- `getLiveRanklist` calls `/ranking/live-id` with `_t` and optional `token`.

- [ ] **Step 2: Run failing tests**

Run:

```bash
fnm exec --using=16.20.2 pnpm test:unit
```

Expected: fails because `RanklandApiService` is not exported yet.

- [ ] **Step 3: Implement service**

Create `src/common/rankland-api/rankland-api.service.ts`:

```ts
import type * as srk from '@algoux/standard-ranklist';
import { configure as configureUrlcat } from 'urlcat-fork';
import {
  RanklandApiException,
  RanklandHttpException,
  RanklandLogicException,
  RanklandLogicExceptionKind,
} from './exceptions';
import type { IApiCollection, IApiRanklist, IApiRanklistInfo, IApiStatistics, IApiLiveRanklistInfo } from './interfaces';
import type { RanklandApiCache, RanklandApiRequestAdapter } from './request-adapter';

const urlcat = configureUrlcat({ arrayFormat: 'repeat' });

interface RanklandApiServiceAdapters {
  api: RanklandApiRequestAdapter;
  cdnApi: RanklandApiRequestAdapter;
  cache?: RanklandApiCache;
}

interface RawResponseLike {
  headers: {
    get(name: string): string | null;
  };
  text(): Promise<string>;
}

export class RanklandApiService {
  private readonly api: RanklandApiRequestAdapter;
  private readonly cdnApi: RanklandApiRequestAdapter;
  private readonly cache?: RanklandApiCache;

  public constructor(adapters: RanklandApiServiceAdapters) {
    this.api = adapters.api;
    this.cdnApi = adapters.cdnApi;
    this.cache = adapters.cache;
  }

  public async getRanklistInfo(opts: { uniqueKey: string }) {
    return this.cdnApi.get<IApiRanklistInfo>(urlcat('/rank/:key', { key: opts.uniqueKey }));
  }

  public async getSrkFile<T = srk.Ranklist>(opts: { fileID: string }): Promise<T> {
    const apiRes = await this.cdnApi.get<{ response: RawResponseLike }>(urlcat('/file/download', { id: opts.fileID }), {
      getResponse: true,
    });
    const contentType = (apiRes.response.headers.get('content-type') || '').split(';')[0];
    if (contentType !== 'application/json') {
      throw new Error('Unknown srk content type');
    }
    return JSON.parse(await apiRes.response.text()) as T;
  }

  public async getRanklist(opts: { uniqueKey: string }): Promise<IApiRanklist> {
    try {
      const info = await this.getRanklistInfo({ uniqueKey: opts.uniqueKey });
      const ranklist = await this.getSrkFile({ fileID: info.fileID });
      return { info, srk: ranklist };
    } catch (error) {
      if (
        (error instanceof RanklandApiException && error.code === 11) ||
        (error instanceof RanklandHttpException && error.status === 404)
      ) {
        throw new RanklandLogicException(RanklandLogicExceptionKind.NotFound);
      }
      throw error;
    }
  }

  public async searchRanklist(opts: { kw?: string }) {
    return this.api.get<{ ranks: IApiRanklistInfo[] }>(urlcat('/rank/search', { query: opts.kw }));
  }

  public async listAllRanklists() {
    return this.api.get<{ ranks: IApiRanklistInfo[] }>('/rank/listall');
  }

  public async getCollection(opts: { uniqueKey: string }) {
    const res = await this.cdnApi.get<{ content: string }>(urlcat('/rank/group/:key', { key: opts.uniqueKey }));
    return JSON.parse(res.content) as IApiCollection;
  }

  public getStatistics() {
    return this.api.get<IApiStatistics>('/statistics');
  }

  public async getLiveRanklistInfo(opts: { uniqueKey: string }): Promise<IApiLiveRanklistInfo> {
    return this.api.get<IApiLiveRanklistInfo>(urlcat('/ranking/config/:uniqueKey', { uniqueKey: opts.uniqueKey, _t: Date.now() }));
  }

  public async getLiveRanklist(opts: { id: string; token?: string }): Promise<srk.Ranklist> {
    return this.api.get<srk.Ranklist>(urlcat('/ranking/:id', { id: opts.id, token: opts.token || undefined, _t: Date.now() }));
  }
}
```

Modify `src/common/rankland-api/index.ts`:

```ts
export * from './exceptions';
export * from './interfaces';
export * from './rankland-api.service';
export * from './request-adapter';
```

- [ ] **Step 4: Run tests**

Run:

```bash
fnm exec --using=16.20.2 pnpm test:unit
```

Expected: RankLand API service tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/common/rankland-api tests/unit/rankland-api.service.spec.ts
git commit -m "feat: add RankLand API service"
```

## Task 3: Add Optional SSR Cache Behavior

**Files:**

- Modify: `src/common/rankland-api/rankland-api.service.ts`
- Modify: `tests/unit/rankland-api.service.spec.ts`

- [ ] **Step 1: Add failing cache tests**

Append tests for:

- `getRanklistInfo` reads `rankland_ssr_api_cache:getRanklistInfo:${uniqueKey}` and returns cached JSON without a network call.
- `getRanklistInfo` writes JSON to cache with TTL `60`.
- `getSrkFile` returns cached parsed JSON when cache contains valid JSON.
- `getSrkFile` deletes broken cached string and refetches.
- `getSrkFile` writes raw JSON to cache with TTL `24 * 60 * 60`.
- `getCollection` caches the raw `content` string with TTL `2 * 60`.

Use this helper:

```ts
function makeCache() {
  return {
    get: vi.fn(),
    setEx: vi.fn(),
    del: vi.fn(),
  };
}
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
fnm exec --using=16.20.2 pnpm test:unit
```

Expected: cache tests fail because the service does not use `cache` yet.

- [ ] **Step 3: Implement cache support**

Modify service methods:

- `getRanklistInfo`: check cache key before CDN request; set JSON string with TTL `60` after request.
- `getSrkFile`: check cache key before CDN request; if cached string JSON parse fails, call `cache.del(cacheKey)` and refetch; after raw response text is parsed, write the raw text with TTL `24 * 60 * 60`.
- `getCollection`: check cache key before CDN request; write raw `content` string with TTL `2 * 60`.

Keep behavior identical when `cache` is not provided.

- [ ] **Step 4: Run tests**

Run:

```bash
fnm exec --using=16.20.2 pnpm test:unit
```

Expected: all unit tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/common/rankland-api/rankland-api.service.ts tests/unit/rankland-api.service.spec.ts
git commit -m "feat: add RankLand API cache support"
```

## Task 4: Add Public Route Builders

**Files:**

- Create: `src/common/rankland-router/routes.ts`
- Create: `src/common/rankland-router/index.ts`
- Create: `tests/unit/rankland-routes.spec.ts`

- [ ] **Step 1: Add failing route tests**

Create `tests/unit/rankland-routes.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ranklandRoutes } from '@common/rankland-router';

describe('ranklandRoutes', () => {
  it('builds static routes', () => {
    expect(ranklandRoutes.home.build()).toBe('/');
    expect(ranklandRoutes.playground.build()).toBe('/playground');
  });

  it('builds encoded search route', () => {
    expect(ranklandRoutes.search.build({ kw: 'hello world' })).toBe('/search?kw=hello%20world');
    expect(ranklandRoutes.search.build({})).toBe('/search');
  });

  it('builds encoded ranklist route with optional focus query', () => {
    expect(ranklandRoutes.ranklist.build({ id: 'abc 123' })).toBe('/ranklist/abc%20123');
    expect(ranklandRoutes.ranklist.build({ id: 'abc', focus: 'yes' })).toBe('/ranklist/abc?focus=yes');
  });

  it('builds collection route with optional rankId', () => {
    expect(ranklandRoutes.collection.build({ id: 'official', rankId: 'test-key' })).toBe('/collection/official?rankId=test-key');
    expect(ranklandRoutes.collection.build({ id: 'official' })).toBe('/collection/official');
  });

  it('builds live route with optional live queries', () => {
    expect(ranklandRoutes.live.build({ id: 'live id' })).toBe('/live/live%20id');
    expect(
      ranklandRoutes.live.build({
        id: 'live id',
        token: 't 0',
        scrollSolution: '1',
        focus: 'yes',
      }),
    ).toBe('/live/live%20id?token=t%200&scrollSolution=1&focus=yes');
  });
});
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
fnm exec --using=16.20.2 pnpm test:unit
```

Expected: fails because `@common/rankland-router` does not exist.

- [ ] **Step 3: Implement route builders**

Create `src/common/rankland-router/routes.ts`:

```ts
function encodePathValue(value: string) {
  return encodeURIComponent(value);
}

function buildQuery(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, value);
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export const ranklandRoutes = {
  home: {
    path: '/',
    ssr: true,
    build: () => '/',
  },
  search: {
    path: '/search',
    ssr: true,
    build: (opts: { kw?: string } = {}) => `/search${buildQuery({ kw: opts.kw })}`,
  },
  ranklist: {
    path: '/ranklist/:id',
    ssr: true,
    build: (opts: { id: string; focus?: string }) => `/ranklist/${encodePathValue(opts.id)}${buildQuery({ focus: opts.focus })}`,
  },
  collection: {
    path: '/collection/:id',
    ssr: true,
    build: (opts: { id: string; rankId?: string }) =>
      `/collection/${encodePathValue(opts.id)}${buildQuery({ rankId: opts.rankId })}`,
  },
  live: {
    path: '/live/:id',
    ssr: false,
    build: (opts: { id: string; token?: string; scrollSolution?: string; focus?: string }) =>
      `/live/${encodePathValue(opts.id)}${buildQuery({
        token: opts.token,
        scrollSolution: opts.scrollSolution,
        focus: opts.focus,
      })}`,
  },
  playground: {
    path: '/playground',
    ssr: false,
    build: () => '/playground',
  },
} as const;
```

Create `src/common/rankland-router/index.ts`:

```ts
export * from './routes';
```

- [ ] **Step 4: Run tests**

Run:

```bash
fnm exec --using=16.20.2 pnpm test:unit
```

Expected: all unit tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/common/rankland-router tests/unit/rankland-routes.spec.ts
git commit -m "feat: add RankLand route builders"
```

## Task 5: Verify API Routing Slice Gate

**Files:**

- No expected source changes.

- [ ] **Step 1: Run build**

Run:

```bash
fnm exec --using=16.20.2 pnpm run build
```

Expected: build passes.

- [ ] **Step 2: Run unit tests**

Run:

```bash
fnm exec --using=16.20.2 pnpm test:unit
```

Expected: API service and route builder tests pass.

- [ ] **Step 3: Run full migration gate**

Run:

```bash
fnm exec --using=16.20.2 pnpm test:migration
```

Expected: build, unit, SSR, and E2E pass.

- [ ] **Step 4: Check dependency policy**

Run:

```bash
rg -n "\"msw\"|@inquirer/external-editor|engines: \\{node: '>=18'\\}" package.json pnpm-lock.yaml src/common/rankland-api tests/unit
```

Expected: no forbidden new Node 18-only dependency from this slice.

- [ ] **Step 5: Check working tree**

Run:

```bash
git status --short --branch
```

Expected: branch `migration/vue-api-routing`, clean working tree.

If all gates pass and no source changes were needed, do not create a commit for this task. Record the passing commands in the task final response.

## Self-Review Checklist

- Spec coverage: API service, route contracts, cache, errors, tests, Node policy, and full-chain E2E follow-up are covered.
- Scope boundary: no page UI migration, no SRK renderer integration, no Node runtime upgrade.
- Test path: all new tests run through `pnpm test:unit`, and the slice closes with `pnpm test:migration`.
- Dependency policy: no new runtime dependency is required for this slice.
