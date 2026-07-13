<template></template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { toast } from 'vue-sonner';
import { getRanklandRuntimeConfig } from '@/app/config';
import { loadVinNotice } from '@/app/vin';

onMounted(() => {
  void loadVinNotice({
    url: getRanklandRuntimeConfig().vinUrl,
    fetchImpl: (url) => window.fetch(url),
    storage: getBrowserStorage(),
    showWarning: (message, options) => toast.warning(message, options),
    logError: (message) => console.error(message),
  });
});

function getBrowserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
</script>
