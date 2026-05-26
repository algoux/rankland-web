<template>
  <main>
    <Head>
      <title>{{ pageTitle }}</title>
      <link rel="canonical" :href="canonicalUrl">
    </Head>

    <section v-if="isNotFound" data-id="ranklist-not-found">
      <h1>Ranklist Not Found</h1>
      <router-link to="/" data-id="ranklist-not-found-home-link">Back to Home</router-link>
    </section>

    <section v-else-if="hasGenericError" data-id="ranklist-error">
      <p>An error occurred while loading data</p>
      <button type="button" @click="refresh">Refresh</button>
    </section>

    <section v-else-if="!ranklist" data-id="ranklist-loading">
      Loading
    </section>

    <section
      v-else
      data-id="ranklist-content"
      class="ranklist-content"
      :data-ranklist-id="ranklistId"
      :data-row-count="rowCount"
    >
      <div data-id="ranklist-hydrated">{{ hydrated ? 'hydrated' : 'ssr' }}</div>
      <RanklandRanklist
        :ranklist="ranklist.srk"
        :name="ranklistId"
        :id="ranklistId"
        :meta="ranklist.info"
        show-header
        show-filter
        show-progress
        show-footer
        table-class="ml-4"
      />
    </section>
  </main>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { routeView, RenderMethodKind } from 'bwcx-client-vue3';
import type { IApiRanklist } from '@common/rankland-api';
import { RanklistRPO } from '@common/modules/ranklist/ranklist.rpo';
import type { AsyncDataOptions } from '@client/typings';
import { formatTitle } from '@client/utils/title-format.util';
import RanklandRanklist from '@client/components/rankland-ranklist.vue';
import { classifyRanklistLoadError, type RanklistLoadErrorState } from './ranklist-error';

const RanklistPage = defineComponent({
  name: 'Ranklist',
  components: {
    RanklandRanklist,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
    ranklist: {
      type: Object as PropType<IApiRanklist>,
      required: false,
    },
    loadError: {
      type: Object as PropType<RanklistLoadErrorState>,
      required: false,
    },
  },
  data() {
    return {
      hydrated: false,
    };
  },
  computed: {
    ranklistId(): string {
      return this.id;
    },
    rowCount(): number {
      return this.ranklist?.srk?.rows?.length || 0;
    },
    isNotFound(): boolean {
      return this.loadError?.kind === 'not-found';
    },
    hasGenericError(): boolean {
      return this.loadError?.kind === 'generic';
    },
    pageTitle(): string {
      if (this.isNotFound) {
        return formatTitle('Not Found');
      }

      if (this.ranklist) {
        return formatTitle(this.ranklist.info.name);
      }

      return formatTitle();
    },
    canonicalUrl(): string {
      return `/ranklist/${encodeURIComponent(this.ranklistId)}`;
    },
  },
  mounted() {
    this.hydrated = true;
  },
  methods: {
    refresh() {
      window.location.reload();
    },
  },
  async asyncData({ ranklandApiService, to }: AsyncDataOptions) {
    try {
      const ranklist = await ranklandApiService.getRanklist({ uniqueKey: String(to.params.id) });

      return {
        ranklist,
        loadError: undefined,
      };
    } catch (error) {
      return {
        ranklist: undefined,
        loadError: classifyRanklistLoadError(error),
      };
    }
  },
});

export default routeView(RanklistPage, '/ranklist/:id', RanklistRPO, undefined, {
  renderMethod: RenderMethodKind.SSR,
});
</script>

<style lang="less" scoped>
.ranklist-content {
  margin: 32px 0;
}
</style>
