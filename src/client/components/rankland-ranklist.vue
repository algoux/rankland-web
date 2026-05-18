<template>
  <div class="rankland-ranklist">
    <div v-if="ranklistState.kind === 'error'" data-id="rankland-ranklist-render-error" class="rankland-ranklist-error">
      <h3>Error occurred when rendering srk</h3>
      <pre>{{ ranklistState.message }}</pre>
    </div>
    <Ranklist v-else :data="ranklistState.staticRanklist" striped-rows />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from 'vue';
import type * as srk from '@algoux/standard-ranklist';
import { Ranklist } from '@algoux/standard-ranklist-renderer-component-vue';
import '@algoux/standard-ranklist-renderer-component-styles';
import { createRanklandRanklistState } from './rankland-ranklist-state';

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
    const ranklistState = computed(() => createRanklandRanklistState(props.ranklist));
    return { ranklistState };
  },
});
</script>

<style lang="less" scoped>
.rankland-ranklist {
  width: 100%;
  overflow-x: auto;
}

.rankland-ranklist-error {
  padding: 16px;
  border: 1px solid #fecaca;
  border-radius: 4px;
  color: #991b1b;
  background: #fef2f2;

  pre {
    margin: 8px 0 0;
    white-space: pre-wrap;
  }
}
</style>
