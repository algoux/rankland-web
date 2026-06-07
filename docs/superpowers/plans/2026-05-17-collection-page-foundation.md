# Collection Page Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/collection/:id` SSR foundation route with collection navigation, selected ranklist rendering, invalid `rankId` handling, metadata, and full-chain E2E coverage.

**Architecture:** Add framework-neutral collection helpers, a typed collection route prop object, a recursive Vue navigation item component, and a thin SSR collection page. Reuse `RanklandApiService`, `ranklandRoutes.collection`, and `RanklandRanklist`; generated router files are updated only by `pnpm run gen:client-router`.

**Tech Stack:** Vue 3, bwcx-client-vue3 route views, vite-ssr async data, Vitest, Playwright full-chain E2E, RankLand API service.

---

## File Structure

- Create `src/client/modules/collection/collection-tree.ts`: collection id aliasing and collection tree traversal helpers.
- Create `src/client/modules/collection/collection-error.ts`: classify collection-level and selected-ranklist load errors.
- Create `src/common/modules/collection/collection.rpo.ts`: typed path param for `/collection/:id`.
- Create `src/client/modules/collection/collection-tree-item.vue`: recursive SSR-safe collection tree item.
- Create `src/client/modules/collection/collection.view.vue`: SSR route page, async data, metadata, invalid `rankId` replacement, simple layout.
- Modify generated files by command only:
  - `src/client/router/routes.ts`
  - `src/client/router/types.d.ts`
  - `src/common/router/client-routes.ts`
- Modify `tests/unit/client-routes.spec.ts`: assert generated collection route uses `CollectionRPO`.
- Modify `tests/unit/e2e-client-routes.spec.ts`: assert server route map exposes collection as SSR.
- Create `tests/unit/collection-tree.spec.ts`: helper coverage.
- Create `tests/unit/collection-error.spec.ts`: error classifier coverage.
- Create `tests/e2e/full-chain/collection.spec.ts`: full-chain route coverage.

## Task 1: Collection Helpers

**Files:**
- Create: `src/client/modules/collection/collection-tree.ts`
- Create: `src/client/modules/collection/collection-error.ts`
- Create: `tests/unit/collection-tree.spec.ts`
- Create: `tests/unit/collection-error.spec.ts`

- [ ] **Step 1: Write failing collection tree tests**

Create `tests/unit/collection-tree.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import collection from '../fixtures/collection.json';
import {
  getAncestorDirectoryKeys,
  getFlatRanklistUniqueKeys,
  isRanklistInCollection,
  normalizeCollectionId,
} from '@client/modules/collection/collection-tree';
import type { IApiCollection } from '@common/rankland-api';

const fixtureCollection = collection as IApiCollection;

describe('collection-tree helpers', () => {
  it('normalizes public collection aliases', () => {
    expect(normalizeCollectionId('official')).toBe('official');
    expect(normalizeCollectionId('由官方整理和维护的')).toBe('official');
    expect(normalizeCollectionId('custom')).toBe('custom');
  });

  it('collects ranklist keys from nested collection items', () => {
    expect(getFlatRanklistUniqueKeys(fixtureCollection)).toEqual(['test-key', 'another-key']);
  });

  it('detects whether a ranklist belongs to the collection', () => {
    expect(isRanklistInCollection(fixtureCollection, 'test-key')).toBe(true);
    expect(isRanklistInCollection(fixtureCollection, 'missing-key')).toBe(false);
  });

  it('returns ancestor directory keys for a selected ranklist', () => {
    expect(getAncestorDirectoryKeys(fixtureCollection, 'test-key')).toEqual(['dir-icpc']);
    expect(getAncestorDirectoryKeys(fixtureCollection, 'missing-key')).toEqual([]);
  });
});
```

- [ ] **Step 2: Write failing collection error tests**

Create `tests/unit/collection-error.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { RanklandLogicException, RanklandLogicExceptionKind } from '@common/rankland-api';
import {
  classifyCollectionLoadError,
  classifySelectedRanklistLoadError,
} from '@client/modules/collection/collection-error';

describe('collection-error helpers', () => {
  it('classifies collection not found logic exceptions', () => {
    expect(classifyCollectionLoadError(new RanklandLogicException(RanklandLogicExceptionKind.NotFound))).toEqual({
      kind: 'not-found',
      message: 'Collection Not Found',
    });
  });

  it('classifies generic collection load errors', () => {
    expect(classifyCollectionLoadError(new Error('boom'))).toEqual({
      kind: 'generic',
      message: 'An error occurred while loading data',
    });
  });

  it('classifies selected ranklist load errors as content-level errors', () => {
    expect(classifySelectedRanklistLoadError(new Error('ranklist failed'))).toEqual({
      kind: 'ranklist-error',
      message: 'An error occurred while loading data',
    });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
pnpm test:unit -- tests/unit/collection-tree.spec.ts tests/unit/collection-error.spec.ts
```

Expected: FAIL because `@client/modules/collection/collection-tree` and `collection-error` do not exist.

- [ ] **Step 4: Implement collection tree helpers**

Create `src/client/modules/collection/collection-tree.ts`:

```ts
import { CollectionItemType, type IApiCollection, type IApiCollectionItem } from '@common/rankland-api';

const COLLECTION_ID_TRANSLATIONS: Record<string, string> = {
  official: 'official',
  由官方整理和维护的: 'official',
};

export function normalizeCollectionId(id: string): string {
  return COLLECTION_ID_TRANSLATIONS[id] || id;
}

export function getFlatRanklistUniqueKeys(collection: IApiCollection): string[] {
  const visit = (item: IApiCollectionItem): string[] => {
    if (item.type === CollectionItemType.Directory) {
      return (item.children || []).flatMap(visit);
    }

    return [item.uniqueKey];
  };

  return collection.root.children.flatMap(visit);
}

export function isRanklistInCollection(collection: IApiCollection, rankId: string): boolean {
  return getFlatRanklistUniqueKeys(collection).includes(rankId);
}

export function getAncestorDirectoryKeys(collection: IApiCollection, rankId: string): string[] {
  const walk = (item: IApiCollectionItem): string[] | undefined => {
    if (item.type !== CollectionItemType.Directory) {
      return item.uniqueKey === rankId ? [] : undefined;
    }

    for (const child of item.children || []) {
      const childPath = walk(child);
      if (childPath) {
        return [item.uniqueKey, ...childPath];
      }
    }

    return undefined;
  };

  for (const child of collection.root.children) {
    const path = walk(child);
    if (path) {
      return path;
    }
  }

  return [];
}
```

- [ ] **Step 5: Implement collection error helpers**

Create `src/client/modules/collection/collection-error.ts`:

```ts
import { RanklandLogicException, RanklandLogicExceptionKind } from '@common/rankland-api';

export type CollectionLoadErrorKind = 'not-found' | 'generic';

export interface CollectionLoadErrorState {
  kind: CollectionLoadErrorKind;
  message: string;
}

export interface SelectedRanklistLoadErrorState {
  kind: 'ranklist-error';
  message: string;
}

export function classifyCollectionLoadError(error: unknown): CollectionLoadErrorState {
  if (error instanceof RanklandLogicException && error.kind === RanklandLogicExceptionKind.NotFound) {
    return {
      kind: 'not-found',
      message: 'Collection Not Found',
    };
  }

  return {
    kind: 'generic',
    message: 'An error occurred while loading data',
  };
}

export function classifySelectedRanklistLoadError(error: unknown): SelectedRanklistLoadErrorState {
  return {
    kind: 'ranklist-error',
    message: 'An error occurred while loading data',
  };
}
```

- [ ] **Step 6: Run helper tests**

Run:

```bash
pnpm test:unit -- tests/unit/collection-tree.spec.ts tests/unit/collection-error.spec.ts
```

Expected: PASS for both new spec files.

- [ ] **Step 7: Commit helper work**

Run:

```bash
git add src/client/modules/collection/collection-tree.ts src/client/modules/collection/collection-error.ts tests/unit/collection-tree.spec.ts tests/unit/collection-error.spec.ts
git commit -m "test: 补充合集页辅助逻辑覆盖"
```

## Task 2: Collection SSR Route

**Files:**
- Create: `src/common/modules/collection/collection.rpo.ts`
- Create: `src/client/modules/collection/collection-tree-item.vue`
- Create: `src/client/modules/collection/collection.view.vue`
- Modify by generation: `src/client/router/routes.ts`
- Modify by generation: `src/client/router/types.d.ts`
- Modify by generation: `src/common/router/client-routes.ts`

- [ ] **Step 1: Create route props**

Create `src/common/modules/collection/collection.rpo.ts`:

```ts
import { BaseType, InParam } from 'bwcx-client-vue';

export class CollectionRPO {
  @InParam()
  @BaseType(String)
  public id: string;
}
```

- [ ] **Step 2: Create recursive collection tree item**

Create `src/client/modules/collection/collection-tree-item.vue`:

```vue
<template>
  <li class="collection-tree-item">
    <div
      v-if="isDirectory"
      class="collection-tree-directory"
      :data-id="itemDataId"
      :data-collection-key="item.uniqueKey"
      :data-open="isOpen ? 'true' : 'false'"
    >
      <span>{{ item.name }}</span>
      <ul v-if="children.length > 0" class="collection-tree-children">
        <CollectionTreeItem
          v-for="child in children"
          :key="child.uniqueKey"
          :item="child"
          :collection-id="collectionId"
          :current-rank-id="currentRankId"
          :open-keys="openKeys"
        />
      </ul>
    </div>

    <router-link
      v-else
      class="collection-tree-ranklist"
      :class="{ 'is-selected': isSelected }"
      :to="itemUrl"
      :data-id="itemDataId"
      :data-collection-key="item.uniqueKey"
      :aria-current="isSelected ? 'page' : undefined"
    >
      {{ item.name }}
    </router-link>
  </li>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { CollectionItemType, type IApiCollectionItem } from '@common/rankland-api';
import { ranklandRoutes } from '@common/rankland-router';

export default defineComponent({
  name: 'CollectionTreeItem',
  props: {
    item: {
      type: Object as PropType<IApiCollectionItem>,
      required: true,
    },
    collectionId: {
      type: String,
      required: true,
    },
    currentRankId: {
      type: String,
      required: false,
    },
    openKeys: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
  },
  computed: {
    isDirectory(): boolean {
      return this.item.type === CollectionItemType.Directory;
    },
    children(): IApiCollectionItem[] {
      return this.item.children || [];
    },
    itemDataId(): string {
      return `collection-menu-item-${this.item.uniqueKey}`;
    },
    isSelected(): boolean {
      return this.currentRankId === this.item.uniqueKey;
    },
    isOpen(): boolean {
      return this.openKeys.includes(this.item.uniqueKey);
    },
    itemUrl(): string {
      return ranklandRoutes.collection.build({
        id: this.collectionId,
        rankId: this.item.uniqueKey,
      });
    },
  },
});
</script>

<style lang="less" scoped>
.collection-tree-item {
  list-style: none;
}

.collection-tree-directory,
.collection-tree-ranklist {
  display: block;
  padding: 6px 8px;
  color: inherit;
  text-decoration: none;
}

.collection-tree-directory {
  font-weight: 600;
}

.collection-tree-children {
  margin: 4px 0 4px 12px;
  padding: 0;
}

.collection-tree-ranklist.is-selected {
  background: #e6f4ff;
  color: #0958d9;
}
</style>
```

- [ ] **Step 3: Create collection route view**

Create `src/client/modules/collection/collection.view.vue`:

```vue
<template>
  <main>
    <Head>
      <title>{{ pageTitle }}</title>
      <meta property="og:title" :content="pageTitle">
      <meta property="og:url" :content="canonicalUrl">
      <link rel="canonical" :href="canonicalUrl">
    </Head>

    <section v-if="isNotFound" data-id="collection-not-found" class="collection-state">
      <h1>Collection Not Found</h1>
      <router-link to="/" data-id="collection-not-found-home-link">Back to Home</router-link>
    </section>

    <section v-else-if="hasCollectionError" data-id="collection-error" class="collection-state">
      <p>{{ collectionLoadError?.message }}</p>
      <button type="button" @click="refresh">Refresh</button>
    </section>

    <section v-else-if="!collection" data-id="collection-loading" class="collection-state">
      Loading
    </section>

    <section
      v-else
      data-id="collection-content"
      class="collection-page"
      :class="{ 'is-nav-collapsed': collapsed }"
    >
      <aside data-id="collection-nav" class="collection-nav">
        <button type="button" class="collection-collapse-button" @click="toggleCollapsed">
          {{ collapsed ? '展开' : '折叠' }}
        </button>
        <ul class="collection-tree">
          <CollectionTreeItem
            v-for="item in collection.root.children"
            :key="item.uniqueKey"
            :item="item"
            :collection-id="id"
            :current-rank-id="rankId"
            :open-keys="openKeys"
          />
        </ul>
      </aside>

      <section class="collection-ranklist-panel">
        <div data-id="collection-hydrated">{{ hydrated ? 'hydrated' : 'ssr' }}</div>

        <div v-if="ranklistLoadError" data-id="collection-ranklist-error" class="collection-state">
          <p>{{ ranklistLoadError.message }}</p>
          <button type="button" @click="refresh">Refresh</button>
        </div>

        <div v-else-if="ranklistMismatch" data-id="collection-ranklist-loading" class="collection-state">
          Loading
        </div>

        <div
          v-else-if="ranklist"
          data-id="collection-ranklist-content"
          :data-ranklist-id="rankId"
          :data-row-count="rowCount"
        >
          <h1>{{ ranklist.info.name }}</h1>
          <RanklandRanklist :ranklist="ranklist.srk" />
        </div>

        <div v-else data-id="collection-empty-state" class="collection-empty-state">
          <h1>请展开左侧边栏并选择一个榜单</h1>
        </div>
      </section>
    </section>
  </main>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { routeView, RenderMethodKind } from 'bwcx-client-vue3';
import type { IApiCollection, IApiRanklist } from '@common/rankland-api';
import { CollectionRPO } from '@common/modules/collection/collection.rpo';
import { ranklandRoutes } from '@common/rankland-router';
import type { AsyncDataOptions } from '@client/typings';
import { formatTitle } from '@client/utils/title-format.util';
import RanklandRanklist from '@client/components/rankland-ranklist.vue';
import CollectionTreeItem from './collection-tree-item.vue';
import {
  getAncestorDirectoryKeys,
  isRanklistInCollection,
  normalizeCollectionId,
} from './collection-tree';
import {
  classifyCollectionLoadError,
  classifySelectedRanklistLoadError,
  type CollectionLoadErrorState,
  type SelectedRanklistLoadErrorState,
} from './collection-error';

const COLLAPSED_STORAGE_KEY = 'CollectionNavCollapsed';

const CollectionPage = defineComponent({
  name: 'Collection',
  components: {
    CollectionTreeItem,
    RanklandRanklist,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
    collection: {
      type: Object as PropType<IApiCollection>,
      required: false,
    },
    ranklist: {
      type: Object as PropType<IApiRanklist>,
      required: false,
    },
    collectionLoadError: {
      type: Object as PropType<CollectionLoadErrorState>,
      required: false,
    },
    ranklistLoadError: {
      type: Object as PropType<SelectedRanklistLoadErrorState>,
      required: false,
    },
    ranklistIdInvalid: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      collapsed: false,
      hydrated: false,
    };
  },
  computed: {
    rankId(): string | undefined {
      const value = this.$route.query.rankId;
      return typeof value === 'string' ? value : undefined;
    },
    openKeys(): string[] {
      if (!this.collection || !this.rankId || this.ranklistIdInvalid) {
        return [];
      }

      return getAncestorDirectoryKeys(this.collection, this.rankId);
    },
    rowCount(): number {
      return this.ranklist?.srk?.rows?.length || 0;
    },
    isNotFound(): boolean {
      return this.collectionLoadError?.kind === 'not-found';
    },
    hasCollectionError(): boolean {
      return this.collectionLoadError?.kind === 'generic';
    },
    ranklistMismatch(): boolean {
      return Boolean(this.ranklist && this.rankId && this.ranklist.info.uniqueKey !== this.rankId);
    },
    pageTitle(): string {
      if (this.isNotFound) {
        return formatTitle('Not Found');
      }

      if (this.hasCollectionError) {
        return formatTitle();
      }

      if (this.ranklist) {
        return formatTitle(`${this.ranklist.info.name} - 榜单合集`);
      }

      return formatTitle('榜单合集');
    },
    canonicalUrl(): string {
      return ranklandRoutes.collection.build({
        id: this.id,
        rankId: this.rankId && !this.ranklistIdInvalid ? this.rankId : undefined,
      });
    },
  },
  mounted() {
    this.hydrated = true;
    this.collapsed = window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true';

    if (this.ranklistIdInvalid) {
      this.$router.replace(ranklandRoutes.collection.build({ id: this.id }));
    }
  },
  methods: {
    refresh() {
      window.location.reload();
    },
    toggleCollapsed() {
      this.collapsed = !this.collapsed;
      window.localStorage.setItem(COLLAPSED_STORAGE_KEY, String(this.collapsed));
    },
  },
  async asyncData({ ranklandApiService, to }: AsyncDataOptions) {
    const id = String(to.params.id);
    const rankId = typeof to.query.rankId === 'string' ? to.query.rankId : undefined;
    const realId = normalizeCollectionId(id);

    try {
      const collection = await ranklandApiService.getCollection({ uniqueKey: realId });
      let ranklist: IApiRanklist | undefined;
      let ranklistLoadError: SelectedRanklistLoadErrorState | undefined;
      let ranklistIdInvalid = false;

      if (rankId) {
        if (isRanklistInCollection(collection, rankId)) {
          try {
            ranklist = await ranklandApiService.getRanklist({ uniqueKey: rankId });
          } catch (error) {
            ranklistLoadError = classifySelectedRanklistLoadError(error);
          }
        } else {
          ranklistIdInvalid = true;
        }
      }

      return {
        collection,
        ranklist,
        collectionLoadError: undefined,
        ranklistLoadError,
        ranklistIdInvalid,
      };
    } catch (error) {
      return {
        collection: undefined,
        ranklist: undefined,
        collectionLoadError: classifyCollectionLoadError(error),
        ranklistLoadError: undefined,
        ranklistIdInvalid: false,
      };
    }
  },
});

export default routeView(CollectionPage, '/collection/:id', CollectionRPO, undefined, {
  renderMethod: RenderMethodKind.SSR,
});
</script>

<style lang="less" scoped>
.collection-page {
  display: grid;
  grid-template-columns: minmax(220px, 300px) minmax(0, 1fr);
  min-height: 70vh;
}

.collection-page.is-nav-collapsed {
  grid-template-columns: 72px minmax(0, 1fr);
}

.collection-nav {
  border-right: 1px solid #d9d9d9;
  background: #f7f7f7;
  overflow-x: hidden;
}

.collection-collapse-button {
  width: 100%;
  padding: 8px;
  border: 0;
  border-bottom: 1px solid #d9d9d9;
  background: #ffffff;
  cursor: pointer;
}

.collection-tree {
  margin: 0;
  padding: 8px;
}

.collection-ranklist-panel {
  min-width: 0;
  padding: 16px;
}

.collection-state,
.collection-empty-state {
  padding: 64px 16px;
  text-align: center;
}

@media (max-width: 640px) {
  .collection-page {
    grid-template-columns: 1fr;
  }

  .collection-nav {
    border-right: 0;
    border-bottom: 1px solid #d9d9d9;
  }
}
</style>
```

- [ ] **Step 4: Generate client router files**

Run:

```bash
pnpm run gen:client-router
```

Expected: PASS. Generated files include a `Collection` route with path `/collection/:id`, route props `CollectionRPO`, and SSR render method.

- [ ] **Step 5: Inspect generated router output**

Run:

```bash
rg -n "Collection|collection" src/client/router/routes.ts src/client/router/types.d.ts src/common/router/client-routes.ts
```

Expected output includes:

```text
src/client/router/routes.ts:... import { CollectionRPO } from '../../common/modules/collection/collection.rpo';
src/client/router/routes.ts:... name: 'Collection'
src/client/router/routes.ts:... path: '/collection/:id'
src/common/router/client-routes.ts:... ['Collection', { path: '/collection/:id', routeProps: CollectionRPO, renderMethod: RenderMethodKind.SSR }]
src/client/router/types.d.ts:... to(target: 'Collection'): BwcxVueRouterActions<R.CollectionRPO>;
```

- [ ] **Step 6: Run a narrow build check**

Run:

```bash
pnpm test:unit -- tests/unit/client-routes.spec.ts
```

Expected: existing tests may still pass before route assertions are updated. Type or SFC syntax failures must be fixed before continuing.

- [ ] **Step 7: Commit route implementation**

Run:

```bash
git add src/common/modules/collection/collection.rpo.ts src/client/modules/collection/collection-tree-item.vue src/client/modules/collection/collection.view.vue src/client/router/routes.ts src/client/router/types.d.ts src/common/router/client-routes.ts
git commit -m "feat: 迁移合集页基础视图"
```

## Task 3: Generated Route Tests

**Files:**
- Modify: `tests/unit/client-routes.spec.ts`
- Modify: `tests/unit/e2e-client-routes.spec.ts`

- [ ] **Step 1: Update client route unit test imports and assertions**

Modify `tests/unit/client-routes.spec.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('client routes', () => {
  const originalProbe = process.env.RANKLAND_E2E_PROBE;

  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('bwcx-client-vue3');

    if (originalProbe === undefined) {
      delete process.env.RANKLAND_E2E_PROBE;
    } else {
      process.env.RANKLAND_E2E_PROBE = originalProbe;
    }
  });

  it('does not add the probe route when the probe is disabled', async () => {
    delete process.env.RANKLAND_E2E_PROBE;

    const routes = (await import('@client/routes')).default;
    const ranklistRoute = routes.find((route) => route.name === 'Ranklist');
    const collectionRoute = routes.find((route) => route.name === 'Collection');

    expect(routes.some((route) => route.name === 'E2eRanklandProbe')).toBe(false);
    expect(routes.some((route) => route.path === '/__e2e/rankland-probe/:id')).toBe(false);
    expect(ranklistRoute).toMatchObject({
      path: '/ranklist/:id',
    });
    expect(collectionRoute).toMatchObject({
      path: '/collection/:id',
    });
  });

  it('generates public RankLand routes with typed route props', async () => {
    vi.doMock('bwcx-client-vue3', async () => {
      const actual = await vi.importActual<typeof import('bwcx-client-vue3')>('bwcx-client-vue3');

      return {
        ...actual,
        parseRoutes: vi.fn((routes) => routes),
      };
    });

    const routes = (await import('@client/router/routes')).default as Array<{ name: string; routeProps?: unknown }>;
    const { RanklistRPO } = await import('@common/modules/ranklist/ranklist.rpo');
    const { CollectionRPO } = await import('@common/modules/collection/collection.rpo');
    const ranklistRoute = routes.find((route) => route.name === 'Ranklist');
    const collectionRoute = routes.find((route) => route.name === 'Collection');

    expect(ranklistRoute?.routeProps).toBe(RanklistRPO);
    expect(collectionRoute?.routeProps).toBe(CollectionRPO);
  });

  it('adds the probe route with the expected path when the probe is enabled', async () => {
    process.env.RANKLAND_E2E_PROBE = '1';

    const routes = (await import('@client/routes')).default;
    const probeRoute = routes.find((route) => route.name === 'E2eRanklandProbe');

    expect(probeRoute).toMatchObject({
      path: '/__e2e/rankland-probe/:id',
    });
  });
});
```

- [ ] **Step 2: Update server route map unit test imports and assertions**

Modify `tests/unit/e2e-client-routes.spec.ts`:

```ts
import { afterEach, describe, expect, it } from 'vitest';
import { RenderMethodKind } from 'bwcx-client-vue/enums';
import { getClientRoutesMapForServer } from '@common/router/e2e-client-routes';
import { clientRoutesMap } from '@common/router/client-routes';
import { CollectionRPO } from '@common/modules/collection/collection.rpo';
import { RanklistRPO } from '@common/modules/ranklist/ranklist.rpo';

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

  it('exposes migrated public routes as SSR', () => {
    delete process.env.RANKLAND_E2E_PROBE;

    const routes = getClientRoutesMapForServer();

    expect(routes.get('Ranklist')).toEqual({
      path: '/ranklist/:id',
      routeProps: RanklistRPO,
      renderMethod: RenderMethodKind.SSR,
    });
    expect(routes.get('Collection')).toEqual({
      path: '/collection/:id',
      routeProps: CollectionRPO,
      renderMethod: RenderMethodKind.SSR,
    });
  });

  it('does not expose the probe route for non-1 values', () => {
    process.env.RANKLAND_E2E_PROBE = 'true';

    const routes = getClientRoutesMapForServer();

    expect(routes.has('E2eRanklandProbe')).toBe(false);
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

  it('keeps the base client routes map isolated when adding the probe route', () => {
    process.env.RANKLAND_E2E_PROBE = '1';

    const routes = getClientRoutesMapForServer();

    expect(routes).not.toBe(clientRoutesMap);
    expect(routes.has('E2eRanklandProbe')).toBe(true);
    expect(clientRoutesMap.has('E2eRanklandProbe')).toBe(false);
  });
});
```

- [ ] **Step 3: Run route tests**

Run:

```bash
pnpm test:unit -- tests/unit/client-routes.spec.ts tests/unit/e2e-client-routes.spec.ts
```

Expected: PASS.

- [ ] **Step 4: Commit route test coverage**

Run:

```bash
git add tests/unit/client-routes.spec.ts tests/unit/e2e-client-routes.spec.ts
git commit -m "test: 补充合集页路由生成覆盖"
```

## Task 4: Full-Chain Collection E2E

**Files:**
- Create: `tests/e2e/full-chain/collection.spec.ts`

- [ ] **Step 1: Write full-chain collection tests**

Create `tests/e2e/full-chain/collection.spec.ts`:

```ts
import { expect, test } from '@playwright/test';
import { denyExternalCalls } from '../helpers/mock-api';

const mockPort = process.env.FULL_CHAIN_MOCK_PORT || '3101';
const mockBaseURL = `http://127.0.0.1:${mockPort}`;

test.describe('/collection/:id full-chain route', () => {
  test('renders selected ranklist through SSR, hydration, RanklandApiService, and the mock backend', async ({
    page,
    request,
  }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/collection/official?rankId=test-key');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    expect(await response!.text()).toContain('Test Contest 2024');
    await expect(page).toHaveTitle('Test Contest 2024 - 榜单合集 - RankLand');
    await expect(page.locator('[data-id="collection-nav"]')).toBeVisible();
    await expect(
      page.locator('[data-id="collection-ranklist-content"][data-ranklist-id="test-key"][data-row-count="2"]'),
    ).toBeVisible();
    await expect(page.locator('[data-id="collection-menu-item-test-key"][data-collection-key="test-key"]')).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByText('Team Alpha')).toBeVisible();
    await expect(page.getByText('Team Beta')).toBeVisible();
    await expect(page.locator('[data-id="collection-hydrated"]')).toHaveText('hydrated');

    const requestsResponse = await request.get(`${mockBaseURL}/__requests`);
    const requests = (await requestsResponse.json()) as Array<{ path: string; search: string }>;
    const collectionRequests = requests.filter((requestRecord) => requestRecord.path === '/rank/group/official');
    const rankRequests = requests.filter((requestRecord) => requestRecord.path === '/rank/test-key');
    const srkFileRequests = requests.filter(
      (requestRecord) =>
        requestRecord.path === '/file/download' &&
        new URLSearchParams(requestRecord.search).get('id') === 'file-test-1',
    );

    expect(collectionRequests).toHaveLength(1);
    expect(rankRequests).toHaveLength(1);
    expect(srkFileRequests).toHaveLength(1);
  });

  test('renders collection empty state when no rankId is selected', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/collection/official');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle('榜单合集 - RankLand');
    await expect(page.locator('[data-id="collection-nav"]')).toBeVisible();
    await expect(page.locator('[data-id="collection-empty-state"]')).toBeVisible();
    await expect(page.locator('[data-id="collection-hydrated"]')).toHaveText('hydrated');

    const requestsResponse = await request.get(`${mockBaseURL}/__requests`);
    const requests = (await requestsResponse.json()) as Array<{ path: string }>;
    const collectionRequests = requests.filter((requestRecord) => requestRecord.path === '/rank/group/official');
    const rankRequests = requests.filter((requestRecord) => requestRecord.path === '/rank/test-key');

    expect(collectionRequests).toHaveLength(1);
    expect(rankRequests).toHaveLength(0);
  });

  test('replaces invalid rankId without requesting missing ranklist data', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/collection/official?rankId=missing-key');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveURL('/collection/official');
    await expect(page.locator('[data-id="collection-empty-state"]')).toBeVisible();

    const requestsResponse = await request.get(`${mockBaseURL}/__requests`);
    const requests = (await requestsResponse.json()) as Array<{ path: string }>;
    const collectionRequests = requests.filter((requestRecord) => requestRecord.path === '/rank/group/official');
    const missingRankRequests = requests.filter((requestRecord) => requestRecord.path === '/rank/missing-key');

    expect(collectionRequests).toHaveLength(1);
    expect(missingRankRequests).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run full-chain collection tests**

Run:

```bash
pnpm test:e2e:full-chain -- tests/e2e/full-chain/collection.spec.ts
```

Expected: PASS. If the first test fails on duplicate backend requests, inspect whether SSR and hydration both fetched data. Fix the route async-data first so hydration reuses initial SSR state before changing test expectations.

- [ ] **Step 3: Commit full-chain coverage**

Run:

```bash
git add tests/e2e/full-chain/collection.spec.ts
git commit -m "test: 补充合集页全链路覆盖"
```

## Task 5: Final Verification And Fixes

**Files:**
- Modify only files already introduced by this plan if verification reveals issues.

- [ ] **Step 1: Run all unit tests**

Run:

```bash
pnpm test:unit
```

Expected: PASS.

- [ ] **Step 2: Run SSR tests**

Run:

```bash
pnpm test:ssr
```

Expected: PASS.

- [ ] **Step 3: Run normal Playwright tests**

Run:

```bash
pnpm test:e2e
```

Expected: PASS.

- [ ] **Step 4: Run full-chain Playwright tests**

Run:

```bash
pnpm test:e2e:full-chain
```

Expected: PASS for both existing ranklist coverage and new collection coverage.

- [ ] **Step 5: Run migration acceptance**

Run:

```bash
pnpm test:migration
```

Expected: PASS.

- [ ] **Step 6: Inspect changed files**

Run:

```bash
git status --short
git diff --stat HEAD
git diff --check
```

Expected:

- `git status --short` shows only intended files if any final fixes remain uncommitted.
- `git diff --check` reports no whitespace errors.

- [ ] **Step 7: Commit final fixes if needed**

If verification required fixes, commit only those fixes:

```bash
git add <fixed-files>
git commit -m "fix: 修复合集页迁移验收问题"
```

If there are no fixes after Task 4, do not create an empty commit.

## Self-Review Checklist

- Spec coverage: tasks cover SSR route, alias mapping, collection tree helpers, invalid `rankId`, selected ranklist rendering, metadata, route generation, unit tests, full-chain E2E, and migration verification.
- Placeholder scan: this plan contains no deferred implementation slots or cross-task shorthand instructions.
- Type consistency: `CollectionRPO`, `CollectionTreeItem`, `CollectionLoadErrorState`, `SelectedRanklistLoadErrorState`, `normalizeCollectionId`, `getAncestorDirectoryKeys`, and `isRanklistInCollection` use the same names across tests, implementation, and route code.
