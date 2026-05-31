<template>
  <a-config-provider :theme="antDesignTheme">
    <router-view v-if="isFocusMode" v-slot="{ Component }">
      <Suspense>
        <component :is="Component" />
      </Suspense>
    </router-view>

    <a-layout v-else data-id="app-shell" class="app-shell layout">
      <a-layout-header data-id="app-header" class="app-header">
        <div class="app-header-inner flex justify-between">
          <router-link data-id="app-logo-link" class="app-logo" to="/" aria-label="RankLand">
            <div class="logo app-logo-box">
              <img :src="logo" alt="RankLand">
            </div>
          </router-link>

          <div style="flex: 1; min-width: 0;">
            <ClientOnly>
              <a-menu
                data-id="app-nav"
                class="app-nav nav-menu"
                mode="horizontal"
                disabled-overflow
                :selected-keys="[selectedNavKey]"
              >
                <a-menu-item v-for="item in navItems" :key="item.path">
                  <router-link
                    data-id="app-nav-link"
                    :aria-current="isNavActive(item.path) ? 'page' : undefined"
                    :to="item.path"
                  >
                    {{ item.label }}
                  </router-link>
                </a-menu-item>
              </a-menu>
            </ClientOnly>
          </div>

          <div>
            <a-dropdown placement="bottomRight">
              <a-button data-id="app-site-switch" class="app-site-switch px-2" type="text">
                切换
              </a-button>
              <template #overlay>
                <a-menu>
                  <a-menu-item key="site-switch">
                    <a
                      data-id="app-site-switch-link"
                      :href="siteSwitchHref"
                      target="_blank"
                      :style="siteSwitchLinkStyle"
                    >
                      <template v-if="siteAlias === 'cnn'">
                        全球站点
                        <ArrowRightOutlined :rotate="-45" />
                      </template>
                      <template v-else>
                        <p class="mb-0">中国站点</p>
                        <p class="mb-0">
                          <span class="opacity-60 text-xs">特别速度优化</span>
                          <ArrowRightOutlined :rotate="-45" />
                        </p>
                      </template>
                    </a>
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </div>
      </a-layout-header>

      <a-layout-content>
        <router-view v-slot="{ Component }">
          <Suspense>
            <component :is="Component" />
          </Suspense>
        </router-view>
      </a-layout-content>

      <a-back-top
        data-id="app-back-top"
        class="app-back-top ant-back-top"
        :visibility-height="240"
      />
    </a-layout>
  </a-config-provider>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ArrowRightOutlined } from '@ant-design/icons-vue';
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context';
import { ranklandRoutes } from '@common/rankland-router';
import {
  buildRanklandAnalyticsPage,
  getRanklandGaTag,
  initializeRanklandAnalytics,
  sendRanklandPageview,
} from './app-analytics';
import logo from './assets/logo.png';

type ThemeMediaQuery = MediaQueryList & {
  addListener?: (listener: (event: MediaQueryListEvent | MediaQueryList) => void) => void;
  removeListener?: (listener: (event: MediaQueryListEvent | MediaQueryList) => void) => void;
};

function buildLegacySiteSwitchPath(fullPath: string): string {
  const [withoutHash] = fullPath.split('#');
  const [path, queryString] = withoutHash.split('?');
  if (!queryString) {
    return path;
  }

  const query = queryString
    .split('&')
    .filter((segment) => {
      const [rawKey] = segment.split('=');
      const key = decodeURIComponent(rawKey.replace(/\+/g, ' '));
      return key !== 'focus' && key !== '聚焦';
    })
    .join('&');

  return query ? `${path}?${query}` : path;
}

const navItems = [
  { path: ranklandRoutes.search.build(), label: '探索' },
  { path: ranklandRoutes.collection.build({ id: 'official' }), label: '榜单合集' },
  { path: ranklandRoutes.playground.build(), label: '演练场' },
];

const ranklandThemeTokens = {
  light: {
    colorLink: '#ff8104',
    colorLinkActive: '#d96500',
    colorLinkHover: '#ff9d2e',
    colorPrimary: '#ff8104',
  },
  dark: {
    colorLink: '#f6ac06',
    colorLinkActive: '#e8b52b',
    colorLinkHover: '#a7770b',
    colorPrimary: '#f6ac06',
  },
};

export default defineComponent({
  name: 'App',
  components: {
    ArrowRightOutlined,
  },
  data() {
    return {
      logo,
      navItems,
      currentTheme: 'light' as 'light' | 'dark',
      themeMediaQuery: undefined as ThemeMediaQuery | undefined,
      analyticsPageviewTimer: undefined as ReturnType<typeof setTimeout> | undefined,
      lastAnalyticsPage: '',
    };
  },
  computed: {
    isFocusMode(): boolean {
      return this.$route.query.focus === 'yes' || this.$route.query['聚焦'] === '是';
    },
    siteSwitchLabel(): string {
      return this.siteAlias === 'cnn' ? '全球站点' : '中国站点';
    },
    siteSwitchHref(): string {
      const host = this.siteAlias === 'cnn'
        ? process.env.RANKLAND_HOST_GLOBAL || process.env.HOST_GLOBAL || 'rl.algoux.org'
        : process.env.RANKLAND_HOST_CN || process.env.HOST_CN || 'rl.algoux.cn';

      return `//${host}${buildLegacySiteSwitchPath(this.$route.fullPath)}`;
    },
    siteSwitchLinkStyle(): { wordBreak: 'keep-all' } | undefined {
      return this.siteAlias === 'cnn' ? undefined : { wordBreak: 'keep-all' };
    },
    siteAlias(): string | undefined {
      return process.env.RANKLAND_SITE_ALIAS || process.env.SITE_ALIAS;
    },
    antDesignTheme(): ThemeConfig {
      return {
        token: ranklandThemeTokens[this.currentTheme],
      };
    },
    selectedNavKey(): string {
      const activeItem = this.navItems.find((item) => this.isNavActive(item.path));
      return activeItem?.path || '';
    },
  },
  mounted() {
    this.setupThemeSync();
    this.setupPlatformOptimizations();
    this.setupAnalytics();
    this.queueAnalyticsPageview();
  },
  beforeUnmount() {
    if (this.themeMediaQuery) {
      if (this.themeMediaQuery.removeEventListener) {
        this.themeMediaQuery.removeEventListener('change', this.applySystemTheme);
      } else if (this.themeMediaQuery.removeListener) {
        this.themeMediaQuery.removeListener(this.applySystemTheme);
      }
    }
    if (this.analyticsPageviewTimer) {
      clearTimeout(this.analyticsPageviewTimer);
    }
  },
  watch: {
    '$route.fullPath'() {
      this.queueAnalyticsPageview();
    },
  },
  methods: {
    isNavActive(path: string): boolean {
      return this.$route.path === path || (path !== '/' && this.$route.path.startsWith(`${path}/`));
    },
    setupThemeSync() {
      if (!window.matchMedia) {
        document.documentElement.className = 'light';
        return;
      }

      this.themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)') as ThemeMediaQuery;
      this.applySystemTheme(this.themeMediaQuery);
      if (this.themeMediaQuery.addEventListener) {
        this.themeMediaQuery.addEventListener('change', this.applySystemTheme);
      } else if (this.themeMediaQuery.addListener) {
        this.themeMediaQuery.addListener(this.applySystemTheme);
      }
    },
    applySystemTheme(event: MediaQueryListEvent | MediaQueryList) {
      this.currentTheme = event.matches ? 'dark' : 'light';
      document.documentElement.className = this.currentTheme;
    },
    setupPlatformOptimizations() {
      const userAgent = window.navigator.userAgent;
      const isMacOS = /Macintosh|Mac OS X/.test(userAgent);
      const isBlink = /Chrome|Chromium|Edg\//.test(userAgent) && /AppleWebKit/.test(userAgent);

      if (isMacOS && isBlink) {
        document.body.classList.add('optimize-decrease-effects');
      }
    },
    setupAnalytics() {
      initializeRanklandAnalytics(getRanklandGaTag());
    },
    queueAnalyticsPageview() {
      if (typeof window === 'undefined') {
        return;
      }

      const page = buildRanklandAnalyticsPage(window.location.origin, this.$route.fullPath);
      if (page === this.lastAnalyticsPage) {
        return;
      }

      this.lastAnalyticsPage = page;
      if (this.analyticsPageviewTimer) {
        clearTimeout(this.analyticsPageviewTimer);
      }

      this.analyticsPageviewTimer = setTimeout(() => {
        sendRanklandPageview(page);
      }, 500);
    },
  },
});
</script>
