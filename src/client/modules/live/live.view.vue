<template>
  <main data-id="live-page" class="live-page">
    <Head>
      <title>{{ pageTitle }}</title>
      <meta property="og:title" :content="pageTitle">
      <link rel="canonical" :href="canonicalUrl">
    </Head>

    <section v-if="isNotFound" data-id="live-not-found" class="live-state">
      <h1>Ranklist Not Found</h1>
      <router-link to="/" data-id="live-not-found-home-link">Back to Home</router-link>
    </section>

    <section v-else-if="hasGenericError" data-id="live-error" class="live-state">
      <p>An error occurred while loading data</p>
      <pre>{{ loadError?.message }}</pre>
      <button type="button" @click="refresh">Refresh</button>
    </section>

    <section v-else-if="!ranklist" data-id="live-loading" class="live-state">
      Loading
    </section>

    <section
      v-else
      data-id="live-ranklist-content"
      class="live-content"
      :data-ranklist-id="id"
      :data-live-id="liveId"
      :data-row-count="rowCount"
      :data-focus="focusQuery"
    >
      <header class="live-header">
        <div>
          <div data-id="live-hydrated" class="live-hydrated">{{ hydrated ? 'hydrated' : 'csr' }}</div>
          <h1>{{ ranklistTitle }}</h1>
        </div>
        <label class="live-scroll-toggle">
          <span>实时滚动提交状态</span>
          <input
            data-id="live-scroll-solution-toggle"
            type="checkbox"
            :checked="scrollSolutionEnabled"
            @change="handleScrollSolutionToggle"
          >
        </label>
      </header>

      <LiveScrollSolution
        v-if="scrollSolutionEnabled"
        :status="scrollSolutionStatus"
        :solutions="scrollSolutions"
      />
      <RanklandRanklist :ranklist="ranklist" />
    </section>
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { routeView } from 'bwcx-client-vue3';
import type * as srk from '@algoux/standard-ranklist';
import { resolveText } from '@algoux/standard-ranklist-utils';
import type { IApiLiveRanklistInfo } from '@common/rankland-api';
import { LiveRPO } from '@common/modules/live/live.rpo';
import RanklandRanklist from '@client/components/rankland-ranklist.vue';
import { useRanklandApiService } from '@client/plugins/rankland-api.plugin';
import { formatTitle } from '@client/utils/title-format.util';
import LiveScrollSolution, { type LiveScrollSolutionItem } from './live-scroll-solution.vue';
import { classifyLiveLoadError, type LiveLoadErrorState } from './live-error';
import { parseRealtimeSolutionBuffer } from './realtime-solutions';

function firstQueryString(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : undefined;
  }
  return typeof value === 'string' ? value : undefined;
}

function getLivePollingInterval() {
  const interval = Number(process.env.RANKLAND_LIVE_POLLING_INTERVAL);
  return Number.isFinite(interval) && interval > 0 ? interval : 10000;
}

function getLiveWebSocketBase() {
  if (process.env.RANKLAND_WS_BASE) {
    return process.env.RANKLAND_WS_BASE;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
}

const LivePage = defineComponent({
  name: 'Live',
  components: {
    LiveScrollSolution,
    RanklandRanklist,
  },
  props: {
    id: {
      type: String,
      required: true,
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
      info: null as IApiLiveRanklistInfo | null,
      ranklist: null as srk.Ranklist | null,
      loadError: undefined as LiveLoadErrorState | undefined,
      loadingRunId: 0,
      pollRanklistTimer: undefined as number | undefined,
      ws: null as WebSocket | null,
      scrollSolutionStatus: 'disabled',
      scrollSolutions: [] as LiveScrollSolutionItem[],
    };
  },
  computed: {
    tokenQuery(): string | undefined {
      return firstQueryString(this.$route.query.token);
    },
    focusQuery(): string | undefined {
      return firstQueryString(this.$route.query.focus);
    },
    scrollSolutionEnabled(): boolean {
      return firstQueryString(this.$route.query.scrollSolution) === '1';
    },
    liveId(): string {
      return this.info?.id || '';
    },
    rowCount(): number {
      return this.ranklist?.rows?.length || 0;
    },
    ranklistTitle(): string {
      const title = this.ranklist?.contest?.title || this.info?.title;
      return title ? resolveText(title) : 'Live';
    },
    pageTitle(): string {
      if (this.isNotFound) {
        return formatTitle('Not Found');
      }
      return formatTitle(this.ranklistTitle === 'Live' ? 'Live' : `Live: ${this.ranklistTitle}`);
    },
    canonicalUrl(): string {
      return `/live/${encodeURIComponent(this.id)}`;
    },
    isNotFound(): boolean {
      return this.loadError?.kind === 'not-found';
    },
    hasGenericError(): boolean {
      return this.loadError?.kind === 'generic';
    },
  },
  watch: {
    '$route.fullPath'() {
      this.loadLiveRanklist();
    },
  },
  mounted() {
    this.hydrated = true;
    this.loadLiveRanklist();
  },
  beforeUnmount() {
    this.stopLiveUpdates();
  },
  methods: {
    refresh() {
      window.location.reload();
    },
    async loadLiveRanklist() {
      const runId = this.loadingRunId + 1;
      this.loadingRunId = runId;
      this.stopLiveUpdates();
      this.info = null;
      this.ranklist = null;
      this.loadError = undefined;
      this.scrollSolutions = [];
      this.scrollSolutionStatus = this.scrollSolutionEnabled ? 'connecting' : 'disabled';

      try {
        const info = await this.ranklandApiService.getLiveRanklistInfo({ uniqueKey: this.id });
        if (runId !== this.loadingRunId) {
          return;
        }

        this.info = info;
        await this.fetchRanklist(runId);
        this.pollRanklistTimer = window.setInterval(() => {
          this.fetchRanklist(runId);
        }, getLivePollingInterval());
        this.connectScrollSolution();
      } catch (error) {
        if (runId !== this.loadingRunId) {
          return;
        }
        this.loadError = classifyLiveLoadError(error);
      }
    },
    async fetchRanklist(runId: number) {
      if (!this.info?.id) {
        return;
      }

      const ranklist = await this.ranklandApiService.getLiveRanklist({
        id: this.info.id,
        token: this.tokenQuery,
      });
      if (runId === this.loadingRunId) {
        this.ranklist = ranklist;
      }
    },
    stopLiveUpdates() {
      if (this.pollRanklistTimer !== undefined) {
        window.clearInterval(this.pollRanklistTimer);
        this.pollRanklistTimer = undefined;
      }
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
    },
    connectScrollSolution() {
      if (!this.info?.id || !this.scrollSolutionEnabled) {
        this.scrollSolutionStatus = 'disabled';
        return;
      }

      try {
        const tokenQuery = this.tokenQuery ? `?token=${encodeURIComponent(this.tokenQuery)}` : '';
        const ws = new WebSocket(`${getLiveWebSocketBase()}/ranking/record/${this.info.id}${tokenQuery}`);
        ws.binaryType = 'arraybuffer';
        ws.addEventListener('open', () => {
          this.scrollSolutionStatus = 'connected';
        });
        ws.addEventListener('message', (event) => {
          if (!(event.data instanceof ArrayBuffer)) {
            return;
          }

          const solution = parseRealtimeSolutionBuffer(event.data);
          const user = this.info?.members.find((member) => member.id === solution.userId);
          if (!user) {
            return;
          }

          this.scrollSolutions = [
            {
              problemAlias: solution.problemAlias,
              result: solution.result,
              solved: solution.solved,
              user: {
                id: user.id,
                name: resolveText(user.name),
                organization: user.organization ? resolveText(user.organization) : undefined,
              },
            },
            ...this.scrollSolutions,
          ].slice(0, 20);
        });
        ws.addEventListener('close', () => {
          this.scrollSolutionStatus = 'closed';
        });
        ws.addEventListener('error', () => {
          this.scrollSolutionStatus = 'error';
        });
        this.ws = ws;
      } catch (error) {
        this.scrollSolutionStatus = 'error';
      }
    },
    handleScrollSolutionToggle(event: Event) {
      const checked = (event.target as HTMLInputElement).checked;
      const query = { ...this.$route.query };
      if (checked) {
        query.scrollSolution = '1';
      } else {
        delete query.scrollSolution;
      }
      this.$router.replace({ path: this.$route.path, query });
    },
  },
});

export default routeView(LivePage, '/live/:id', LiveRPO);
</script>

<style lang="less" scoped>
.live-page {
  min-height: 70vh;
  padding: 24px 16px;
}

.live-state,
.live-content {
  max-width: 1280px;
  margin: 0 auto;
}

.live-state {
  padding-top: 64px;
  text-align: center;
}

.live-state pre {
  display: inline-block;
  max-width: 100%;
  margin: 12px 0;
  padding: 12px;
  border: 1px solid #fecaca;
  border-radius: 4px;
  color: #991b1b;
  background: #fef2f2;
  text-align: left;
  white-space: pre-wrap;
}

.live-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.live-header h1 {
  margin: 4px 0 0;
  font-size: 24px;
}

.live-hydrated {
  color: #64748b;
  font-size: 12px;
}

.live-scroll-toggle {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  color: #334155;
  font-size: 13px;
}

@media (max-width: 640px) {
  .live-header {
    align-items: stretch;
    flex-direction: column;
  }

  .live-scroll-toggle {
    justify-content: space-between;
  }
}
</style>
