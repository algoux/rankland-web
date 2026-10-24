<template>
  <section v-if="pageErrorKind === PageErrorKind.NotFound" class="mt-16 text-center" data-id="live-not-found">
    <Head>
      <title>{{ notFoundTitle }}</title>
    </Head>
    <h1 class="mb-4 text-2xl font-semibold tracking-normal">Ranklist Not Found</h1>
    <router-link to="/" data-id="live-not-found-home-link">
      <Button size="sm">Back to Home</Button>
    </router-link>
  </section>

  <section v-else-if="pageErrorKind === PageErrorKind.LoadFailed" class="mt-16 text-center">
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
      :id="liveKey"
      :data="ranklist"
      :name="liveKey"
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
import { formatRequestErrorForLog } from '@common/request-error-log';
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
import StyledRanklist from '@/components/ranklist/StyledRanklist.vue';
import {
  createLiveContestTransport,
  loadLivePageData,
  type LivePageData,
} from './page-data';
import {
  RanklistPageErrorKind,
  shouldLogRanklistPageError,
  toRanklistPageErrorKind,
  writeRanklistPageErrorResponse,
} from '@/domain/ranklist/page-error';
import { formatTitle } from '@/app/title-format';
import { ContestEventConsumer } from './contest-event-consumer';
import { LiveRanklistProjector } from './live-ranklist-projector';
import type { LiveScrollSolutionItem } from '@/services/ranklist-api/live-contest-types';
import { SCROLL_SOLUTION_WIDTH } from './scroll-solution-state';

@View('/live/:id')
@RenderMethod(RenderMethodKind.CSR)
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
  clientErrorKind?: RanklistPageErrorKind;
  clientWidth = 1024;
  clientHeight = 0;
  private consumer?: ContestEventConsumer;
  private projector?: LiveRanklistProjector;
  private currentLiveSignature = '';
  private sessionGeneration = 0;
  private pendingLiveRanklist: srk.Ranklist | null = null;
  private pendingScrollItems: LiveScrollSolutionItem[] = [];
  private livePublishFrame?: number;

  get liveKey() {
    const id = this.$route.params.id;
    return Array.isArray(id) ? id[0] : String(id || '');
  }

  get enabledScrollSolution() {
    return firstQueryValue(this.$route.query.scrollSolution) === '1';
  }

  get ranklist() {
    return this.clientRanklist;
  }

  get pageErrorKind() {
    return this.clientErrorKind || this.errorKind;
  }

  get pageTitle() {
    const title = this.ranklist?.contest.title || this.livePageData?.config.contest.title || '';
    return formatTitle(`Live: ${resolveText(title)}`);
  }

  get shouldRenderScrollSolutionSwitch() {
    return this.clientWidth >= 768;
  }

  get ranklistSectionStyle() {
    return {
      marginLeft: this.enabledScrollSolution ? `${SCROLL_SOLUTION_WIDTH}px` : undefined,
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
    this.stopLiveSession();
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
    try {
      return {
        livePageData: await loadLivePageData({ api, id }),
        errorKind: undefined,
      };
    } catch (error) {
      if (shouldLogRanklistPageError(error)) {
        console.error(formatRequestErrorForLog(error));
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
    const pageData = this.livePageData;
    const signature = `${this.liveKey}:${pageData?.requestedUk || ''}:${pageData?.config.uk || ''}:${this.enabledScrollSolution ? 'scroll' : 'plain'}`;
    if (signature === this.currentLiveSignature) {
      return;
    }
    this.currentLiveSignature = signature;
    if (!pageData || pageData.requestedUk !== this.liveKey) {
      this.stopLiveSession();
      this.clientRanklist = null;
      this.clientErrorKind = undefined;
      return;
    }
    this.startLiveSession(pageData.config);
  }

  private startLiveSession(config: LivePageData['config']) {
    this.stopLiveSession();
    const sessionGeneration = this.sessionGeneration;
    this.clientRanklist = null;
    this.clientErrorKind = undefined;

    let projector: LiveRanklistProjector;
    try {
      projector = new LiveRanklistProjector(config);
    } catch (error) {
      this.handleFatalError(error, sessionGeneration);
      return;
    }
    this.projector = projector;
    const consumer = new ContestEventConsumer({
      transport: createLiveContestTransport(this.$ranklandApi),
      onInitialEvents: (events, complete) => {
        if (!this.isSessionCurrent(sessionGeneration)) {
          return;
        }
        projector.ingestInitial(events);
        if (complete) {
          this.clientRanklist = projector.finishInitial();
        }
      },
      onEvents: (events) => {
        if (!this.isSessionCurrent(sessionGeneration)) {
          return;
        }
        const { ranklist, scrollItems } = projector.applyLive(events);
        this.queueLivePublication(ranklist, scrollItems, sessionGeneration);
      },
      onReset: () => {
        if (!this.isSessionCurrent(sessionGeneration)) {
          return;
        }
        this.clearPendingLivePublication();
        this.clientRanklist = projector.reset();
        this.$nextTick(() => {
          if (this.isSessionCurrent(sessionGeneration)) {
            this.scrollSolutionRef()?.resetSolutions?.();
          }
        }).catch((error) => this.handleFatalError(error, sessionGeneration));
      },
      onFatal: (error) => this.handleFatalError(error, sessionGeneration),
    });
    this.consumer = consumer;
    consumer.start(config.uk).catch((error) => {
      this.handleFatalError(error, sessionGeneration);
    });
  }

  private stopLiveSession() {
    this.sessionGeneration += 1;
    this.clearPendingLivePublication();
    this.consumer?.stop();
    this.consumer = undefined;
    this.projector = undefined;
    this.scrollSolutionRef()?.resetSolutions?.();
  }

  private handleFatalError(error: unknown, sessionGeneration: number) {
    if (!this.isSessionCurrent(sessionGeneration)) {
      return;
    }
    if (shouldLogRanklistPageError(error)) {
      console.error(formatRequestErrorForLog(error));
    }
    this.clearPendingLivePublication();
    this.clientRanklist = null;
    this.clientErrorKind = toRanklistPageErrorKind(error);
    this.scrollSolutionRef()?.resetSolutions?.();
  }

  private isSessionCurrent(sessionGeneration: number) {
    return sessionGeneration === this.sessionGeneration;
  }

  private queueLivePublication(
    ranklist: srk.Ranklist,
    scrollItems: LiveScrollSolutionItem[],
    sessionGeneration: number,
  ) {
    this.pendingLiveRanklist = ranklist;
    if (this.enabledScrollSolution && scrollItems.length > 0) {
      this.pendingScrollItems.push(...scrollItems);
    }
    if (this.livePublishFrame !== undefined) {
      return;
    }
    this.livePublishFrame = window.requestAnimationFrame(() => {
      this.livePublishFrame = undefined;
      if (!this.isSessionCurrent(sessionGeneration)) {
        return;
      }
      const pendingRanklist = this.pendingLiveRanklist;
      const pendingScrollItems = this.pendingScrollItems;
      this.pendingLiveRanklist = null;
      this.pendingScrollItems = [];
      if (pendingRanklist) {
        this.clientRanklist = pendingRanklist;
      }
      if (pendingScrollItems.length > 0) {
        this.$nextTick(() => {
          if (this.isSessionCurrent(sessionGeneration)) {
            this.scrollSolutionRef()?.pushSolutions?.(pendingScrollItems);
          }
        }).catch((error) => this.handleFatalError(error, sessionGeneration));
      }
    });
  }

  private clearPendingLivePublication() {
    if (this.livePublishFrame !== undefined && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.livePublishFrame);
    }
    this.livePublishFrame = undefined;
    this.pendingLiveRanklist = null;
    this.pendingScrollItems = [];
  }

  private scrollSolutionRef() {
    return this.$refs.scrollSolution as {
      pushSolutions?: (rows: LiveScrollSolutionItem[]) => void;
      resetSolutions?: () => void;
    } | undefined;
  }
}

function firstQueryValue(value: unknown) {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : undefined;
  }
  return typeof value === 'string' && value ? value : undefined;
}
</script>
