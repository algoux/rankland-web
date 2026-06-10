<script setup lang="ts">
import { computed, inject } from 'vue';
import { Monitor, Moon, Sun } from 'lucide-vue-next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { THEME_TOKEN, type ThemeMode } from '@/lib/theme';

const themeService = inject(THEME_TOKEN, undefined);

const themeModeOptions = [
  { value: 'auto', label: '自动', icon: Monitor },
  { value: 'light', label: '亮色', icon: Sun },
  { value: 'dark', label: '暗色', icon: Moon },
] as const;

const currentThemeMode = computed<ThemeMode>(() => themeService?.state.mode || 'auto');
const currentThemeOption = computed(() =>
  themeModeOptions.find((option) => option.value === currentThemeMode.value) || themeModeOptions[0],
);

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'auto' || value === 'light' || value === 'dark';
}

function handleThemeModeChange(value: string | string[] | undefined) {
  const nextValue = Array.isArray(value) ? value[0] : value;
  if (isThemeMode(nextValue)) {
    themeService?.setMode(nextValue);
  }
}
</script>

<template>
  <DropdownMenu :modal="false">
    <div class="rankland-theme-mode">
      <DropdownMenuTrigger as-child>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          class="rankland-theme-mode-trigger"
          data-id="theme-mode-trigger"
          aria-label="主题模式"
        >
          <component :is="currentThemeOption.icon" data-icon="inline-start" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        class="rankland-theme-mode-menu"
        data-id="theme-mode-menu"
        side="bottom"
        align="end"
        :side-offset="0"
        :collision-padding="8"
        @close-auto-focus.prevent
      >
        <DropdownMenuRadioGroup
          :model-value="currentThemeMode"
          @update:model-value="handleThemeModeChange"
        >
          <DropdownMenuRadioItem
            v-for="option in themeModeOptions"
            :key="option.value"
            class="rankland-theme-mode-menu-item"
            :data-id="`theme-mode-option-${option.value}`"
            :value="option.value"
          >
            <component :is="option.icon" />
            <span class="rankland-theme-mode-menu-text">{{ option.label }}</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </div>
  </DropdownMenu>
</template>
