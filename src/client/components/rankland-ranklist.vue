<template>
  <div class="rankland-ranklist">
    <Ranklist :data="staticRanklist" striped-rows />
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
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
  computed: {
    staticRanklist() {
      return convertToStaticRanklist(this.ranklist);
    },
  },
});
</script>

<style lang="less" scoped>
.rankland-ranklist {
  width: 100%;
  overflow-x: auto;
}
</style>
