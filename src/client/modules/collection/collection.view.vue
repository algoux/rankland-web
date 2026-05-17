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

interface CollectionAsyncDataState {
  collection?: IApiCollection;
  ranklist?: IApiRanklist;
  collectionLoadError?: CollectionLoadErrorState;
  ranklistLoadError?: SelectedRanklistLoadErrorState;
  ranklistIdInvalid?: boolean;
}

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
  async asyncData({ ranklandApiService, to, from }: AsyncDataOptions) {
    const id = String(to.params.id);
    const rankId = typeof to.query.rankId === 'string' ? to.query.rankId : undefined;
    const realId = normalizeCollectionId(id);
    const previousState = from.meta.state as CollectionAsyncDataState | undefined;

    // 同一合集内清理 rankId 时复用已有合集数据，避免 hydration 后重复请求合集接口。
    if (!rankId && String(from.params.id) === id && previousState?.collection && !previousState.collectionLoadError) {
      return {
        collection: previousState.collection,
        ranklist: undefined,
        collectionLoadError: undefined,
        ranklistLoadError: undefined,
        ranklistIdInvalid: false,
      };
    }

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
  overflow-x: hidden;
  border-right: 1px solid #d9d9d9;
  background: #f7f7f7;
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
