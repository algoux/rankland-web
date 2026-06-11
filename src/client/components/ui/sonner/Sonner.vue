<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { CheckCircle2, CircleX, TriangleAlert } from 'lucide-vue-next';
import { Toaster as Sonner } from 'vue-sonner';
import type { ToasterProps } from 'vue-sonner';
import type { ThemeName } from '@/lib/theme';
import 'vue-sonner/style.css';

const mounted = ref(false);
const observedTheme = ref<ThemeName>('light');
let removeThemeListener: (() => void) | undefined;
let rootThemeObserver: MutationObserver | undefined;

const sonnerTheme = computed<ToasterProps['theme']>(() => observedTheme.value);
const sonnerToastOptions: ToasterProps['toastOptions'] = {
  classes: {
    toast:
      'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
    description: 'group-[.toast]:text-muted-foreground',
    actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
    cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
  },
};

function syncSonnerTheme(systemTheme?: MediaQueryList | MediaQueryListEvent) {
  const root = document.documentElement;
  if (root.classList.contains('dark')) {
    observedTheme.value = 'dark';
    return;
  }
  if (root.classList.contains('light')) {
    observedTheme.value = 'light';
    return;
  }

  const systemDark =
    systemTheme?.matches ?? window.matchMedia('(prefers-color-scheme: dark)').matches;
  observedTheme.value = systemDark ? 'dark' : 'light';
}

onMounted(() => {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const setSystemTheme = (event: MediaQueryList | MediaQueryListEvent) => syncSonnerTheme(event);
  syncSonnerTheme(media);
  rootThemeObserver = new MutationObserver(() => syncSonnerTheme(media));
  rootThemeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  if (media.addEventListener) {
    media.addEventListener('change', setSystemTheme);
    removeThemeListener = () => media.removeEventListener('change', setSystemTheme);
  } else {
    media.addListener(setSystemTheme);
    removeThemeListener = () => media.removeListener(setSystemTheme);
  }
  mounted.value = true;
});

onBeforeUnmount(() => {
  removeThemeListener?.();
  rootThemeObserver?.disconnect();
});
</script>

<template>
  <Sonner
    v-if="mounted"
    class="toaster group"
    position="top-center"
    :theme="sonnerTheme"
    :toast-options="sonnerToastOptions"
  >
    <template #success-icon>
      <CheckCircle2 class="rankland-sonner-status-icon rankland-sonner-success-icon" />
    </template>
    <template #error-icon>
      <CircleX class="rankland-sonner-status-icon rankland-sonner-error-icon" />
    </template>
    <template #warning-icon>
      <TriangleAlert class="rankland-sonner-status-icon rankland-sonner-warning-icon" />
    </template>
  </Sonner>
</template>
