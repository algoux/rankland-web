<template>
  <section v-if="errorKind === RanklistPageErrorKind.NotFound" class="mt-16 text-center" data-id="ranklist-not-found">
    <Head>
      <title>{{ notFoundTitle }}</title>
    </Head>
    <h1 class="mb-4 text-2xl font-semibold tracking-normal">Ranklist Not Found</h1>
    <router-link to="/" data-id="ranklist-not-found-home-link">
      <Button size="sm">Back to Home</Button>
    </router-link>
  </section>

  <section v-else-if="errorKind === RanklistPageErrorKind.LoadFailed" class="mt-16 text-center">
    <Head>
      <title>{{ fallbackTitle }}</title>
    </Head>
    <p class="mb-4 text-muted-foreground">An error occurred while loading data</p>
    <Button size="sm" @click="reloadPage">
      Refresh
    </Button>
  </section>

  <section v-else-if="!ranklistData" class="mt-16 text-center">
    <Head>
      <title>{{ fallbackTitle }}</title>
    </Head>
    <Loading />
  </section>

  <section
    v-else
    class="my-8 rankland-ranklist-page"
    data-id="ranklist-content"
    :data-ranklist-id="ranklistId"
    :data-row-count="String(ranklistData.srk.rows.length)"
  >
    <Head>
      <title>{{ ranklistTitle }}</title>
      <meta property="og:title" :content="ranklistTitle" />
      <meta property="og:url" :content="ranklistFullUrl" />
      <link rel="canonical" :href="ranklistFullUrl" />
    </Head>
    <StyledRanklist
      :data="ranklistData.srk"
      :name="ranklistId"
      :id="ranklistId"
      :meta="renderedRanklistMeta"
      :srk-url="ranklistSrkUrl"
      show-footer
      show-filter
      table-class="rankland-ranklist-table-frame"
    />
  </section>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { View, RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';
import type { AsyncDataOptions } from '@client/typings';
import type { IApiRanklist } from '@/services/ranklist-api';
import { Button } from '@/components/ui/button';
import Loading from '@/components/common/Loading.vue';
import StyledRanklist from '@/components/ranklist/StyledRanklist.vue';
import { getFullUrl, ranklandRoutes } from '@/app/config';
import {
  RanklistPageErrorKind,
  shouldLogRanklistPageError,
  writeRanklistPageErrorResponse,
} from '@/domain/ranklist/page-error';
import { formatTitle } from '@/app/title-format';
import { RanklistViewReporter } from '@/domain/ranklist/view-reporter';

@View('/ranklist/:id')
@RenderMethod(RenderMethodKind.SSR)
@Options({
  components: {
    Button,
    Loading,
    StyledRanklist,
  },
})
export default class Ranklist extends Vue {
  @Prop() ranklistData?: IApiRanklist;
  @Prop() errorKind?: RanklistPageErrorKind;
  @Prop() reportViewOnClient?: boolean;

  RanklistPageErrorKind = RanklistPageErrorKind;
  fallbackTitle = formatTitle();
  notFoundTitle = formatTitle('Not Found');
  reportedViewCountUK = '';
  private readonly viewReporter = new RanklistViewReporter();

  get ranklistId() {
    const id = this.$route.params.id;
    return Array.isArray(id) ? id[0] : String(id || '');
  }

  get ranklistTitle() {
    return formatTitle(this.ranklistData?.info.name);
  }

  get ranklistFullUrl() {
    return getFullUrl(ranklandRoutes.formatUrl('Ranklist', { id: this.ranklistId }));
  }

  get ranklistSrkUrl() {
    return this.ranklistData?.srkUrl;
  }

  get renderedRanklistMeta() {
    const info = this.ranklistData?.info;
    if (!info || this.reportedViewCountUK !== info.uniqueKey) {
      return info;
    }
    return { ...info, viewCnt: info.viewCnt + 1 };
  }

  mounted() {
    this.reportRenderedRanklistView();
  }

  updated() {
    this.reportRenderedRanklistView();
  }

  reloadPage() {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  async asyncData({ api, isClient, to, writeResponse }: AsyncDataOptions) {
    const id = Array.isArray(to.params.id) ? to.params.id[0] : String(to.params.id || '');
    try {
      const ranklistData = await api.getRanklist({ uniqueKey: id });
      return {
        ranklistData,
        errorKind: undefined,
        reportViewOnClient: isClient,
      };
    } catch (error) {
      if (shouldLogRanklistPageError(error)) {
        console.error(error);
      }
      return {
        ranklistData: undefined,
        errorKind: writeRanklistPageErrorResponse(error, { isClient, writeResponse }),
        reportViewOnClient: isClient,
      };
    }
  }

  private reportRenderedRanklistView() {
    if (!this.reportViewOnClient) {
      return;
    }
    void this.viewReporter.report({
      routeUK: this.ranklistId,
      loadedUK: this.ranklistData?.info.uniqueKey,
      report: (uk) => this.$api.reportPublicContestView({ uk }),
      onSuccess: (uk) => {
        if (this.ranklistId === uk && this.ranklistData?.info.uniqueKey === uk) {
          this.reportedViewCountUK = uk;
        }
      },
      onError: (error, uk) => console.error(`[ranklist] failed to report view for ${uk}`, error),
    });
  }
}
</script>
