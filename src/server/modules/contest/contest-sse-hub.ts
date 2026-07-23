import { Inject, Provide } from 'bwcx-core';
import { performance } from 'node:perf_hooks';
import ContestEventNotificationConfig from '@server/configs/contest-event-notification/contest-event-notification.config';
import {
  compareContestEventWatermarks,
  ContestCommittedWatermark,
  ContestEventWatermark,
  latestContestEventWatermark,
} from './contest-event-watermark';
import {
  contestEventNotificationRuntimeMetrics,
  ContestEventNotificationSource,
} from './contest-event-notification-runtime';

const HEARTBEAT_INTERVAL_MS = 15_000;
const BACKPRESSURE_TIMEOUT_MS = 10_000;
const HEARTBEAT_FRAME = ': heartbeat\n\n';

export interface ContestEventsAvailablePayload extends ContestEventWatermark {
  uk: string;
}

export interface ContestSseResponse {
  write: (chunk: string) => boolean;
  end: () => void;
  on: (event: string, listener: () => void) => unknown;
  removeListener: (event: string, listener: () => void) => unknown;
  destroy?: () => void;
  destroyed?: boolean;
  writableEnded?: boolean;
  writableFinished?: boolean;
}

export interface ContestSseRegistration {
  readonly closed: boolean;
  notifyInitial: (watermark: ContestEventWatermark) => void;
  close: () => void;
}

export interface PreparedContestSseRegistration {
  readonly closed: boolean;
  activate: (watermark: ContestEventWatermark) => void;
  abort: () => void;
}

interface ClientState {
  contestId: string;
  requestUk: string;
  response: ContestSseResponse;
  closed: boolean;
  paused: boolean;
  blocked: boolean;
  lastSent?: ContestEventWatermark;
  pending?: ContestEventWatermark;
  backpressureTimer?: NodeJS.Timeout;
  terminalListener: () => void;
  drainListener: () => void;
  fanoutShard: number;
}

type ContestSseHubConfig = Pick<
  ContestEventNotificationConfig,
  'coalesceWindowMs' | 'fanoutShards' | 'fanoutWindowMs' | 'summaryIntervalMs'
>;

interface FanoutCycle {
  watermark: ContestCommittedWatermark;
  source: ContestEventNotificationSource;
  acceptedAtMonoMs: number;
  shards: ClientState[][];
  order: number[];
  nextOrderIndex: number;
  startedAtMonoMs: number;
}

interface QueuedFanout {
  watermark: ContestCommittedWatermark;
  source: ContestEventNotificationSource;
  acceptedAtMonoMs: number;
}

interface ContestFanoutState {
  latestAccepted?: ContestCommittedWatermark;
  queuedFanout?: QueuedFanout;
  activeCycle?: FanoutCycle;
  timer?: NodeJS.Timeout;
  nextStartShard: number;
  nextRegistrationOrdinal: number;
}

type WatermarkDeliveryOutcome = 'sent' | 'backpressured' | 'pending' | 'suppressed' | 'closed';

@Provide()
export default class ContestSseHub {
  private readonly clients = new Map<string, Set<ClientState>>();
  private readonly fanoutStates = new Map<string, ContestFanoutState>();
  private readonly config: ContestSseHubConfig;
  private heartbeatTimer?: NodeJS.Timeout;
  private summaryTimer?: NodeJS.Timeout;
  private runtimeSummaryStarted = false;
  private lastSummaryEpochMs?: number;
  private lastRuntimeCounters: Record<string, number> = {};
  private draining = false;

  public constructor(
    @Inject(ContestEventNotificationConfig)
    config: Partial<ContestSseHubConfig> = new ContestEventNotificationConfig(),
  ) {
    this.config = {
      coalesceWindowMs: config.coalesceWindowMs ?? 0,
      fanoutShards: config.fanoutShards ?? 1,
      fanoutWindowMs: config.fanoutWindowMs ?? 0,
      summaryIntervalMs: config.summaryIntervalMs ?? 60_000,
    };
  }

  public start(): void {
    if (this.heartbeatTimer || this.draining) {
      return;
    }
    this.heartbeatTimer = setInterval(() => this.sendHeartbeats(), HEARTBEAT_INTERVAL_MS);
    this.heartbeatTimer.unref?.();
    this.lastRuntimeCounters = contestEventNotificationRuntimeMetrics.snapshot().counters;
    contestEventNotificationRuntimeMetrics.takeIntervalMaxima();
    this.lastSummaryEpochMs = Date.now();
    this.runtimeSummaryStarted = true;
    this.summaryTimer = setInterval(() => this.logRuntimeSummary(false), this.config.summaryIntervalMs);
    this.summaryTimer.unref?.();
  }

  public addClient(contestId: string, requestUk: string, response: ContestSseResponse): ContestSseRegistration {
    if (this.draining || !this.isResponseWritable(response)) {
      this.safeEnd(response);
      return closedRegistration();
    }

    const state = this.registerClient(contestId, requestUk, response, false);

    return {
      get closed() {
        return state.closed;
      },
      notifyInitial: (watermark) => this.activateClient(state, watermark),
      close: () => this.closeClient(state, true, state.blocked),
    };
  }

  public prepareClient(
    contestId: string,
    requestUk: string,
    response: ContestSseResponse,
  ): PreparedContestSseRegistration {
    if (this.draining || !this.isResponseWritable(response)) {
      return closedPreparedRegistration();
    }
    const state = this.registerClient(contestId, requestUk, response, true);
    return {
      get closed() {
        return state.closed;
      },
      activate: (watermark) => this.activateClient(state, watermark),
      abort: () => this.closeClient(state, false),
    };
  }

  public notify(watermark: ContestCommittedWatermark, source: ContestEventNotificationSource = 'direct'): void {
    contestEventNotificationRuntimeMetrics.add(`watermark.${source}.calls`);
    const contestClients = this.clients.get(watermark.contestId);
    if (!contestClients) {
      contestEventNotificationRuntimeMetrics.add(`watermark.${source}.noClients`);
      return;
    }
    if (this.scheduledFanoutEnabled()) {
      this.queueFanout(watermark, source);
      return;
    }
    const startedAt = performance.now();
    for (const state of [...contestClients]) {
      contestEventNotificationRuntimeMetrics.add('fanout.clientsVisited');
      this.recordDeliveryOutcome(source, this.sendWatermark(state, watermark));
    }
    contestEventNotificationRuntimeMetrics.add(`watermark.${source}.accepted`);
    contestEventNotificationRuntimeMetrics.observeDuration('fanout.directLoop', performance.now() - startedAt);
  }

  public getActiveContestIds(): string[] {
    return [...this.clients.keys()];
  }

  public hasActiveClients(contestId: string): boolean {
    return (this.clients.get(contestId)?.size ?? 0) > 0;
  }

  public closeContest(contestId: string): void {
    this.cancelFanout(contestId);
    const contestClients = this.clients.get(contestId);
    if (!contestClients) {
      return;
    }
    for (const state of [...contestClients]) {
      this.closeClient(state, !state.paused, state.blocked);
    }
  }

  public beginDraining(): void {
    if (this.draining) {
      return;
    }
    this.draining = true;
    this.cancelAllFanout();
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
    if (this.summaryTimer) {
      clearInterval(this.summaryTimer);
      this.summaryTimer = undefined;
    }
  }

  public closeAll(): void {
    this.cancelAllFanout();
    for (const contestClients of [...this.clients.values()]) {
      for (const state of [...contestClients]) {
        this.closeClient(state, !state.paused, state.blocked);
      }
    }
    if (this.runtimeSummaryStarted) {
      this.logRuntimeSummary(true);
      this.runtimeSummaryStarted = false;
    }
  }

  private sendWatermark(state: ClientState, watermark: ContestEventWatermark): WatermarkDeliveryOutcome {
    if (state.closed) {
      return 'closed';
    }
    if (!this.isResponseWritable(state.response)) {
      this.closeClient(state, false);
      return 'closed';
    }
    if (state.paused) {
      state.pending = state.pending ? latestContestEventWatermark(state.pending, watermark) : { ...watermark };
      return 'pending';
    }

    const current = state.pending
      ? state.lastSent
        ? latestContestEventWatermark(state.lastSent, state.pending)
        : state.pending
      : state.lastSent;
    if (current && compareContestEventWatermarks(watermark, current) <= 0) {
      return 'suppressed';
    }
    if (state.blocked) {
      const latestPending = state.pending ? latestContestEventWatermark(state.pending, watermark) : watermark;
      state.pending = { ...latestPending };
      return 'pending';
    }

    return this.writeEvent(state, watermark);
  }

  private writeEvent(state: ClientState, watermark: ContestEventWatermark): WatermarkDeliveryOutcome {
    const payload: ContestEventsAvailablePayload = {
      uk: state.requestUk,
      latestEventId: watermark.latestEventId,
      streamRevision: watermark.streamRevision,
    };
    const frame = `event: events-available\ndata: ${JSON.stringify(payload)}\n\n`;
    try {
      if (!this.isResponseWritable(state.response)) {
        this.closeClient(state, false);
        return 'closed';
      }
      const writable = state.response.write(frame);
      state.lastSent = { ...watermark };
      if (!writable) {
        this.markBlocked(state);
        return 'backpressured';
      }
      return 'sent';
    } catch (_error) {
      this.closeClient(state, true, true);
      return 'closed';
    }
  }

  private sendHeartbeats(): void {
    for (const contestClients of [...this.clients.values()]) {
      for (const state of [...contestClients]) {
        if (state.closed || state.paused || state.blocked) {
          continue;
        }
        try {
          if (!this.isResponseWritable(state.response)) {
            this.closeClient(state, false);
            continue;
          }
          if (!state.response.write(HEARTBEAT_FRAME)) {
            this.markBlocked(state);
          }
        } catch (_error) {
          this.closeClient(state, true);
        }
      }
    }
  }

  private markBlocked(state: ClientState): void {
    if (state.closed || state.blocked) {
      return;
    }
    state.blocked = true;
    state.backpressureTimer = setTimeout(() => {
      if (state.closed || !state.blocked) {
        return;
      }
      this.warnBackpressureTimeout(state);
      contestEventNotificationRuntimeMetrics.add('backpressure.timeouts');
      this.closeClient(state, true, true);
    }, BACKPRESSURE_TIMEOUT_MS);
    state.backpressureTimer.unref?.();
  }

  private registerClient(
    contestId: string,
    requestUk: string,
    response: ContestSseResponse,
    paused: boolean,
  ): ClientState {
    const fanoutState = this.scheduledFanoutEnabled() ? this.getOrCreateFanoutState(contestId) : undefined;
    const state: ClientState = {
      contestId,
      requestUk,
      response,
      closed: false,
      paused,
      blocked: false,
      terminalListener: () => this.closeClient(state, false),
      drainListener: () => this.handleDrain(state),
      fanoutShard: fanoutState ? fanoutState.nextRegistrationOrdinal++ % this.config.fanoutShards : 0,
    };
    let contestClients = this.clients.get(contestId);
    if (!contestClients) {
      contestClients = new Set();
      this.clients.set(contestId, contestClients);
    }
    contestClients.add(state);
    response.on('close', state.terminalListener);
    response.on('error', state.terminalListener);
    response.on('finish', state.terminalListener);
    response.on('drain', state.drainListener);
    return state;
  }

  private activateClient(state: ClientState, watermark: ContestEventWatermark): void {
    if (state.closed) {
      return;
    }
    const pending = state.pending;
    state.pending = undefined;
    state.paused = false;
    const latestAccepted = this.fanoutStates.get(state.contestId)?.latestAccepted;
    let latest = pending && compareContestEventWatermarks(pending, watermark) > 0 ? pending : watermark;
    if (latestAccepted && compareContestEventWatermarks(latestAccepted, latest) > 0) {
      latest = latestAccepted;
    }
    this.sendWatermark(state, latest);
  }

  private handleDrain(state: ClientState): void {
    if (state.closed || !state.blocked) {
      return;
    }
    this.clearBackpressureTimer(state);
    state.blocked = false;
    contestEventNotificationRuntimeMetrics.add('backpressure.drains');
    const pending = state.pending;
    state.pending = undefined;
    if (pending) {
      this.sendWatermark(state, pending);
    }
  }

  private closeClient(state: ClientState, endResponse: boolean, forceClose = false): void {
    if (state.closed) {
      return;
    }
    state.closed = true;
    state.pending = undefined;
    state.blocked = false;
    this.clearBackpressureTimer(state);
    state.response.removeListener('close', state.terminalListener);
    state.response.removeListener('error', state.terminalListener);
    state.response.removeListener('finish', state.terminalListener);
    state.response.removeListener('drain', state.drainListener);

    const contestClients = this.clients.get(state.contestId);
    contestClients?.delete(state);
    if (contestClients?.size === 0) {
      this.clients.delete(state.contestId);
      this.cancelFanout(state.contestId);
    }
    if (endResponse) {
      if (forceClose) {
        this.safeDestroy(state.response);
      } else {
        this.safeEnd(state.response);
      }
    }
  }

  private clearBackpressureTimer(state: ClientState): void {
    if (!state.backpressureTimer) {
      return;
    }
    clearTimeout(state.backpressureTimer);
    state.backpressureTimer = undefined;
  }

  private scheduledFanoutEnabled(): boolean {
    return this.config.coalesceWindowMs > 0 || this.config.fanoutShards > 1 || this.config.fanoutWindowMs > 0;
  }

  private getOrCreateFanoutState(contestId: string): ContestFanoutState {
    let state = this.fanoutStates.get(contestId);
    if (!state) {
      state = {
        nextStartShard: 0,
        nextRegistrationOrdinal: 0,
      };
      this.fanoutStates.set(contestId, state);
    }
    return state;
  }

  private queueFanout(watermark: ContestCommittedWatermark, source: ContestEventNotificationSource): void {
    if (this.draining) {
      return;
    }
    const state = this.getOrCreateFanoutState(watermark.contestId);
    if (state.latestAccepted && compareContestEventWatermarks(watermark, state.latestAccepted) <= 0) {
      contestEventNotificationRuntimeMetrics.add(`watermark.${source}.stale`);
      return;
    }
    const accepted = { ...watermark };
    if (state.queuedFanout) {
      contestEventNotificationRuntimeMetrics.add(`watermark.${source}.coalesced`);
    }
    state.latestAccepted = accepted;
    state.queuedFanout = {
      watermark: accepted,
      source,
      acceptedAtMonoMs: performance.now(),
    };
    contestEventNotificationRuntimeMetrics.add(`watermark.${source}.accepted`);
    if (!state.activeCycle && !state.timer) {
      this.scheduleFanoutStart(watermark.contestId, state);
    }
  }

  private scheduleFanoutStart(contestId: string, state: ContestFanoutState): void {
    this.scheduleFanoutTimer(contestId, state, this.config.coalesceWindowMs, () => {
      this.startFanoutCycle(contestId, state);
    });
  }

  private startFanoutCycle(contestId: string, state: ContestFanoutState): void {
    if (this.draining || this.fanoutStates.get(contestId) !== state || state.activeCycle) {
      return;
    }
    const queued = state.queuedFanout;
    state.queuedFanout = undefined;
    if (!queued) {
      return;
    }
    const contestClients = this.clients.get(contestId);
    if (!contestClients?.size) {
      this.cancelFanout(contestId);
      return;
    }
    const shards = Array.from({ length: this.config.fanoutShards }, () => [] as ClientState[]);
    for (const client of [...contestClients]) {
      shards[client.fanoutShard]!.push(client);
    }
    const startShard = state.nextStartShard % this.config.fanoutShards;
    const order = Array.from(
      { length: this.config.fanoutShards },
      (_, index) => (startShard + index) % this.config.fanoutShards,
    );
    state.nextStartShard = (startShard + 1) % this.config.fanoutShards;
    state.activeCycle = {
      watermark: queued.watermark,
      source: queued.source,
      acceptedAtMonoMs: queued.acceptedAtMonoMs,
      shards,
      order,
      nextOrderIndex: 0,
      startedAtMonoMs: performance.now(),
    };
    contestEventNotificationRuntimeMetrics.add('fanout.cycles');
    this.flushNextFanoutShard(contestId, state);
  }

  private flushNextFanoutShard(contestId: string, state: ContestFanoutState): void {
    if (this.draining || this.fanoutStates.get(contestId) !== state) {
      return;
    }
    const cycle = state.activeCycle;
    if (!cycle) {
      return;
    }
    const shardIndex = cycle.order[cycle.nextOrderIndex];
    if (shardIndex === undefined) {
      this.finishFanoutCycle(contestId, state);
      return;
    }
    const shard = cycle.shards[shardIndex] ?? [];
    const queued = state.queuedFanout;
    const delivery = queued && compareContestEventWatermarks(queued.watermark, cycle.watermark) > 0 ? queued : cycle;
    const shardStartedAt = performance.now();
    contestEventNotificationRuntimeMetrics.add('fanout.shardFlushes');
    contestEventNotificationRuntimeMetrics.observeMaximum('fanout.clientsPerShardMax', shard.length);
    for (const client of shard) {
      contestEventNotificationRuntimeMetrics.add('fanout.clientsVisited');
      this.recordDeliveryOutcome(delivery.source, this.sendWatermark(client, delivery.watermark));
    }
    contestEventNotificationRuntimeMetrics.observeDuration('fanout.shardLoop', performance.now() - shardStartedAt);
    if (this.fanoutStates.get(contestId) !== state) {
      return;
    }
    cycle.nextOrderIndex += 1;
    if (cycle.nextOrderIndex >= cycle.order.length) {
      this.finishFanoutCycle(contestId, state);
      return;
    }
    const dueAtMs =
      cycle.startedAtMonoMs + (this.config.fanoutWindowMs * cycle.nextOrderIndex) / Math.max(1, cycle.order.length - 1);
    this.scheduleFanoutTimer(contestId, state, Math.max(0, Math.round(dueAtMs - performance.now())), () => {
      this.flushNextFanoutShard(contestId, state);
    });
  }

  private finishFanoutCycle(contestId: string, state: ContestFanoutState): void {
    const cycle = state.activeCycle;
    if (cycle) {
      contestEventNotificationRuntimeMetrics.observeDuration('fanout.cycle', performance.now() - cycle.startedAtMonoMs);
      contestEventNotificationRuntimeMetrics.observeMaximum(
        'fanout.notifyToLastShardMsMax',
        performance.now() - cycle.acceptedAtMonoMs,
      );
    }
    state.activeCycle = undefined;
    if (state.queuedFanout && !state.timer) {
      contestEventNotificationRuntimeMetrics.add('fanout.followupCycles');
      this.scheduleFanoutStart(contestId, state);
    }
  }

  private scheduleFanoutTimer(
    contestId: string,
    state: ContestFanoutState,
    delayMs: number,
    callback: () => void,
  ): void {
    if (this.fanoutStates.get(contestId) !== state) {
      return;
    }
    const dueAtMonoMs = performance.now() + delayMs;
    state.timer = setTimeout(() => {
      if (this.fanoutStates.get(contestId) !== state) {
        return;
      }
      state.timer = undefined;
      contestEventNotificationRuntimeMetrics.observeMaximum(
        'fanout.timerScheduleLagMsMax',
        Math.max(0, performance.now() - dueAtMonoMs),
      );
      callback();
    }, delayMs);
    state.timer.unref?.();
  }

  private cancelFanout(contestId: string): void {
    const state = this.fanoutStates.get(contestId);
    if (!state) {
      return;
    }
    if (state.timer) {
      clearTimeout(state.timer);
      state.timer = undefined;
    }
    state.queuedFanout = undefined;
    state.activeCycle = undefined;
    this.fanoutStates.delete(contestId);
  }

  private cancelAllFanout(): void {
    for (const contestId of [...this.fanoutStates.keys()]) {
      this.cancelFanout(contestId);
    }
  }

  private recordDeliveryOutcome(source: ContestEventNotificationSource, outcome: WatermarkDeliveryOutcome): void {
    contestEventNotificationRuntimeMetrics.add(`fanout.${source}.${outcome}`);
  }

  private logRuntimeSummary(final: boolean): void {
    const runtime = contestEventNotificationRuntimeMetrics.snapshot();
    const intervalMaxima = contestEventNotificationRuntimeMetrics.takeIntervalMaxima();
    const endEpochMs = Date.now();
    const startEpochMs = this.lastSummaryEpochMs ?? endEpochMs;
    const countersDelta = numericRecordDelta(runtime.counters, this.lastRuntimeCounters);
    const activeClients = [...this.clients.values()].reduce((total, clients) => total + clients.size, 0);
    const blockedClients = [...this.clients.values()].reduce(
      (total, clients) => total + [...clients].filter((client) => client.blocked).length,
      0,
    );
    const pendingContests = [...this.fanoutStates.values()].filter(
      (state) => state.queuedFanout || state.activeCycle || state.timer,
    ).length;
    try {
      console.info(
        'contest_event_notification_runtime.summary',
        JSON.stringify({
          capturedAt: new Date(endEpochMs).toISOString(),
          interval: { startEpochMs, endEpochMs },
          final,
          config: this.config,
          gauges: {
            activeClients,
            activeContests: this.clients.size,
            blockedClients,
            pendingContests,
          },
          countersDelta,
          maximaScope: 'interval',
          maxima: intervalMaxima,
        }),
      );
    } catch (_error) {
      // Runtime telemetry cannot alter notification delivery.
    }
    this.lastRuntimeCounters = runtime.counters;
    this.lastSummaryEpochMs = endEpochMs;
  }

  private isResponseWritable(response: ContestSseResponse): boolean {
    return !response.destroyed && !response.writableEnded && !response.writableFinished;
  }

  private safeEnd(response: ContestSseResponse): void {
    if (!this.isResponseWritable(response)) {
      return;
    }
    try {
      response.end();
    } catch (_error) {
      // The registration is already terminal; a transport error cannot revive it.
    }
  }

  private safeDestroy(response: ContestSseResponse): void {
    if (response.destroyed) {
      return;
    }
    if (!response.destroy) {
      this.safeEnd(response);
      return;
    }
    try {
      response.destroy();
    } catch (_error) {
      // The client has already been removed from the Hub.
    }
  }

  private warnBackpressureTimeout(state: ClientState): void {
    try {
      console.warn('contest_event_notification.backpressure_timeout', {
        contestId: state.contestId,
      });
    } catch (_error) {
      // Logging is not allowed to interfere with connection cleanup.
    }
  }
}

function closedRegistration(): ContestSseRegistration {
  return {
    closed: true,
    notifyInitial: () => undefined,
    close: () => undefined,
  };
}

function closedPreparedRegistration(): PreparedContestSseRegistration {
  return {
    closed: true,
    activate: () => undefined,
    abort: () => undefined,
  };
}

function numericRecordDelta(current: Record<string, number>, previous: Record<string, number>): Record<string, number> {
  return Object.fromEntries(
    [...new Set([...Object.keys(current), ...Object.keys(previous)])]
      .sort()
      .map((name) => [name, (current[name] ?? 0) - (previous[name] ?? 0)])
      .filter(([, value]) => value !== 0),
  );
}
