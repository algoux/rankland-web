<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ranklandRoutes } from '@/app/config';

const route = useRoute();
const clientReady = ref(false);

const items = [
  { label: '探索', href: ranklandRoutes.formatUrl('Search'), disabled: false },
  { label: '榜单合集', href: ranklandRoutes.formatUrl('Collection', { id: 'official' }), disabled: false },
  { label: '演练场', href: ranklandRoutes.formatUrl('Playground'), disabled: false },
];

const activePath = computed(() => (clientReady.value ? decodeURIComponent(route.path) : ''));

onMounted(() => {
  clientReady.value = true;
});
</script>

<template>
  <nav class="rankland-nav-menu">
    <template v-for="item in items" :key="item.href">
      <span
        v-if="item.disabled"
        class="rankland-nav-menu-item is-disabled"
        aria-disabled="true"
        title="Coming in the page migration milestones"
      >
        {{ item.label }}
      </span>
      <router-link
        v-else
        :to="item.href"
        class="rankland-nav-menu-item"
        :class="{ 'is-active': activePath === item.href }"
      >
        {{ item.label }}
      </router-link>
    </template>
  </nav>
</template>
