<script setup lang="ts">
import { computed, ref, useAttrs, watch } from 'vue';
import type * as srk from '@algoux/standard-ranklist';
import { formatSrkAssetUrl } from '@/utils/srk-asset.util';

const props = defineProps<{
  image: srk.Image;
  assetScope?: string;
}>();

const emit = defineEmits<{
  error: [event: Event];
}>();

const attrs = useAttrs();
const hidden = ref(false);
const src = computed(() => formatSrkAssetUrl(props.image as unknown as string, props.assetScope));
const mergedStyle = computed(() => {
  const style = attrs.style;
  if (!hidden.value) {
    return style;
  }
  if (typeof style === 'string') {
    return `${style};display:none`;
  }
  return {
    ...(typeof style === 'object' && style ? style : {}),
    display: 'none',
  };
});

watch(
  () => [props.image, props.assetScope],
  () => {
    hidden.value = false;
  },
);

function handleError(event: Event) {
  hidden.value = true;
  emit('error', event);
}
</script>

<template>
  <img v-bind="attrs" :src="src" :style="mergedStyle" @error="handleError" />
</template>
