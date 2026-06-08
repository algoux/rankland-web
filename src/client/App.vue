<template>
  <Sonner />

  <router-view v-if="focusMode" v-slot="{ Component }">
    <Suspense>
      <component :is="Component" />
    </Suspense>
  </router-view>

  <div v-else class="min-h-screen bg-background text-foreground">
    <header class="rankland-site-header px-[50px] max-md:px-5">
      <div data-id="site-header-inner" class="flex h-16 w-full items-center gap-3">
        <router-link class="flex h-11 w-11 shrink-0 items-center justify-center" to="/" aria-label="RankLand">
          <img class="h-10 w-10" src="./assets/rankland-logo.png" alt="RankLand" />
        </router-link>
        <NavMenu class="flex-1" />
        <RightMenu />
      </div>
    </header>

    <main class="w-full px-[50px] py-8 max-md:px-5">
      <router-view v-slot="{ Component }">
        <Suspense>
          <component :is="Component" />
        </Suspense>
      </router-view>
    </main>

    <BackTop />
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import BackTop from './components/layout/BackTop.vue';
import NavMenu from './components/layout/NavMenu.vue';
import RightMenu from './components/layout/RightMenu.vue';
import { Sonner } from './components/ui/sonner';
import { revealBodyAfterInitialHydration } from './app/hydration-flicker-guard';

@Options({
  components: {
    BackTop,
    NavMenu,
    RightMenu,
    Sonner,
  },
})
export default class App extends Vue {
  get focusMode() {
    return this.$route.query.focus === 'yes' || this.$route.query['聚焦'] === '是';
  }

  mounted() {
    this.$nextTick(() => {
      void revealBodyAfterInitialHydration(window);
    });
  }
}
</script>
