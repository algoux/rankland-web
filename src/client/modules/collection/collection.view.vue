<template>
  <main>
    <Head>
      <title>{{ pageTitle }}</title>
      <meta property="og:title" :content="pageTitle">
      <meta property="og:url" :content="canonicalUrl">
      <link rel="canonical" :href="canonicalUrl">
    </Head>

    <section v-if="isNotFound" data-id="collection-not-found" class="collection-state">
      <h3>Collection Not Found</h3>
      <router-link to="/" data-id="collection-not-found-home-link">
        <a-button type="primary" size="small">Back to Home</a-button>
      </router-link>
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
      :class="{ 'is-nav-collapsed': collapsed, 'is-mobile-layout': isMobileLayout }"
    >
      <aside
        data-id="collection-nav"
        class="collection-nav"
        :data-nav-width="navWidth"
        :data-remaining-height="remainingHeight"
        :style="navStyle"
      >
        <a-button
          data-id="collection-collapse-button"
          class="collection-collapse-button"
          size="large"
          :style="collapseButtonStyle"
          @click="toggleCollapsed"
        >
          <span v-if="collapsed" class="anticon anticon-menu-unfold" aria-hidden="true">
            <svg viewBox="0 0 1024 1024" focusable="false" aria-hidden="true">
              <path d="M112 192h800v96H112zM112 468h480v88H112zM112 736h800v96H112zM704 384l192 128-192 128z" />
            </svg>
          </span>
          <template v-else>
            <span class="anticon anticon-menu-fold" aria-hidden="true">
              <svg viewBox="0 0 1024 1024" focusable="false" aria-hidden="true">
                <path d="M112 192h800v96H112zM432 468h480v88H432zM112 736h800v96H112zM320 384 128 512l192 128z" />
              </svg>
            </span>
            <span>折叠</span>
          </template>
        </a-button>

        <ClientOnly>
          <a-menu
            data-id="collection-nav-menu"
            class="srk-collection-nav-menu"
            mode="inline"
            :items="menuItems"
            :inline-collapsed="collapsed"
            :open-keys="collapsed ? [] : openKeys"
            :selected-keys="selectedMenuKeys"
            :style="menuStyle"
            @click="handleMenuClick"
          />
        </ClientOnly>
      </aside>

      <div class="collection-hidden-header" :style="hiddenHeaderStyle">
        <img :src="logo" alt="RankLand" width="32" height="32">
        <h2>榜单合集</h2>
      </div>

      <section
        data-id="collection-ranklist-panel"
        class="collection-ranklist-panel"
        :style="ranklistPanelStyle"
      >
        <div data-id="collection-hydrated">{{ hydrated ? 'hydrated' : 'ssr' }}</div>

        <div v-if="ranklistLoadError" data-id="collection-ranklist-error" class="collection-state">
          <p>{{ ranklistLoadError.message }}</p>
          <button type="button" @click="refresh">Refresh</button>
        </div>

        <div
          v-else-if="ranklist"
          data-id="collection-ranklist-content"
          class="collection-ranklist-content"
          :data-ranklist-id="rankId"
          :data-row-count="rowCount"
        >
          <RanklandRanklist
            v-if="!renderSwitchLock"
            :ranklist="ranklist.srk"
            :name="rankId"
            :id="rankId"
            :meta="ranklist.info"
            show-header
            show-filter
            show-progress
            show-footer
          />
        </div>

        <div v-else data-id="collection-empty-state" class="collection-empty-state">
          <h3>请展开左侧边栏并选择一个榜单</h3>
        </div>
      </section>
    </section>
  </main>
</template>

<script lang="ts">
import { defineComponent, h, type PropType } from 'vue';
import { routeView, RenderMethodKind } from 'bwcx-client-vue3';
import type { ItemType } from 'ant-design-vue/es/menu';
import type { IApiCollection, IApiRanklist } from '@common/rankland-api';
import { CollectionItemType, type IApiCollectionItem } from '@common/rankland-api';
import { CollectionRPO } from '@common/modules/collection/collection.rpo';
import { ranklandRoutes } from '@common/rankland-router';
import type { AsyncDataOptions } from '@client/typings';
import { formatTitle } from '@client/utils/title-format.util';
import RanklandRanklist from '@client/components/rankland-ranklist.vue';
import logo from '@client/assets/logo.png';
import {
  getAncestorDirectoryKeys,
  isRanklistInCollection,
  normalizeCollectionId,
} from './collection-tree';
import { getCollectionCategoryIcon } from './collection-category-icons';
import {
  classifyCollectionLoadError,
  classifySelectedRanklistLoadError,
  type CollectionLoadErrorState,
  type SelectedRanklistLoadErrorState,
} from './collection-error';
import {
  COLLECTION_COLLAPSED_STORAGE_KEY,
  COLLECTION_MARGIN_TRANSITION,
  COLLECTION_WIDTH_TRANSITION,
  getCollectionLayoutState,
  getCollectionRemainingHeight,
} from './collection-layout';

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
      logo,
      collapsed: false,
      hydrated: false,
      isMobileLayout: false,
      renderSwitchLock: false,
      viewportWidth: 1280,
      remainingHeight: 0,
      theme: 'light' as 'light' | 'dark',
      themeObserver: undefined as MutationObserver | undefined,
      bodyResizeObserver: undefined as ResizeObserver | undefined,
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
    selectedMenuKeys(): string[] {
      return this.rankId && !this.ranklistIdInvalid ? [this.rankId] : [];
    },
    navWidth(): number {
      return this.collectionLayout.navWidth;
    },
    menuHeight(): number {
      return this.collectionLayout.menuHeight;
    },
    collectionLayout() {
      return getCollectionLayoutState({
        clientWidth: this.viewportWidth,
        remainingHeight: this.remainingHeight,
        collapsed: this.collapsed,
      });
    },
    navStyle(): Record<string, string> {
      return {
        width: `${this.navWidth}px`,
        height: `${this.remainingHeight}px`,
        transition: COLLECTION_WIDTH_TRANSITION,
      };
    },
    collapseButtonStyle(): Record<string, string> {
      return {
        width: `${this.navWidth}px`,
        transition: COLLECTION_WIDTH_TRANSITION,
      };
    },
    menuStyle(): Record<string, string> {
      return {
        height: `${this.menuHeight}px`,
      };
    },
    hiddenHeaderStyle(): Record<string, string> {
      return {
        width: `${this.navWidth}px`,
        transition: COLLECTION_WIDTH_TRANSITION,
      };
    },
    ranklistPanelStyle(): Record<string, string | undefined> {
      return {
        marginLeft: this.collectionLayout.ranklistMarginLeft,
        display: this.collectionLayout.ranklistDisplay,
        transition: COLLECTION_MARGIN_TRANSITION,
      };
    },
    menuItems(): ItemType[] {
      if (!this.collection) {
        return [];
      }

      return this.collection.root.children.map((item) => this.createMenuItem(item));
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
    this.setupThemeTracking();
    this.updateViewportState();
    window.addEventListener('resize', this.updateViewportState, { passive: true });
    this.bodyResizeObserver = new ResizeObserver(this.updateViewportState);
    this.bodyResizeObserver.observe(document.body);
    this.cleanupInvalidRankId();
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateViewportState);
    this.themeObserver?.disconnect();
    this.bodyResizeObserver?.disconnect();
  },
  watch: {
    ranklistIdInvalid() {
      this.cleanupInvalidRankId();
    },
  },
  methods: {
    cleanupInvalidRankId() {
      if (!this.ranklistIdInvalid) {
        return;
      }

      const target = ranklandRoutes.collection.build({ id: this.id });
      if (this.$route.fullPath !== target) {
        this.$router.replace(target);
      }
    },
    refresh() {
      window.location.reload();
    },
    updateViewportState() {
      this.viewportWidth = window.innerWidth;
      const headerHeight = document.querySelector('.ant-layout-header')?.getBoundingClientRect().height || 0;
      this.remainingHeight = getCollectionRemainingHeight({
        bodyClientHeight: document.body.clientHeight,
        headerHeight,
      });
      this.isMobileLayout = this.collectionLayout.isMobileLayout;
      const stored = window.localStorage.getItem(COLLECTION_COLLAPSED_STORAGE_KEY);

      if (stored === 'true' || stored === 'false') {
        this.collapsed = stored === 'true';
        return;
      }

      this.collapsed = Boolean(this.isMobileLayout && this.rankId && !this.ranklistIdInvalid);
    },
    setupThemeTracking() {
      this.syncThemeFromDocument();
      this.themeObserver = new MutationObserver(this.syncThemeFromDocument);
      this.themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
    },
    syncThemeFromDocument() {
      this.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    },
    toggleCollapsed() {
      this.collapsed = !this.collapsed;
      window.localStorage.setItem(COLLECTION_COLLAPSED_STORAGE_KEY, String(this.collapsed));
    },
    handleMenuClick(info: { key: string | number }) {
      const key = String(info.key);
      if (key === this.rankId) {
        if (this.isMobileLayout) {
          this.collapsed = true;
          window.localStorage.setItem(COLLECTION_COLLAPSED_STORAGE_KEY, 'true');
        }
        return;
      }

      this.renderSwitchLock = true;
      requestAnimationFrame(() => {
        this.renderSwitchLock = false;
        this.$router.push(ranklandRoutes.collection.build({ id: this.id, rankId: key }));
      });

      if (this.isMobileLayout) {
        this.collapsed = true;
        window.localStorage.setItem(COLLECTION_COLLAPSED_STORAGE_KEY, 'true');
      }
    },
    createMenuItem(item: IApiCollectionItem): ItemType {
      const labelAttrs = {
        'data-id': `collection-menu-item-${item.uniqueKey}`,
        'data-collection-key': item.uniqueKey,
      };

      if (item.type === CollectionItemType.Directory) {
        const categoryIcon = getCollectionCategoryIcon(item.uniqueKey);
        return {
          key: item.uniqueKey,
          icon: categoryIcon
            ? () =>
                h(
                  'span',
                  {
                    class: 'srk-collection-menu-icon',
                    'data-id': `collection-category-icon-${item.uniqueKey}`,
                  },
                  [
                    h('img', {
                      src: this.theme === 'dark' ? categoryIcon.dark : categoryIcon.light,
                      alt: categoryIcon.alt,
                    }),
                  ],
                )
            : undefined,
          label: h('span', labelAttrs, item.name),
          children: (item.children || []).map((child) => this.createMenuItem(child)),
        };
      }

      return {
        key: item.uniqueKey,
        label: h(
          'span',
          {
            ...labelAttrs,
            role: 'link',
            'aria-current': this.rankId === item.uniqueKey ? 'page' : undefined,
          },
          item.name,
        ),
      };
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
  position: relative;
  min-height: 70vh;
}

.collection-nav {
  position: fixed;
  top: 64px;
  left: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  overflow: hidden;
  background: #f7f7f7;
  border-right: 1px solid #d9d9d9;
}

.collection-collapse-button {
  border-right: 0;
  border-left: 0;
  border-radius: 0;
}

.collection-collapse-button .anticon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1em;
}

.collection-collapse-button .anticon svg {
  width: 1em;
  height: 1em;
  fill: currentColor;
}

.srk-collection-nav-menu {
  flex: 0 0 auto;
  min-height: 0;
  overflow-x: clip;
  overflow-y: auto;
  border-inline-end: 0;
}

.srk-collection-menu-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.srk-collection-menu-icon img {
  width: 32px;
  height: 32px;
}

:deep(.ant-menu-inline-collapsed .srk-collection-menu-icon) {
  width: 100%;
}

.collection-hidden-header {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
}

.collection-hidden-header img {
  width: 32px;
  height: 32px;
}

.collection-hidden-header h2 {
  margin: 0 0 0 8px;
  font-size: 18px;
  line-height: 1;
}

.collection-page.is-nav-collapsed .collection-hidden-header {
  flex-direction: column;
}

.collection-page.is-nav-collapsed .collection-hidden-header img {
  width: 24px;
  height: 24px;
}

.collection-page.is-nav-collapsed .collection-hidden-header h2 {
  margin: 4px 0 0;
  font-size: 14px;
}

.collection-ranklist-panel {
  box-sizing: border-box;
  min-width: 0;
  max-width: 100vw;
  overflow-x: auto;
  padding: 16px;
}

.collection-ranklist-content {
  padding-bottom: 32px;
}

.collection-state {
  padding: 64px 16px;
  text-align: center;
}

.collection-empty-state {
  padding: 0;
  text-align: center;
}

.collection-state h3 {
  margin: 0 0 16px;
}

.collection-empty-state h3 {
  margin: 0;
  padding-top: 64px;
}

@media (max-width: 640px) {
  .collection-nav {
    top: 56px;
    border-right: 0;
    border-bottom: 1px solid #d9d9d9;
  }

  .collection-ranklist-panel {
    padding: 12px;
  }
}
</style>
