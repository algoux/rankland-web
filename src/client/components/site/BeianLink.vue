<script setup lang="ts">
import { computed } from 'vue';
import { getRanklandRuntimeConfig } from '@/app/config';

defineProps<{
  class?: string;
}>();

const beian = computed(() => getRanklandRuntimeConfig().beian);
</script>

<template>
  <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener" :class="$props.class">
    {{ beian }}
  </a>
</template>
