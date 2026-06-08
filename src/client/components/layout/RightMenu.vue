<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ExternalLink } from 'lucide-vue-next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrentUrl } from '@/app/current-url';
import { getRanklandRuntimeConfig } from '@/app/config';

const route = useRoute();
const config = getRanklandRuntimeConfig();
const menuOpen = ref(false);
let closeTimer: ReturnType<typeof window.setTimeout> | null = null;

const currentUrl = computed(() => formatCurrentUrl({
  protocol: typeof window === 'undefined' ? 'https:' : window.location.protocol,
  host: typeof window === 'undefined' ? config.hostGlobal : window.location.host,
  pathname: route.path,
  query: route.query,
}).url);

const target = computed(() => {
  if (config.siteAlias === 'cnn') {
    return {
      label: '全球站点',
      description: '',
      host: config.hostGlobal,
    };
  }
  return {
    label: '中国站点',
    description: '特别速度优化',
    host: config.hostCN,
  };
});

function clearCloseTimer() {
  if (closeTimer !== null) {
    window.clearTimeout(closeTimer);
    closeTimer = null;
  }
}

function setMenuOpen(value: boolean) {
  clearCloseTimer();
  menuOpen.value = value;
}

function queueClose() {
  clearCloseTimer();
  closeTimer = window.setTimeout(() => {
    menuOpen.value = false;
    closeTimer = null;
  }, 80);
}

function shouldUseHoverPointer(event: PointerEvent) {
  return event.pointerType === 'mouse' && window.innerWidth > 768;
}

function handlePointerEnter(event: PointerEvent) {
  if (shouldUseHoverPointer(event)) {
    setMenuOpen(true);
  }
}

function handlePointerLeave(event: PointerEvent) {
  if (shouldUseHoverPointer(event)) {
    queueClose();
  }
}

onBeforeUnmount(() => {
  clearCloseTimer();
});
</script>

<template>
  <DropdownMenu :open="menuOpen" :modal="false" @update:open="setMenuOpen">
    <div
      class="rankland-switch-site"
      @pointerenter="handlePointerEnter"
      @pointerleave="handlePointerLeave"
    >
      <DropdownMenuTrigger as-child>
        <button class="rankland-switch-site-trigger" type="button">
          切换
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        class="rankland-switch-site-menu"
        data-id="site-switch-menu"
        side="bottom"
        align="end"
        :side-offset="0"
        :collision-padding="8"
        @pointerenter="handlePointerEnter"
        @pointerleave="handlePointerLeave"
        @close-auto-focus.prevent
      >
        <DropdownMenuGroup>
          <DropdownMenuItem as-child class="rankland-switch-site-menu-item">
            <a
              :href="`//${target.host}${currentUrl}`"
              target="_blank"
              rel="noreferrer"
            >
              <span class="rankland-switch-site-menu-text">
                <span>{{ target.label }}</span>
                <span v-if="target.description" class="rankland-switch-site-menu-description">{{ target.description }}</span>
              </span>
              <ExternalLink data-icon="inline-end" />
            </a>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </div>
  </DropdownMenu>
</template>
