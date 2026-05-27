<template>
  <main data-id="live-page" class="live-page">
    <Head>
      <title>{{ pageTitle }}</title>
      <meta property="og:title" :content="pageTitle">
      <link rel="canonical" :href="canonicalUrl">
    </Head>

    <section v-if="isNotFound" data-id="live-not-found" class="live-state mt-16 text-center">
      <h3 class="mb-4">Ranklist Not Found</h3>
      <router-link to="/" data-id="live-not-found-home-link">
        <a-button type="primary" size="small">Back to Home</a-button>
      </router-link>
    </section>

    <section v-else-if="hasGenericError" data-id="live-error" class="live-state mt-16 text-center">
      <p>An error occurred while loading data</p>
      <a-button data-id="live-refresh" type="primary" size="small" @click="refresh">
        Refresh
      </a-button>
    </section>

    <a-spin v-else-if="!ranklist" data-id="live-loading" class="live-state mt-16 text-center" />

    <section
      v-else
      data-id="live-ranklist-content"
      class="live-content mt-8 mb-8"
      :data-ranklist-id="id"
      :data-live-id="liveId"
      :data-row-count="rowCount"
      :data-focus="focusQuery"
      :class="{ 'live-content-with-scroll-solution': scrollSolutionEnabled }"
    >
      <div data-id="live-hydrated" class="live-hydrated">{{ hydrated ? 'hydrated' : 'csr' }}</div>

      <LiveScrollSolution
        v-if="scrollSolutionEnabled"
        :status="scrollSolutionStatus"
        :solutions="scrollSolutions"
      />
      <RanklandRanklist
        :ranklist="ranklist"
        :name="id"
        :id="id"
        show-header
        show-filter
        show-progress
        show-footer
        is-live
        table-class="ml-4"
      >
        <template #extra-action>
          <label class="live-scroll-toggle">
            <span>实时滚动提交状态</span>
            <a-switch
              data-id="live-scroll-solution-toggle"
              :checked="scrollSolutionEnabled"
              size="small"
              @change="handleScrollSolutionToggle"
            />
          </label>
        </template>
      </RanklandRanklist>
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
import LiveScrollSolution from './live-scroll-solution.vue';
import { classifyLiveLoadError, type LiveLoadErrorState } from './live-error';
import {
  SCROLL_SOLUTION_POP_INTERVAL,
  enqueueScrollSolutions,
  getNextScrollSolutionPop,
  getScrollSolutionDelay,
  getScrollSolutionVisibleLimit,
  type DisplayedScrollSolutionItem,
  type QueuedScrollSolutionItem,
} from './live-scroll-solution-state';
import {
  getLiveWebSocketReconnectDelay,
  getNextLiveWebSocketReconnectAttempt,
} from './live-websocket-reconnect';
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
      scrollSolutionConnectionRunId: 0,
      scrollSolutionReconnectAttempt: 0,
      scrollSolutionReconnectTimer: undefined as number | undefined,
      scrollSolutionStatus: 'disabled',
      scrollSolutions: [] as DisplayedScrollSolutionItem[],
      scrollSolutionQueue: [] as QueuedScrollSolutionItem[],
      scrollSolutionPopTimer: undefined as number | undefined,
      scrollSolutionDismissTimers: [] as number[],
      scrollSolutionSequence: 0,
      scrollSolutionContainerMaxHeight: 0,
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
    scrollSolutionVisibleLimit(): number {
      return getScrollSolutionVisibleLimit(this.scrollSolutionContainerMaxHeight);
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
    this.updateScrollSolutionContainerHeight();
    window.addEventListener('resize', this.updateScrollSolutionContainerHeight);
    this.loadLiveRanklist();
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateScrollSolutionContainerHeight);
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
      this.resetScrollSolutions();
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
      this.scrollSolutionConnectionRunId += 1;
      this.cancelScrollSolutionReconnect();
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      this.stopScrollSolutionQueue();
      for (const timer of this.scrollSolutionDismissTimers) {
        window.clearTimeout(timer);
      }
      this.scrollSolutionDismissTimers = [];
    },
    updateScrollSolutionContainerHeight() {
      this.scrollSolutionContainerMaxHeight = window.innerHeight;
      this.scrollSolutions = this.scrollSolutions.slice(0, this.scrollSolutionVisibleLimit);
    },
    resetScrollSolutions() {
      this.stopScrollSolutionQueue();
      this.scrollSolutions = [];
      this.scrollSolutionQueue = [];
      this.scrollSolutionSequence = 0;
      for (const timer of this.scrollSolutionDismissTimers) {
        window.clearTimeout(timer);
      }
      this.scrollSolutionDismissTimers = [];
    },
    stopScrollSolutionQueue() {
      if (this.scrollSolutionPopTimer !== undefined) {
        window.clearTimeout(this.scrollSolutionPopTimer);
        this.scrollSolutionPopTimer = undefined;
      }
    },
    cancelScrollSolutionReconnect() {
      if (this.scrollSolutionReconnectTimer !== undefined) {
        window.clearTimeout(this.scrollSolutionReconnectTimer);
        this.scrollSolutionReconnectTimer = undefined;
      }
      this.scrollSolutionReconnectAttempt = 0;
    },
    pushScrollSolutions(rows: QueuedScrollSolutionItem[]) {
      const next = enqueueScrollSolutions(this.scrollSolutionQueue, rows);
      this.scrollSolutionQueue = next.queue;
      for (const item of next.immediate) {
        this.showScrollSolution(item, getScrollSolutionDelay(item.result));
      }
      this.scheduleScrollSolutionPop(SCROLL_SOLUTION_POP_INTERVAL);
    },
    showScrollSolution(item: QueuedScrollSolutionItem, delay: number) {
      const key = `${Date.now()}-${this.scrollSolutionSequence}`;
      this.scrollSolutionSequence += 1;
      const displayed = { ...item, key };
      this.scrollSolutions = [displayed, ...this.scrollSolutions].slice(0, this.scrollSolutionVisibleLimit);
      let dismissTimer = 0;
      dismissTimer = window.setTimeout(() => {
        this.scrollSolutions = this.scrollSolutions.filter((solution) => solution.key !== key);
        this.scrollSolutionDismissTimers = this.scrollSolutionDismissTimers.filter((timer) => timer !== dismissTimer);
      }, delay);
      this.scrollSolutionDismissTimers.push(dismissTimer);
    },
    scheduleScrollSolutionPop(interval: number) {
      if (this.scrollSolutionPopTimer !== undefined) {
        return;
      }
      this.scrollSolutionPopTimer = window.setTimeout(() => {
        this.scrollSolutionPopTimer = undefined;
        this.popScrollSolutionFromQueue();
      }, interval);
    },
    popScrollSolutionFromQueue() {
      const [item, ...restQueue] = this.scrollSolutionQueue;
      if (!item) {
        return;
      }

      const timing = getNextScrollSolutionPop({
        queueLength: this.scrollSolutionQueue.length,
        visibleLimit: this.scrollSolutionVisibleLimit,
        result: item.result,
      });
      this.scrollSolutionQueue = restQueue;
      this.showScrollSolution(item, timing.delay);
      if (this.scrollSolutionQueue.length > 0) {
        this.scheduleScrollSolutionPop(timing.interval);
      }
    },
    connectScrollSolution() {
      if (!this.info?.id || !this.scrollSolutionEnabled) {
        this.scrollSolutionStatus = 'disabled';
        return;
      }

      this.cancelScrollSolutionReconnect();
      this.connectScrollSolutionSocket(0, this.scrollSolutionConnectionRunId);
    },
    connectScrollSolutionSocket(attempt: number, runId: number) {
      if (!this.info?.id || !this.scrollSolutionEnabled || runId !== this.scrollSolutionConnectionRunId) {
        return;
      }

      try {
        const tokenQuery = this.tokenQuery ? `?token=${encodeURIComponent(this.tokenQuery)}` : '';
        const ws = new WebSocket(`${getLiveWebSocketBase()}/ranking/record/${this.info.id}${tokenQuery}`);
        ws.binaryType = 'arraybuffer';
        ws.addEventListener('open', () => {
          if (runId !== this.scrollSolutionConnectionRunId) {
            return;
          }
          this.scrollSolutionStatus = 'connected';
          this.scrollSolutionReconnectAttempt = 0;
        });
        ws.addEventListener('message', (event) => {
          if (runId !== this.scrollSolutionConnectionRunId) {
            return;
          }
          if (!(event.data instanceof ArrayBuffer)) {
            return;
          }

          const solution = parseRealtimeSolutionBuffer(event.data);
          const user = this.info?.members.find((member) => member.id === solution.userId);
          if (!user) {
            return;
          }

          this.pushScrollSolutions([
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
          ]);
        });
        ws.addEventListener('close', () => this.handleScrollSolutionSocketFailure(runId));
        ws.addEventListener('error', () => this.handleScrollSolutionSocketFailure(runId));
        this.ws = ws;
      } catch (error) {
        this.handleScrollSolutionSocketFailure(runId);
      }
    },
    handleScrollSolutionSocketFailure(runId: number) {
      if (!this.info?.id || !this.scrollSolutionEnabled || runId !== this.scrollSolutionConnectionRunId) {
        return;
      }
      if (this.scrollSolutionReconnectTimer !== undefined) {
        return;
      }

      const attempt = this.scrollSolutionReconnectAttempt;
      const delay = getLiveWebSocketReconnectDelay(attempt);
      this.scrollSolutionReconnectAttempt = getNextLiveWebSocketReconnectAttempt(attempt);
      this.scrollSolutionStatus = 'reconnecting';
      this.ws = null;
      this.scrollSolutionReconnectTimer = window.setTimeout(() => {
        this.scrollSolutionReconnectTimer = undefined;
        this.connectScrollSolutionSocket(this.scrollSolutionReconnectAttempt, runId);
      }, delay);
    },
    handleScrollSolutionToggle(checked: boolean) {
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
}

.live-state,
.live-content {
  margin-right: 0;
  margin-left: 0;
}

.live-state {
  margin-top: 64px;
  margin-bottom: 32px;
  text-align: center;
}

.live-state h3 {
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

.live-content-with-scroll-solution {
  margin-left: 250px;
  margin-right: 0;
}

.live-hydrated {
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

.live-scroll-toggle {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

@media (max-width: 767px) {
  .live-content-with-scroll-solution {
    margin-right: auto;
    margin-left: auto;
  }

  .live-scroll-toggle {
    display: none;
  }
}
</style>
