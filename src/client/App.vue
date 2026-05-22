<template>
  <router-view v-if="isFocusMode" v-slot="{ Component }">
    <Suspense>
      <component :is="Component" />
    </Suspense>
  </router-view>

  <div v-else data-id="app-shell" class="app-shell">
    <header class="app-header">
      <div class="app-header-inner">
        <router-link data-id="app-logo-link" class="app-logo" to="/" aria-label="RankLand">
          <img :src="logo" alt="RankLand">
        </router-link>

        <nav class="app-nav" aria-label="RankLand">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            data-id="app-nav-link"
            class="app-nav-link"
            :class="{ active: isNavActive(item.path) }"
            :aria-current="isNavActive(item.path) ? 'page' : undefined"
            :to="item.path"
          >
            {{ item.label }}
          </router-link>
        </nav>

        <a
          data-id="app-site-switch"
          class="app-site-switch"
          :href="siteSwitchHref"
          target="_blank"
          rel="noreferrer"
        >
          {{ siteSwitchLabel }}
        </a>
      </div>
    </header>

    <router-view v-slot="{ Component }">
      <Suspense>
        <component :is="Component" />
      </Suspense>
    </router-view>

    <button
      v-show="showBackTop"
      data-id="app-back-top"
      class="app-back-top"
      type="button"
      aria-label="回到顶部"
      @click="scrollToTop"
    >
      ↑
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ranklandRoutes } from '@common/rankland-router';
import logo from './assets/logo.png';

const navItems = [
  { path: ranklandRoutes.search.build(), label: '探索' },
  { path: ranklandRoutes.collection.build({ id: 'official' }), label: '榜单合集' },
  { path: ranklandRoutes.playground.build(), label: '演练场' },
];

export default defineComponent({
  name: 'App',
  data() {
    return {
      logo,
      navItems,
      showBackTop: false,
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

      return `//${host}${this.$route.fullPath}`;
    },
    siteAlias(): string | undefined {
      return process.env.RANKLAND_SITE_ALIAS || process.env.SITE_ALIAS;
    },
  },
  mounted() {
    this.updateBackTopVisibility();
    window.addEventListener('scroll', this.updateBackTopVisibility, { passive: true });
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.updateBackTopVisibility);
  },
  methods: {
    isNavActive(path: string): boolean {
      return this.$route.path === path || (path !== '/' && this.$route.path.startsWith(`${path}/`));
    },
    updateBackTopVisibility() {
      this.showBackTop = window.scrollY > 240;
    },
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  },
});
</script>
