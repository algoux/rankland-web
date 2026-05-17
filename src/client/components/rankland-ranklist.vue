<template>
  <div class="rankland-ranklist">
    <Ranklist :data="staticRanklist" striped-rows />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from 'vue';
import type * as srk from '@algoux/standard-ranklist';
import { convertToStaticRanklist } from '@algoux/standard-ranklist-renderer-component-core';
import { Ranklist } from '@algoux/standard-ranklist-renderer-component-vue';
import '@algoux/standard-ranklist-renderer-component-styles';

export default defineComponent({
  name: 'RanklandRanklist',
  components: {
    Ranklist,
  },
  props: {
    ranklist: {
      type: Object as PropType<srk.Ranklist>,
      required: true,
    },
  },
  setup(props) {
    const staticRanklist = computed(() => convertToStaticRanklist(props.ranklist));
    return { staticRanklist };
  },
});
</script>

<style lang="less" scoped>
.rankland-ranklist {
  width: 100%;
  overflow-x: auto;
}
</style>
