<script setup lang="ts">
import { ref } from 'vue';
import copy from 'copy-to-clipboard';

const props = defineProps<{
  text: string;
  copiedText: string;
}>();

const copied = ref(false);
let timer: number | undefined;

function handleClick() {
  if (!copy(props.text, { format: 'text/plain' })) {
    return;
  }
  copied.value = true;
  if (timer) {
    window.clearTimeout(timer);
  }
  timer = window.setTimeout(() => {
    copied.value = false;
  }, 1800);
}
</script>

<template>
  <span class="relative inline-flex cursor-pointer" :title="copied ? copiedText : undefined" @click="handleClick">
    <slot />
    <span
      v-if="copied"
      class="absolute left-1/2 top-full z-20 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow"
    >
      {{ copiedText }}
    </span>
  </span>
</template>
