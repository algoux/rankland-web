<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { ArrowUp } from 'lucide-vue-next';

const visible = ref(false);

function updateVisible() {
  visible.value = window.scrollY > 240;
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}

onMounted(() => {
  updateVisible();
  window.addEventListener('scroll', updateVisible, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateVisible);
});
</script>

<template>
  <button
    v-show="visible"
    class="fixed bottom-6 right-6 inline-flex h-10 w-10 items-center justify-center rounded-md border bg-background text-foreground shadow transition-colors hover:bg-accent hover:text-accent-foreground"
    type="button"
    aria-label="Back to top"
    @click="scrollToTop"
  >
    <ArrowUp data-icon="inline-start" />
  </button>
</template>
