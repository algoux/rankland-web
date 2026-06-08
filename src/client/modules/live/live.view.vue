<template>
  <section v-if="errorKind === PageErrorKind.NotFound" class="mt-16 text-center" data-id="live-not-found">
    <Head>
      <title>{{ notFoundTitle }}</title>
    </Head>
    <h1 class="mb-4 text-2xl font-semibold tracking-normal">Ranklist Not Found</h1>
    <router-link to="/" data-id="live-not-found-home-link">
      <Button size="sm">Back to Home</Button>
    </router-link>
  </section>

  <section v-else-if="errorKind === PageErrorKind.LoadFailed" class="mt-16 text-center">
    <Head>
      <title>{{ fallbackTitle }}</title>
    </Head>
    <p class="mb-4 text-muted-foreground">An error occurred while loading data</p>
    <Button size="sm" @click="reloadPage">
      Refresh
    </Button>
  </section>

  <section v-else-if="!ranklist" class="mt-16 text-center">
    <Head>
      <title>{{ fallbackTitle }}</title>
    </Head>
    <Loading />
  </section>

  <section
    v-else
    class="my-8"
    :style="ranklistSectionStyle"
    data-id="live-ranklist-content"
    :data-ranklist-id="liveKey"
    :data-row-count="String(ranklist.rows.length)"
  >
    <Head>
      <title>{{ pageTitle }}</title>
      <meta property="og:title" :content="pageTitle" />
    </Head>
    <StyledRanklist
      :data="ranklist"
      :name="liveKey"
      :id="liveKey"
      show-filter
      show-progress
      show-footer
      is-live
      table-class="ml-4"
    >
      <template #extra-action>
        <span
          v-if="shouldRenderScrollSolutionSwitch"
          class="inline-flex items-center gap-2 text-sm"
          data-id="live-scroll-solution-switch"
        >
          <span>实时滚动提交状态</span>
          <Switch
            class="srk-ranklist-switch"
            :checked="enabledScrollSolution"
            aria-label="实时滚动提交状态"
            @update:checked="handleSwitchScrollSolution"
          />
        </span>
      </template>
    </StyledRanklist>
    <ScrollSolution
      v-if="enabledScrollSolution"
      ref="scrollSolution"
      :container-max-height="clientHeight"
    />
  </section>
</template>

<script lang="ts">
import type * as srk from '@algoux/standard-ranklist';
import { resolveText } from '@algoux/standard-ranklist-utils';
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { View, RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';
import type { AsyncDataOptions } from '@client/typings';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import Loading from '@/components/common/Loading.vue';
import ScrollSolution from './ScrollSolution.vue';
import type { ScrollSolutionDataItem } from './ScrollSolution.vue';
import StyledRanklist from '@/components/ranklist/StyledRanklist.vue';
import { getRanklandRuntimeConfig } from '@/app/config';
import { loadLivePageData, type LivePageData } from './page-data';
import {
  RanklistPageErrorKind,
  shouldLogRanklistPageError,
  writeRanklistPageErrorResponse,
} from '@/domain/ranklist/page-error';
import { formatTitle } from '@/app/title-format';
import { parseRealtimeSolutionBuffer } from '@/utils/realtime-solutions.util';

@View('/live/:id')
@RenderMethod(RenderMethodKind.SSR)
@Options({
  components: {
    Button,
    Loading,
    ScrollSolution,
    StyledRanklist,
    Switch,
  },
})
export default class LiveRanklist extends Vue {
  @Prop() livePageData?: LivePageData;
  @Prop() errorKind?: RanklistPageErrorKind;

  PageErrorKind = RanklistPageErrorKind;
  fallbackTitle = formatTitle('Live');
  notFoundTitle = formatTitle('Not Found');
  clientRanklist: srk.Ranklist | null = null;
  clientWidth = 1024;
  clientHeight = 0;
  private pollTimer: number | undefined;
  private websocket: WebSocket | undefined;
  private currentLiveKey = '';

  get liveKey() {
    const id = this.$route.params.id;
    return Array.isArray(id) ? id[0] : String(id || '');
  }

  get liveId() {
    return this.livePageData?.liveInfo.id || '';
  }

  get token() {
    return firstQueryValue(this.$route.query.token);
  }

  get enabledScrollSolution() {
    return firstQueryValue(this.$route.query.scrollSolution) === '1';
  }

  get ranklist() {
    return this.clientRanklist || this.livePageData?.ranklist;
  }

  get pageTitle() {
    return formatTitle(`Live: ${resolveText(this.ranklist?.contest.title || '')}`);
  }

  get shouldRenderScrollSolutionSwitch() {
    return this.clientWidth >= 768;
  }

  get ranklistSectionStyle() {
    return {
      marginLeft: this.enabledScrollSolution ? '250px' : undefined,
    };
  }

  mounted() {
    this.updateViewport();
    window.addEventListener('resize', this.updateViewport);
    this.syncLiveState();
  }

  updated() {
    this.syncLiveState();
  }

  beforeUnmount() {
    window.removeEventListener('resize', this.updateViewport);
    this.stopPolling();
    this.closeWebsocket();
  }

  reloadPage() {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  handleSwitchScrollSolution(checked: boolean) {
    if (typeof window === 'undefined') {
      return;
    }
    window.setTimeout(() => {
      const searchParams = new URLSearchParams(window.location.search);
      if (checked) {
        searchParams.set('scrollSolution', '1');
      } else {
        searchParams.delete('scrollSolution');
      }
      window.location.search = searchParams.toString();
    }, 250);
  }

  async asyncData({ api, isClient, to, writeResponse }: AsyncDataOptions) {
    const id = Array.isArray(to.params.id) ? to.params.id[0] : String(to.params.id || '');
    const token = firstQueryValue(to.query.token);
    try {
      return {
        livePageData: await loadLivePageData({ api, id, token }),
        errorKind: undefined,
      };
    } catch (error) {
      if (shouldLogRanklistPageError(error)) {
        console.error(error);
      }
      return {
        livePageData: undefined,
        errorKind: writeRanklistPageErrorResponse(error, { isClient, writeResponse }),
      };
    }
  }

  private updateViewport = () => {
    this.clientWidth = window.innerWidth;
    this.clientHeight = window.innerHeight;
  };

  private syncLiveState() {
    const signature = `${this.liveKey}:${this.liveId}:${this.token || ''}:${this.enabledScrollSolution ? 'scroll' : 'plain'}`;
    if (!this.livePageData || signature === this.currentLiveKey) {
      return;
    }
    this.currentLiveKey = signature;
    this.clientRanklist = null;
    this.startPolling();
    this.syncWebsocket();
  }

  private startPolling() {
    this.stopPolling();
    if (!this.liveId) {
      return;
    }
    this.fetchRanklistSnapshot();
    this.pollTimer = window.setInterval(
      this.fetchRanklistSnapshot,
      getRanklandRuntimeConfig().livePollingInterval,
    );
  }

  private stopPolling() {
    if (this.pollTimer !== undefined) {
      window.clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
  }

  private fetchRanklistSnapshot = async () => {
    if (!this.liveId) {
      return;
    }
    try {
      this.clientRanklist = await this.$ranklandApi.getLiveRanklist({
        id: this.liveId,
        token: this.token,
      });
    } catch (error) {
      console.error(error);
    }
  };

  private syncWebsocket() {
    this.closeWebsocket();
    if (!this.enabledScrollSolution || !this.liveId || typeof WebSocket === 'undefined') {
      return;
    }
    const wsBase = getRanklandRuntimeConfig().wsBase;
    if (!wsBase) {
      return;
    }
    try {
      const search = this.token ? `?token=${encodeURIComponent(this.token)}` : '';
      const websocket = new WebSocket(`${wsBase}/ranking/record/${this.liveId}${search}`);
      websocket.binaryType = 'arraybuffer';
      websocket.addEventListener('message', this.handleWebsocketMessage);
      websocket.addEventListener('error', (event) => {
        console.error('[ScrollSolution] ws error:', event);
      });
      this.websocket = websocket;
    } catch (error) {
      console.error('[ScrollSolution] ws exception:', error);
    }
  }

  private closeWebsocket() {
    this.websocket?.removeEventListener('message', this.handleWebsocketMessage);
    this.websocket?.close();
    this.websocket = undefined;
  }

  private handleWebsocketMessage = (event: MessageEvent) => {
    if (!(event.data instanceof ArrayBuffer)) {
      return;
    }
    const solution = parseRealtimeSolutionBuffer(event.data);
    const user = (this.livePageData?.liveInfo.members || []).find((item) => item.id === solution.userId);
    if (!user) {
      console.warn('[ScrollSolution] skipped scroll solution cuz user not found', solution);
      return;
    }
    const ref = this.$refs.scrollSolution as { pushSolutions?: (rows: ScrollSolutionDataItem[]) => void } | undefined;
    ref?.pushSolutions?.([
      {
        problem: {
          alias: solution.problemAlias,
        },
        score: {
          value: solution.solved,
        },
        result: solution.result,
        user: {
          name: user.name,
          organization: user.organization,
        },
      },
    ]);
  };
}

function firstQueryValue(value: unknown) {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : undefined;
  }
  return typeof value === 'string' && value ? value : undefined;
}
</script>
