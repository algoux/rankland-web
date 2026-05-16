<template>
  <main data-testid="rankland-probe">
    <div data-testid="rankland-probe-title">{{ ranklistTitle }}</div>
    <div data-testid="rankland-probe-key">{{ ranklistUniqueKey }}</div>
    <div data-testid="rankland-probe-row-count">{{ srkRowCount }}</div>
    <div data-testid="rankland-probe-total-srk-count">{{ totalSrkCount }}</div>
    <div data-testid="rankland-probe-render-source">{{ renderSource }}</div>
    <div data-testid="rankland-probe-hydrated">{{ hydrated ? 'hydrated' : 'ssr' }}</div>
    <div data-testid="rankland-probe-client-refresh-count">{{ clientRefreshTotalSrkCount }}</div>
    <button type="button" data-testid="rankland-probe-refresh" @click="refreshStatistics">Refresh</button>
  </main>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { routeView, RenderMethodKind } from 'bwcx-client-vue3';
import type { IApiRanklist, IApiStatistics } from '@common/rankland-api';
import type { AsyncDataOptions } from '@client/typings';
import { useRanklandApiService } from '@client/plugins/rankland-api.plugin';

const RanklandProbe = defineComponent({
  name: 'E2eRanklandProbe',
  props: {
    id: {
      type: String,
      required: true,
    },
    ranklist: {
      type: Object as PropType<IApiRanklist>,
      required: false,
    },
    statistics: {
      type: Object as PropType<IApiStatistics>,
      required: false,
    },
    renderSource: {
      type: String,
      required: false,
      default: 'unknown',
    },
  },
  setup() {
    const ranklandApiService = useRanklandApiService();
    return {
      ranklandApiService,
    };
  },
  data() {
    return {
      hydrated: false,
      clientRefreshTotalSrkCount: 0,
    };
  },
  computed: {
    ranklistTitle(): string {
      return this.ranklist?.info.name || '';
    },
    ranklistUniqueKey(): string {
      return this.ranklist?.info.uniqueKey || '';
    },
    srkRowCount(): number {
      return this.ranklist?.srk?.rows?.length || 0;
    },
    totalSrkCount(): number {
      return this.statistics?.totalSrkCount || 0;
    },
  },
  mounted() {
    this.hydrated = true;
  },
  methods: {
    async refreshStatistics() {
      const statistics = await this.ranklandApiService.getStatistics();
      this.clientRefreshTotalSrkCount += statistics.totalSrkCount;
    },
  },
  async asyncData({ ranklandApiService, to }: AsyncDataOptions) {
    const [ranklist, statistics] = await Promise.all([
      ranklandApiService.getRanklist({ uniqueKey: String(to.params.id) }),
      ranklandApiService.getStatistics(),
    ]);
    return {
      ranklist,
      statistics,
      renderSource: 'asyncData',
    };
  },
});

export default routeView(RanklandProbe, '/__e2e/rankland-probe/:id', undefined, undefined, {
  renderMethod: RenderMethodKind.SSR,
});
</script>
