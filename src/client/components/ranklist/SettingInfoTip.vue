<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { Info } from 'lucide-vue-next';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const props = defineProps<{
  id: string;
  content: string;
}>();

const open = ref(false);
const contentSide = ref<'right' | 'top'>('right');
const contentAlign = ref<'center' | 'end'>('center');
let closeTimer: ReturnType<typeof window.setTimeout> | null = null;

function setOpen(value: boolean) {
  if (closeTimer !== null) {
    window.clearTimeout(closeTimer);
    closeTimer = null;
  }
  open.value = value;
}

function queueClose() {
  if (closeTimer !== null) {
    window.clearTimeout(closeTimer);
  }
  closeTimer = window.setTimeout(() => {
    open.value = false;
    closeTimer = null;
  }, 80);
}

function handleOpenChange(value: boolean) {
  setOpen(value);
}

function syncContentSide() {
  const mobile = window.innerWidth <= 768;
  contentSide.value = mobile ? 'top' : 'right';
  contentAlign.value = mobile ? 'end' : 'center';
}

function shouldUseHoverPointer(event: PointerEvent) {
  return event.pointerType === 'mouse' && window.innerWidth > 768;
}

function handlePointerEnter(event: PointerEvent) {
  if (shouldUseHoverPointer(event)) {
    setOpen(true);
  }
}

function handlePointerLeave(event: PointerEvent) {
  if (shouldUseHoverPointer(event)) {
    queueClose();
  }
}

onMounted(() => {
  syncContentSide();
  window.addEventListener('resize', syncContentSide);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncContentSide);
  if (closeTimer !== null) {
    window.clearTimeout(closeTimer);
  }
});
</script>

<template>
  <Popover :open="open" @update:open="handleOpenChange">
    <span
      class="srk-ranklist-setting-tip"
      :class="{ 'is-open': open }"
      @pointerenter="handlePointerEnter"
      @pointerleave="handlePointerLeave"
    >
      <PopoverTrigger as-child>
        <button
          type="button"
          class="srk-ranklist-setting-label-tip-button"
          :aria-label="content"
          :aria-expanded="open"
          :aria-describedby="open ? `ranklist-setting-tip-popover-${id}` : undefined"
          :data-id="`ranklist-setting-tip-${id}`"
        >
          <Info class="srk-ranklist-setting-label-tip-icon" />
        </button>
      </PopoverTrigger>
    </span>
    <PopoverContent
      :id="`ranklist-setting-tip-popover-${id}`"
      class="srk-ranklist-setting-tip-popover"
      :data-id="`ranklist-setting-tip-popover-${id}`"
      :side="contentSide"
      :align="contentAlign"
      :side-offset="8"
      :collision-padding="8"
      :prioritize-position="true"
      sticky="always"
      role="tooltip"
      @pointerenter="handlePointerEnter"
      @pointerleave="handlePointerLeave"
      @open-auto-focus.prevent
    >
      {{ content }}
    </PopoverContent>
  </Popover>
</template>
