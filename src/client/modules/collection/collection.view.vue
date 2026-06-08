<template>
  <section v-if="errorKind === PageErrorKind.NotFound" class="mt-16 text-center" data-id="collection-not-found">
    <Head>
      <title>{{ notFoundTitle }}</title>
    </Head>
    <h1 class="mb-4 text-2xl font-semibold tracking-normal">Collection Not Found</h1>
    <router-link to="/" data-id="collection-not-found-home-link">
      <Button size="sm">Back to Home</Button>
    </router-link>
  </section>

  <section v-else-if="errorKind === PageErrorKind.LoadFailed" class="mt-16 text-center">
    <Head>
      <title>{{ fallbackTitle }}</title>
    </Head>
    <p class="mb-4 text-muted-foreground">An error occurred while loading data</p>
    <Button size="sm" @click="reloadPage">
      Refresh
    </Button>
  </section>

  <section v-else-if="!collectionPageData" class="mt-16 text-center">
    <Head>
      <title>{{ fallbackTitle }}</title>
    </Head>
    <Loading />
  </section>

  <section
    v-else
    class="rankland-collection-page"
    data-id="collection-page"
    :data-collection-id="collectionId"
  >
    <Head>
      <title>{{ pageTitle }}</title>
      <meta property="og:title" :content="pageTitle" />
      <meta property="og:url" :content="collectionFullUrl" />
      <link rel="canonical" :href="collectionFullUrl" />
    </Head>

    <div class="rankland-collection-shell srk-collection-container">
      <aside
        class="rankland-collection-sidebar srk-collection-nav"
        :class="{ 'is-client-ready': clientReady, 'is-collapsed': collapsed }"
        :style="collectionSidebarStyle"
        data-id="collection-sidebar"
      >
        <div class="srk-collection-nav-toggle">
          <Button
            variant="outline"
            size="lg"
            class="srk-collection-toggle-button"
            :class="{ 'is-collapsed': collapsed }"
            data-id="collection-sidebar-toggle"
            @click="toggleCollapsed"
          >
            <Menu class="srk-collection-toggle-icon" />
            <span v-if="!collapsed" class="srk-collection-toggle-label">折叠</span>
            <span v-else class="sr-only">展开</span>
          </Button>
        </div>
        <nav
          class="srk-collection-nav-menu"
          :class="{ 'ant-menu-inline-collapsed': collapsed }"
          aria-label="榜单合集"
        >
          <ul class="srk-collection-menu-root" role="menu" data-id="collection-menu-root">
            <CollectionTreeItem
              v-for="item in collectionRootItems"
              :key="item.uniqueKey"
              :item="item"
              :collection-id="collectionId"
              :active-rank-id="activeRankId"
              :open-keys="openKeys"
              :theme-name="themeName"
              :collapsed="collapsed"
              :level="0"
              :active-popup-key="activeCollapsedPopupKey"
              @select="selectRanklist"
              @toggle="toggleDirectory"
              @popup-open="openCollapsedPopup"
              @popup-close="closeCollapsedPopup"
            />
          </ul>
        </nav>
      </aside>

      <div
        class="rankland-collection-hidden-header srk-collection-hidden-header"
        :class="{ 'is-client-ready': clientReady, 'is-collapsed': collapsed }"
        :style="collectionHiddenHeaderStyle"
        data-id="collection-hidden-header"
      >
        <img :src="collectionLogo" alt="RankLand" />
        <h3>榜单合集</h3>
      </div>

      <div
        class="rankland-collection-content srk-collection-ranklist"
        :class="{ 'is-mobile-nav-open': usingMobileLayout && !collapsed }"
        :style="collectionContentStyle"
      >
        <div v-if="collectionPageData.ranklistHasError" class="rankland-collection-state">
          <div>
            <p class="mb-4 text-muted-foreground">An error occurred while loading data</p>
            <Button size="sm" @click="reloadPage">
              Refresh
            </Button>
          </div>
        </div>
        <div v-else-if="ranklistDisplayBusy" class="rankland-collection-state">
          <Loading />
        </div>
        <div
          v-else-if="collectionPageData.ranklist"
          class="pb-8"
          data-id="collection-ranklist-content"
          :data-ranklist-id="renderedRanklistId"
          :data-row-count="String(collectionPageData.ranklist.srk.rows.length)"
        >
          <StyledRanklist
            :data="collectionPageData.ranklist.srk"
            :name="renderedRanklistId"
            :id="renderedRanklistId"
            :meta="collectionPageData.ranklist.info"
            show-footer
            show-filter
          />
        </div>
        <div v-else class="rankland-collection-state" data-id="collection-empty-state">
          <h1 class="text-lg font-medium tracking-normal text-muted-foreground">
            请展开左侧边栏并选择一个榜单
          </h1>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { View, RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';
import { Menu } from 'lucide-vue-next';
import type { AsyncDataOptions } from '@client/typings';
import type { IApiCollectionItem } from '@/services/ranklist-api';
import { Button } from '@/components/ui/button';
import Loading from '@/components/common/Loading.vue';
import StyledRanklist from '@/components/ranklist/StyledRanklist.vue';
import { getFullUrl, ranklandRoutes } from '@/app/config';
import { LocalStorageKey } from '@/app/local-storage-key.config';
import ranklandLogo from '@/assets/rankland-logo.png';
import {
  RanklistPageErrorKind,
  shouldLogRanklistPageError,
  writeRanklistPageErrorResponse,
} from '@/domain/ranklist/page-error';
import {
  findCollectionAncestorKeys,
  loadCollectionPageData,
  type CollectionPageData,
} from './page-data';
import { formatTitle } from '@/app/title-format';
import type { ThemeName } from '@/lib/theme';
import CollectionTreeItem from './CollectionTreeItem.vue';

const COLLECTION_SUBMENU_ANIMATION_MS = 220;

@View('/collection/:id')
@RenderMethod(RenderMethodKind.SSR)
@Options({
  components: {
    Button,
    CollectionTreeItem,
    Loading,
    Menu,
    StyledRanklist,
  },
})
export default class Collection extends Vue {
  @Prop() collectionPageData?: CollectionPageData;
  @Prop() errorKind?: RanklistPageErrorKind;

  PageErrorKind = RanklistPageErrorKind;
  fallbackTitle = formatTitle();
  notFoundTitle = formatTitle('Not Found');
  openKeys: string[] = [];
  collapsed = false;
  clientReady = false;
  clientWidth = 0;
  domThemeName: ThemeName = 'light';
  collectionLogo = ranklandLogo;
  activeCollapsedPopupKey = '';
  private invalidRedirectPath = '';
  private themeClassObserver: MutationObserver | undefined;
  private activeMenuScrollKey = '';
  private activeMenuScrollTimer: number | undefined;
  private activeMenuScrollFrame: number | undefined;
  private syncedActiveRankId = '';
  private syncedRanklistScrollTopKey = '';
  private ranklistScrollTopFrame: number | undefined;

  get collectionId() {
    const id = this.$route.params.id;
    return Array.isArray(id) ? id[0] : String(id || '');
  }

  get activeRankId() {
    return firstQueryValue(this.$route.query.rankId);
  }

  get ranklistDataId() {
    return this.collectionPageData?.ranklist?.info?.uniqueKey || '';
  }

  get renderedRanklistId() {
    return this.ranklistDataId || this.activeRankId || '';
  }

  get pageTitle() {
    const name = this.collectionPageData?.ranklist?.info?.name;
    return formatTitle(name ? `${name} - 榜单合集` : '榜单合集');
  }

  get collectionFullUrl() {
    return getFullUrl(ranklandRoutes.formatUrl('Collection', {
      id: this.collectionId,
      rankId: this.activeRankId || undefined,
    }));
  }

  get collectionRootItems(): IApiCollectionItem[] {
    return this.collectionPageData?.collection.root.children ?? [];
  }

  get themeName(): ThemeName {
    return this.domThemeName || this.$theme?.state.theme || 'light';
  }

  get usingMobileLayout() {
    return this.clientReady && this.clientWidth > 0 && this.clientWidth < 640;
  }

  get sidebarWidth() {
    const viewportWidth = this.clientReady && this.clientWidth > 0 ? this.clientWidth : 300;
    if (this.collapsed) {
      return `${Math.min(80, viewportWidth)}px`;
    }
    if (this.usingMobileLayout) {
      return `${viewportWidth}px`;
    }
    return `${Math.min(300, viewportWidth)}px`;
  }

  get collectionSidebarStyle() {
    return {
      '--rankland-collection-sidebar-width': this.sidebarWidth,
    };
  }

  get collectionContentStyle() {
    return {
      '--rankland-collection-sidebar-width': this.sidebarWidth,
    };
  }

  get collectionHiddenHeaderStyle() {
    return {
      '--rankland-collection-sidebar-width': this.sidebarWidth,
    };
  }

  get ranklistDisplayBusy() {
    return false;
  }

  mounted() {
    this.updateClientWidth();
    this.syncDomThemeName();
    this.themeClassObserver = new MutationObserver(this.syncDomThemeName);
    this.themeClassObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    this.applyInitialCollapsedState();
    this.clientReady = true;
    window.addEventListener('resize', this.updateClientWidth);
    this.syncedRanklistScrollTopKey = this.ranklistDataId;
    this.syncActiveAncestorOpenKeys();
    this.syncInvalidRankId();
    this.queueActiveMenuScroll();
  }

  updated() {
    this.syncActiveAncestorOpenKeys();
    this.syncInvalidRankId();
    this.queueActiveMenuScroll();
    this.queueRanklistScrollToTopAfterSwitch();
  }

  beforeUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.updateClientWidth);
    }
    this.themeClassObserver?.disconnect();
    this.clearActiveMenuScrollRequest();
    this.clearRanklistScrollTopRequest();
  }

  reloadPage() {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  toggleCollapsed() {
    this.setCollapsed(!this.collapsed);
  }

  toggleDirectory(key: string) {
    this.openKeys = this.openKeys.includes(key)
      ? this.openKeys.filter((item) => item !== key)
      : [...this.openKeys, key];
  }

  openCollapsedPopup(key: string) {
    this.activeCollapsedPopupKey = key;
  }

  closeCollapsedPopup(key: string) {
    if (this.activeCollapsedPopupKey === key) {
      this.activeCollapsedPopupKey = '';
    }
  }

  selectRanklist(key: string) {
    this.activeCollapsedPopupKey = '';
    if (key === this.activeRankId) {
      if (this.usingMobileLayout) {
        this.setCollapsed(true);
      }
      return;
    }

    const navigate = () => {
      this.$router.push(ranklandRoutes.formatUrl('Collection', {
        id: this.collectionId,
        rankId: key,
      }));
    };
    if (typeof window !== 'undefined' && window.requestAnimationFrame) {
      window.requestAnimationFrame(navigate);
    } else {
      navigate();
    }
    if (this.usingMobileLayout) {
      this.setCollapsed(true);
    }
  }

  async asyncData({ api, isClient, to, writeResponse }: AsyncDataOptions) {
    const id = Array.isArray(to.params.id) ? to.params.id[0] : String(to.params.id || '');
    const rankId = firstQueryValue(to.query.rankId);
    try {
      return {
        collectionPageData: await loadCollectionPageData({ api, id, rankId }),
        errorKind: undefined,
      };
    } catch (error) {
      if (shouldLogRanklistPageError(error)) {
        console.error(error);
      }
      return {
        collectionPageData: undefined,
        errorKind: writeRanklistPageErrorResponse(error, { isClient, writeResponse }),
      };
    }
  }

  private updateClientWidth = () => {
    if (typeof window !== 'undefined') {
      const widths = [window.innerWidth, document.documentElement.clientWidth]
        .filter((width) => Number.isFinite(width) && width > 0);
      this.clientWidth = widths.length > 0 ? Math.min(...widths) : 0;
    }
  };

  private syncDomThemeName = () => {
    if (typeof document === 'undefined') {
      return;
    }
    this.domThemeName = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  };

  private applyInitialCollapsedState() {
    if (typeof window === 'undefined') {
      return;
    }
    const saved = readCollectionCollapsedPreference();
    if (saved === 'true') {
      this.collapsed = true;
    } else if (saved === 'false') {
      this.collapsed = false;
    } else if (this.activeRankId && this.clientWidth < 640 && !this.collectionPageData?.ranklistIdInvalid) {
      this.collapsed = true;
    }
  }

  private setCollapsed(collapsed: boolean) {
    this.collapsed = collapsed;
    this.activeCollapsedPopupKey = '';
    if (!collapsed) {
      this.activeMenuScrollKey = '';
      this.clearActiveMenuScrollRequest();
    }
    writeCollectionCollapsedPreference(collapsed ? 'true' : 'false');
  }

  private syncActiveAncestorOpenKeys() {
    if (!this.collectionPageData?.collection || !this.activeRankId) {
      return;
    }
    if (this.syncedActiveRankId === this.activeRankId) {
      return;
    }
    this.syncedActiveRankId = this.activeRankId;
    const ancestorKeys = findCollectionAncestorKeys(this.collectionPageData.collection, this.activeRankId);
    if (ancestorKeys.length === 0) {
      return;
    }
    const keys = new Set(this.openKeys);
    let changed = false;
    for (const key of ancestorKeys) {
      if (!keys.has(key)) {
        keys.add(key);
        changed = true;
      }
    }
    if (changed) {
      this.openKeys = [...keys];
    }
  }

  private syncInvalidRankId() {
    if (!this.collectionPageData?.ranklistIdInvalid || typeof window === 'undefined') {
      return;
    }
    if (this.invalidRedirectPath === this.$route.fullPath) {
      return;
    }
    this.invalidRedirectPath = this.$route.fullPath;
    this.$router.replace(ranklandRoutes.formatUrl('Collection', { id: this.collectionId }));
  }

  private queueActiveMenuScroll() {
    if (typeof window === 'undefined' || !this.clientReady || this.collapsed || !this.activeRankId) {
      return;
    }

    const scrollKey = `${this.collectionId}:${this.activeRankId}`;
    if (this.activeMenuScrollKey === scrollKey) {
      return;
    }
    this.activeMenuScrollKey = scrollKey;

    this.clearActiveMenuScrollRequest();
    this.activeMenuScrollTimer = window.setTimeout(() => {
      this.activeMenuScrollTimer = undefined;
      this.activeMenuScrollFrame = window.requestAnimationFrame(() => {
        this.activeMenuScrollFrame = undefined;
        this.scrollActiveMenuItemIntoView(scrollKey);
      });
    }, COLLECTION_SUBMENU_ANIMATION_MS + 40);
  }

  private scrollActiveMenuItemIntoView(scrollKey: string) {
    if (typeof document === 'undefined' || this.collapsed || this.activeMenuScrollKey !== scrollKey) {
      return;
    }

    const menu = document.querySelector('.srk-collection-nav-menu');
    const activeItem = Array.from(document.querySelectorAll<HTMLElement>('.srk-collection-menu-title'))
      .find((element) => element.dataset.collectionKey === this.activeRankId);

    if (!(menu instanceof HTMLElement) || !activeItem) {
      return;
    }

    const menuRect = menu.getBoundingClientRect();
    const activeRect = activeItem.getBoundingClientRect();
    const overTop = activeRect.top - menuRect.top;
    const overBottom = activeRect.bottom - menuRect.bottom;

    if (overTop < 0) {
      menu.scrollTop += overTop;
    } else if (overBottom > 0) {
      menu.scrollTop += overBottom;
    }
  }

  private clearActiveMenuScrollRequest() {
    if (this.activeMenuScrollTimer !== undefined) {
      window.clearTimeout(this.activeMenuScrollTimer);
      this.activeMenuScrollTimer = undefined;
    }
    if (this.activeMenuScrollFrame !== undefined) {
      window.cancelAnimationFrame(this.activeMenuScrollFrame);
      this.activeMenuScrollFrame = undefined;
    }
  }

  private queueRanklistScrollToTopAfterSwitch() {
    if (typeof window === 'undefined' || !this.clientReady) {
      return;
    }

    const ranklistKey = this.ranklistDataId;
    if (!ranklistKey || ranklistKey !== this.activeRankId || this.syncedRanklistScrollTopKey === ranklistKey) {
      return;
    }

    this.syncedRanklistScrollTopKey = ranklistKey;
    this.clearRanklistScrollTopRequest();
    this.$nextTick(() => {
      if (this.ranklistDataId !== ranklistKey || this.activeRankId !== ranklistKey) {
        return;
      }

      const scrollToTop = () => {
        this.ranklistScrollTopFrame = undefined;
        if (this.ranklistDataId !== ranklistKey || this.activeRankId !== ranklistKey) {
          return;
        }
        window.scrollTo({ top: 0, left: window.scrollX, behavior: 'auto' });
      };

      if (window.requestAnimationFrame) {
        this.ranklistScrollTopFrame = window.requestAnimationFrame(scrollToTop);
      } else {
        scrollToTop();
      }
    });
  }

  private clearRanklistScrollTopRequest() {
    if (this.ranklistScrollTopFrame !== undefined) {
      window.cancelAnimationFrame(this.ranklistScrollTopFrame);
      this.ranklistScrollTopFrame = undefined;
    }
  }
}

function firstQueryValue(value: unknown) {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : undefined;
  }
  return typeof value === 'string' && value ? value : undefined;
}

function readCollectionCollapsedPreference() {
  try {
    return window.localStorage.getItem(LocalStorageKey.CollectionNavCollapsed);
  } catch (_error) {
    return null;
  }
}

function writeCollectionCollapsedPreference(value: string) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(LocalStorageKey.CollectionNavCollapsed, value);
  } catch (_error) {
    // Ignore storage failures in private browsing or locked-down embeds.
  }
}
</script>
