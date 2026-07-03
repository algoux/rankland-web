<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    score: number | null;
    size?: number;
  }>(),
  { size: 16 },
);

const RADIUS = 6.5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const clampedScore = computed(() => (props.score === null ? null : Math.min(Math.max(props.score, 0), 100)));
const dashOffset = computed(() =>
  clampedScore.value === null ? CIRCUMFERENCE : CIRCUMFERENCE * (1 - clampedScore.value / 100),
);
</script>

<template>
  <svg
    class="srk-ranklist-quality-ring"
    :width="size"
    :height="size"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="8" cy="8" r="6.5" stroke="hsl(var(--border))" stroke-width="2" />
    <!-- round linecap would draw a dot at 12 o'clock even for 0, so skip the arc entirely -->
    <circle
      v-if="clampedScore !== null && clampedScore > 0"
      cx="8"
      cy="8"
      r="6.5"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      :stroke-dasharray="CIRCUMFERENCE"
      :stroke-dashoffset="dashOffset"
      transform="rotate(-90 8 8)"
    />
  </svg>
</template>
