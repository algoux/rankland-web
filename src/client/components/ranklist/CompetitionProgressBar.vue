<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { secToTimeStr } from '@/utils/time-format.util';

const props = withDefaults(
  defineProps<{
    startAt: number;
    endAt: number;
    frozenLength?: number;
    td?: number;
  }>(),
  {
    frozenLength: 0,
    td: 0,
  },
);

const localTime = ref(Date.now());
let timer: number | undefined;

const length = computed(() => props.endAt - props.startAt);
const currentTime = computed(() => localTime.value - props.td);
const elapsed = computed(() => Math.min(Math.max(currentTime.value - props.startAt, 0), length.value));
const remaining = computed(() => length.value - elapsed.value);
const frozenAt = computed(() => props.endAt - props.frozenLength);
const percent = computed(() => (length.value ? (elapsed.value / length.value) * 100 : 0));
const normalPercent = computed(() =>
  length.value ? (Math.max(Math.min(currentTime.value, frozenAt.value) - props.startAt, 0) / length.value) * 100 : 0,
);

onMounted(() => {
  timer = window.setInterval(() => {
    localTime.value = Date.now();
  }, 1000);
});

onBeforeUnmount(() => {
  if (timer) {
    window.clearInterval(timer);
  }
});
</script>

<template>
  <div>
    <div class="relative h-2 overflow-hidden rounded bg-muted" role="progressbar" :aria-valuenow="Math.round(percent)">
      <div class="absolute inset-y-0 left-0 bg-primary/40" :style="{ width: `${percent}%` }" />
      <div class="absolute inset-y-0 left-0 bg-primary" :style="{ width: `${normalPercent}%` }" />
    </div>
    <div class="mt-1 flex justify-between text-sm text-muted-foreground">
      <div>Elapsed: {{ secToTimeStr(Math.round(elapsed / 1000)) }}</div>
      <div>Remaining: {{ secToTimeStr(Math.round(remaining / 1000)) }}</div>
    </div>
  </div>
</template>
