<template>
  <main>
    <Head>
      <title>{{ pageTitle }}</title>
      <link rel="canonical" :href="canonicalUrl">
    </Head>

    <section v-if="isNotFound" data-id="ranklist-not-found" class="ranklist-state mt-16 text-center">
      <h3 class="mb-4">Ranklist Not Found</h3>
      <router-link to="/" data-id="ranklist-not-found-home-link">
        <a-button type="primary" size="small">Back to Home</a-button>
      </router-link>
    </section>

    <section v-else-if="hasGenericError" data-id="ranklist-error" class="ranklist-state mt-16 text-center">
      <p>An error occurred while loading data</p>
      <a-button data-id="ranklist-refresh" type="primary" size="small" @click="refresh">
        Refresh
      </a-button>
    </section>

    <a-spin v-else-if="!ranklist" data-id="ranklist-loading" class="ranklist-state mt-16 text-center" />

    <section
      v-else
      data-id="ranklist-content"
      class="ranklist-content mt-8 mb-8"
      :data-ranklist-id="ranklistId"
      :data-row-count="rowCount"
    >
      <div data-id="ranklist-hydrated" class="ranklist-hydrated">{{ hydrated ? 'hydrated' : 'ssr' }}</div>
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
.ranklist-state {
  margin-top: 64px;
  text-align: center;
}

.ranklist-state h3 {
  margin: 0 0 16px;
}

.mt-16 {
  margin-top: 64px;
}

.text-center {
  text-align: center;
}

.mb-4 {
  margin-bottom: 16px;
}

.ranklist-hydrated {
  width: 1px;
  height: 1px;
  overflow: hidden;
  color: transparent;
}

.mt-8 {
  margin-top: 32px;
}

.mb-8 {
  margin-bottom: 32px;
}
</style>
