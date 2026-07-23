import { Inject, Provide } from 'bwcx-core';
import ContestEventStreamService from './contest-event-stream.service';
import ContestSseHub, { ContestSseResponse } from './contest-sse-hub';
import { ContestCommittedWatermark } from './contest-event-watermark';
import ContestEventNotificationRedisAdapter from './contest-event-notification.redis';
import { promises as fs } from 'fs';
import ContestEventReadCache from './contest-event-read-cache';
import type { ContestEventCacheControl } from './contest-event-cache-control';
import { ContestReadableEvent } from './contest-event-store';
import ContestEventReadCacheConfig from '@server/configs/contest-event-read-cache/contest-event-read-cache.config';
import { contestEventReadMetrics } from './contest-event-read-metrics';
import { performance } from 'node:perf_hooks';
import { contestEventNotificationRuntimeMetrics } from './contest-event-notification-runtime';
import type { PreparedContestSseRegistration } from './contest-sse-hub';
import HttpException from '@server/exceptions/http.exception';

const RECONCILE_INTERVAL_MS = 5_000;
const ERROR_LOG_INTERVAL_MS = 30_000;

interface PendingAttachment {
  response: ContestSseResponse;
  closed: boolean;
  cancelledByStop: boolean;
  terminalListener: () => void;
}

interface PostRegistrationAuthorityRequest {
  uk: string;
  contestId: string;
  resolve: (state: Awaited<ReturnType<ContestEventStreamService['getFreshAuthoritativeStreamState']>>) => void;
  reject: (error: unknown) => void;
}

interface PostRegistrationAuthorityBatch {
  requests: PostRegistrationAuthorityRequest[];
  cancelled: boolean;
}

export interface PreparedContestSseAttachment {
  readonly closed: boolean;
  activate: () => void;
  abort: () => void;
}

@Provide()
export default class ContestEventNotificationCoordinator {
  private readonly pendingAttachments = new Set<PendingAttachment>();
  private started = false;
  private stopping = false;
  private phaseDelayMs?: number;
  private phaseTimer?: NodeJS.Timeout;
  private reconcileTimer?: NodeJS.Timeout;
  private reconcileInFlight = false;
  private lastReconcileErrorLogAt?: number;
  private suppressedReconcileErrors = 0;
  private reconcileDegraded = false;
  private postRegistrationAuthorityBatch?: PostRegistrationAuthorityBatch;

  public constructor(
    @Inject(ContestEventStreamService)
    private readonly eventStreamService: ContestEventStreamService,
    @Inject(ContestSseHub)
    private readonly hub: ContestSseHub,
    @Inject(ContestEventNotificationRedisAdapter)
    private readonly redisAdapter?: ContestEventNotificationRedisAdapter,
    @Inject(ContestEventReadCache)
    private readonly readCache?: ContestEventReadCache,
    @Inject(ContestEventReadCacheConfig)
    private readonly readCacheConfig?: Partial<
      Pick<
        ContestEventReadCacheConfig,
        | 'mode'
        | 'hotAuthorityRefreshMs'
        | 'reconciliationMaxMs'
        | 'retryAfterSeconds'
        | 'bootstrapAuthorityCoalescingEnabled'
        | 'eagerTailFillEnabled'
        | 'eagerNotifyWaitMs'
      >
    >,
  ) {}

  public start(): Promise<void> {
    if (this.started || this.stopping) {
      return Promise.resolve();
    }
    this.started = true;
    this.readCache?.start();
    this.hub.start();
    const reconcileIntervalMs = this.getReconcileIntervalMs();
    this.phaseDelayMs ??= Math.floor(Math.random() * reconcileIntervalMs);
    this.phaseTimer = setTimeout(() => {
      this.phaseTimer = undefined;
      if (this.stopping) {
        return;
      }
      this.reconcile().catch(() => undefined);
      this.reconcileTimer = setInterval(() => {
        this.reconcile().catch(() => undefined);
      }, reconcileIntervalMs);
      this.reconcileTimer.unref?.();
    }, this.phaseDelayMs);
    this.phaseTimer.unref?.();
    if (this.redisAdapter) {
      try {
        const starting = this.redisAdapter.start({
          onWatermark: (watermark) => this.notifyFromRedis(watermark),
          onControl: (control) => this.notifyControlFromRedis(control),
          onSubscribed: () => this.reconcile(),
        });
        Promise.resolve(starting).catch((error) => {
          this.safeWarn('contest_event_notification.redis_start_failed', {
            errorClass: getErrorClass(error),
          });
        });
      } catch (error) {
        this.safeWarn('contest_event_notification.redis_start_failed', {
          errorClass: getErrorClass(error),
        });
      }
    }
    return Promise.resolve();
  }

  public async attachClient(uk: string, response: ContestSseResponse): Promise<void> {
    try {
      const prepared = await this.prepareClient(uk, response);
      prepared.activate();
    } catch (_error) {
      this.safeEnd(response);
    }
  }

  public async prepareClient(uk: string, response: ContestSseResponse): Promise<PreparedContestSseAttachment> {
    if (this.stopping) {
      throw this.attachmentTemporarilyUnavailable();
    }

    const pending = this.createPendingAttachment(response);
    let registration: PreparedContestSseRegistration | undefined;
    try {
      const identity = await this.eventStreamService.getCanonicalStreamState(uk);
      if (pending.closed) {
        if (pending.cancelledByStop && isResponseWritable(response)) {
          throw this.attachmentTemporarilyUnavailable();
        }
        return closedPreparedAttachment();
      }
      if (this.stopping) {
        throw this.attachmentTemporarilyUnavailable();
      }
      this.removePendingAttachment(pending);
      registration = this.hub.prepareClient(identity.contestId, uk, response);
      if (registration.closed) {
        if (!isResponseWritable(response)) {
          return closedPreparedAttachment();
        }
        throw this.attachmentTemporarilyUnavailable();
      }

      const current = await this.readPostRegistrationAuthority(uk, identity.contestId);
      if (this.stopping) {
        throw this.attachmentTemporarilyUnavailable();
      }
      if (registration.closed) {
        if (isResponseWritable(response)) {
          throw this.attachmentTemporarilyUnavailable();
        }
        return closedPreparedAttachment();
      }
      if (current.contestId !== identity.contestId || current.uk !== identity.uk) {
        throw this.attachmentTemporarilyUnavailable();
      }
      const initialWatermark = {
        latestEventId: current.lastEventId,
        streamRevision: current.streamRevision,
      };
      const preparedRegistration = registration;
      return {
        get closed() {
          return preparedRegistration.closed;
        },
        activate: () => preparedRegistration.activate(initialWatermark),
        abort: () => preparedRegistration.abort(),
      };
    } catch (error) {
      registration?.abort();
      throw error;
    } finally {
      this.removePendingAttachment(pending);
    }
  }

  public async announceCommitted(
    watermark: ContestCommittedWatermark,
    committedEvents: readonly ContestReadableEvent[] = [],
  ): Promise<void> {
    if (this.stopping) {
      return;
    }
    const announceStartedAt = performance.now();
    contestEventNotificationRuntimeMetrics.add('append.announcements');
    const cacheStartedAt = performance.now();
    try {
      if (committedEvents.length > 0) {
        this.readCache?.observeCommittedAppend({
          contestId: watermark.contestId,
          canonicalUk: watermark.canonicalUk,
          streamRevision: watermark.streamRevision,
          lastEventId: watermark.latestEventId,
          events: committedEvents,
        });
      } else {
        this.readCache?.observeWatermark(watermark);
      }
    } catch (error) {
      try {
        this.readCache?.invalidate({
          type: 'metadata',
          contestId: watermark.contestId,
          canonicalUk: watermark.canonicalUk,
          visibilityFingerprint: 'unknown',
        });
      } catch (failClosedError) {
        this.disableReadCacheContest(watermark.contestId);
        this.safeWarn('contest_event_read_cache.local_fail_close_failed', {
          contestId: watermark.contestId,
          errorClass: getErrorClass(failClosedError),
        });
      }
      this.safeWarn('contest_event_read_cache.local_commit_failed', {
        contestId: watermark.contestId,
        errorClass: getErrorClass(error),
      });
    } finally {
      contestEventNotificationRuntimeMetrics.observeDuration('append.cacheObserve', performance.now() - cacheStartedAt);
    }
    const localNotifyStartedAt = performance.now();
    try {
      this.hub.notify(watermark, 'local');
    } catch (error) {
      contestEventNotificationRuntimeMetrics.add('append.localNotifyFailures');
      this.safeWarn('contest_event_notification.local_notify_failed', {
        contestId: watermark.contestId,
        errorClass: getErrorClass(error),
      });
    } finally {
      contestEventNotificationRuntimeMetrics.observeDuration(
        'append.localNotify',
        performance.now() - localNotifyStartedAt,
      );
    }
    if (this.redisAdapter) {
      const publishStartedAt = performance.now();
      try {
        await this.waitAtTestCommitPublishBarrier(watermark);
        await this.redisAdapter.publish(watermark);
        contestEventNotificationRuntimeMetrics.add('append.redisPublishSucceeded');
      } catch (error) {
        contestEventNotificationRuntimeMetrics.add('append.redisPublishFailed');
        this.safeWarn('contest_event_notification.publish_failed', {
          contestId: watermark.contestId,
          errorClass: getErrorClass(error),
        });
      } finally {
        contestEventNotificationRuntimeMetrics.observeDuration(
          'append.redisPublish',
          performance.now() - publishStartedAt,
        );
      }
    } else {
      contestEventNotificationRuntimeMetrics.add('append.redisPublishSkipped');
    }
    contestEventNotificationRuntimeMetrics.observeDuration(
      'append.announceTotal',
      performance.now() - announceStartedAt,
    );
  }

  public async announceControl(control: ContestEventCacheControl): Promise<void> {
    if (this.stopping) {
      return;
    }
    try {
      this.readCache?.invalidate(control);
    } catch (error) {
      this.disableReadCacheContest(control.contestId);
      this.safeWarn('contest_event_read_cache.local_control_failed', {
        contestId: control.contestId,
        errorClass: getErrorClass(error),
      });
    }
    if (control.type === 'delete') {
      try {
        this.hub.closeContest(control.contestId);
      } catch (error) {
        this.safeWarn('contest_event_notification.local_close_failed', {
          contestId: control.contestId,
          errorClass: getErrorClass(error),
        });
      }
    }
    if (!this.redisAdapter) {
      return;
    }
    try {
      await this.redisAdapter.publishControl(control);
    } catch (error) {
      this.safeWarn('contest_event_read_cache.control_publish_failed', {
        contestId: control.contestId,
        errorClass: getErrorClass(error),
      });
    }
  }

  public stop(): Promise<void> {
    if (this.stopping) {
      return Promise.resolve();
    }
    this.stopping = true;
    this.started = false;
    this.cancelPostRegistrationAuthorityBatch();
    this.readCache?.dispose();
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = undefined;
    }
    if (this.reconcileTimer) {
      clearInterval(this.reconcileTimer);
      this.reconcileTimer = undefined;
    }
    for (const pending of [...this.pendingAttachments]) {
      pending.closed = true;
      pending.cancelledByStop = true;
      this.removePendingAttachment(pending);
    }
    this.hub.beginDraining();
    this.hub.closeAll();
    if (this.redisAdapter) {
      try {
        const stopping = this.redisAdapter.stop();
        Promise.resolve(stopping).catch((error) => {
          this.safeWarn('contest_event_notification.redis_stop_failed', {
            errorClass: getErrorClass(error),
          });
        });
      } catch (error) {
        this.safeWarn('contest_event_notification.redis_stop_failed', {
          errorClass: getErrorClass(error),
        });
      }
    }
    return Promise.resolve();
  }

  private async notifyFromRedis(watermark: ContestCommittedWatermark): Promise<void> {
    if (this.stopping) {
      return;
    }
    try {
      this.readCache?.observeWatermark(watermark);
    } catch (error) {
      this.disableReadCacheContest(watermark.contestId);
      this.safeWarn('contest_event_read_cache.remote_watermark_failed', {
        contestId: watermark.contestId,
        errorClass: getErrorClass(error),
      });
    }
    await this.waitForEagerTailFill(watermark);
    if (this.stopping) {
      return;
    }
    try {
      this.hub.notify(watermark, 'redis');
    } catch (error) {
      this.safeWarn('contest_event_notification.local_notify_failed', {
        contestId: watermark.contestId,
        errorClass: getErrorClass(error),
      });
    }
  }

  private notifyControlFromRedis(control: ContestEventCacheControl): void {
    if (this.stopping) {
      return;
    }
    try {
      this.readCache?.invalidate(control);
    } catch (error) {
      this.disableReadCacheContest(control.contestId);
      this.safeWarn('contest_event_read_cache.remote_control_failed', {
        contestId: control.contestId,
        errorClass: getErrorClass(error),
      });
    }
    if (control.type === 'delete') {
      try {
        this.hub.closeContest(control.contestId);
      } catch (error) {
        this.safeWarn('contest_event_notification.local_close_failed', {
          contestId: control.contestId,
          errorClass: getErrorClass(error),
        });
      }
    }
  }

  private disableReadCacheContest(contestId: string): void {
    if (!this.readCache) {
      return;
    }
    try {
      this.readCache.disableContest(contestId);
    } catch (error) {
      try {
        this.readCache.disable();
      } catch (globalDisableError) {
        this.safeWarn('contest_event_read_cache.global_disable_failed', {
          errorClass: getErrorClass(globalDisableError),
        });
      }
      this.safeWarn('contest_event_read_cache.contest_disable_failed', {
        contestId,
        errorClass: getErrorClass(error),
      });
    }
  }

  private async waitAtTestCommitPublishBarrier(watermark: ContestCommittedWatermark): Promise<void> {
    if (process.env.RANKLAND_ENABLE_TEST_HOOKS !== 'true') {
      return;
    }
    const markerPath = process.env.RANKLAND_TEST_CONTEST_NOTIFICATION_BARRIER_FILE;
    if (!markerPath) {
      return;
    }
    await fs.writeFile(markerPath, JSON.stringify(watermark), 'utf8');
    const releasePath = `${markerPath}.release`;
    while (!this.stopping) {
      try {
        await fs.access(releasePath);
        return;
      } catch (_error) {
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
      }
    }
  }

  private async reconcile(): Promise<void> {
    if (this.stopping || this.reconcileInFlight) {
      return;
    }
    const hubContestIds = this.hub.getActiveContestIds();
    const activeContestIds = [...new Set([...hubContestIds, ...(this.readCache?.getActiveContestIds() ?? [])])];
    if (activeContestIds.length === 0) {
      return;
    }

    this.reconcileInFlight = true;
    const calibrationContext = this.readCache?.beginCalibration(activeContestIds);
    try {
      const states = await this.eventStreamService.getAuthoritativeCacheStates(activeContestIds);
      if (this.stopping) {
        return;
      }
      this.readCache?.calibrate(states, calibrationContext);
      const statesByContestId = new Map(states.map((state) => [state.contestId, state]));
      const notifications: ContestCommittedWatermark[] = [];
      for (const contestId of activeContestIds) {
        const state = statesByContestId.get(contestId);
        if (!state) {
          if (hubContestIds.includes(contestId)) {
            this.hub.closeContest(contestId);
          }
          continue;
        }
        if (!hubContestIds.includes(contestId)) {
          continue;
        }
        notifications.push({
          contestId: state.contestId,
          canonicalUk: state.canonicalUk,
          latestEventId: state.lastEventId,
          streamRevision: state.streamRevision,
        });
      }
      await Promise.all(
        notifications.map(async (watermark) => {
          await this.waitForEagerTailFill(watermark);
          if (this.stopping) {
            return;
          }
          try {
            this.hub.notify(watermark, 'reconcile');
          } catch (error) {
            this.safeWarn('contest_event_notification.local_notify_failed', {
              contestId: watermark.contestId,
              errorClass: getErrorClass(error),
            });
          }
        }),
      );
      this.logReconcileRecovery(activeContestIds.length);
    } catch (error) {
      if (!this.stopping) {
        this.logReconcileFailure(error, activeContestIds.length);
      }
    } finally {
      this.reconcileInFlight = false;
    }
  }

  private createPendingAttachment(response: ContestSseResponse): PendingAttachment {
    const pending: PendingAttachment = {
      response,
      closed: false,
      cancelledByStop: false,
      terminalListener: () => {
        pending.closed = true;
        this.removePendingAttachment(pending);
      },
    };
    response.on('close', pending.terminalListener);
    response.on('error', pending.terminalListener);
    response.on('finish', pending.terminalListener);
    this.pendingAttachments.add(pending);
    return pending;
  }

  private readPostRegistrationAuthority(
    uk: string,
    contestId: string,
  ): Promise<Awaited<ReturnType<ContestEventStreamService['getFreshAuthoritativeStreamState']>>> {
    if (this.stopping) {
      return Promise.reject(this.attachmentTemporarilyUnavailable());
    }
    if (this.readCacheConfig?.bootstrapAuthorityCoalescingEnabled === false) {
      return this.eventStreamService.getFreshAuthoritativeStreamState(uk);
    }
    let batch = this.postRegistrationAuthorityBatch;
    if (!batch) {
      batch = { requests: [], cancelled: false };
      this.postRegistrationAuthorityBatch = batch;
      queueMicrotask(() => {
        this.flushPostRegistrationAuthorityBatch(batch as PostRegistrationAuthorityBatch).catch(() => undefined);
      });
    }
    return new Promise((resolve, reject) => {
      batch.requests.push({ uk, contestId, resolve, reject });
    });
  }

  private async flushPostRegistrationAuthorityBatch(batch: PostRegistrationAuthorityBatch): Promise<void> {
    if (batch.cancelled) {
      return;
    }
    if (this.postRegistrationAuthorityBatch === batch) {
      this.postRegistrationAuthorityBatch = undefined;
    }
    if (this.stopping) {
      this.rejectPostRegistrationAuthorityBatch(batch, this.attachmentTemporarilyUnavailable());
      return;
    }
    contestEventReadMetrics.add('attachmentAuthorityBatchCalls');
    contestEventReadMetrics.add('attachmentAuthorityBatchRegistrations', batch.requests.length);
    const requestsByContestId = new Map<string, PostRegistrationAuthorityRequest[]>();
    for (const request of batch.requests) {
      const requests = requestsByContestId.get(request.contestId) ?? [];
      requests.push(request);
      requestsByContestId.set(request.contestId, requests);
    }
    let states: Awaited<ReturnType<ContestEventStreamService['getAuthoritativeStreamStates']>>;
    try {
      states = await this.eventStreamService.getAuthoritativeStreamStates([...requestsByContestId.keys()]);
    } catch (error) {
      for (const request of batch.requests) {
        request.reject(error);
      }
      return;
    }
    const statesByContestId = new Map(states.map((state) => [state.contestId, state]));
    for (const [contestId, requests] of requestsByContestId) {
      const state = statesByContestId.get(contestId);
      for (const request of requests) {
        if (!state) {
          request.reject(this.attachmentTemporarilyUnavailable());
        } else {
          request.resolve(state);
        }
      }
    }
  }

  private cancelPostRegistrationAuthorityBatch(): void {
    const batch = this.postRegistrationAuthorityBatch;
    if (!batch) {
      return;
    }
    this.postRegistrationAuthorityBatch = undefined;
    batch.cancelled = true;
    this.rejectPostRegistrationAuthorityBatch(batch, this.attachmentTemporarilyUnavailable());
  }

  private rejectPostRegistrationAuthorityBatch(batch: PostRegistrationAuthorityBatch, error: Error): void {
    for (const request of batch.requests) {
      request.reject(error);
    }
    batch.requests.length = 0;
  }

  private removePendingAttachment(pending: PendingAttachment): void {
    if (!this.pendingAttachments.delete(pending)) {
      return;
    }
    pending.response.removeListener('close', pending.terminalListener);
    pending.response.removeListener('error', pending.terminalListener);
    pending.response.removeListener('finish', pending.terminalListener);
  }

  private attachmentTemporarilyUnavailable(): HttpException {
    return new HttpException(503, {
      'Retry-After': String(this.readCacheConfig?.retryAfterSeconds ?? 1),
    });
  }

  private safeEnd(response: ContestSseResponse): void {
    if (response.destroyed || response.writableEnded || response.writableFinished) {
      return;
    }
    try {
      response.end();
    } catch (_error) {
      // Closing an SSE response is best effort and must remain terminal.
    }
  }

  private logReconcileFailure(error: unknown, activeContestCount: number): void {
    this.reconcileDegraded = true;
    const now = Date.now();
    if (this.lastReconcileErrorLogAt !== undefined && now - this.lastReconcileErrorLogAt < ERROR_LOG_INTERVAL_MS) {
      this.suppressedReconcileErrors += 1;
      return;
    }
    this.safeWarn('contest_event_notification.reconcile_failed', {
      activeContestCount,
      errorClass: getErrorClass(error),
      suppressedCount: this.suppressedReconcileErrors,
    });
    this.lastReconcileErrorLogAt = now;
    this.suppressedReconcileErrors = 0;
  }

  private logReconcileRecovery(activeContestCount: number): void {
    if (!this.reconcileDegraded) {
      return;
    }
    this.reconcileDegraded = false;
    try {
      console.info('contest_event_notification.reconcile_recovered', {
        activeContestCount,
        suppressedCount: this.suppressedReconcileErrors,
      });
    } catch (_error) {
      // Logging cannot affect notification delivery.
    }
    this.lastReconcileErrorLogAt = undefined;
    this.suppressedReconcileErrors = 0;
  }

  private safeWarn(event: string, details: Record<string, unknown>): void {
    try {
      console.warn(event, details);
    } catch (_error) {
      // Logging cannot affect notification delivery.
    }
  }

  private getReconcileIntervalMs(): number {
    return Math.min(
      this.readCacheConfig?.hotAuthorityRefreshMs ?? RECONCILE_INTERVAL_MS,
      this.readCacheConfig?.reconciliationMaxMs ?? RECONCILE_INTERVAL_MS,
    );
  }

  private async waitForEagerTailFill(watermark: ContestCommittedWatermark): Promise<void> {
    const materialize = this.readCache?.materializeObservedWatermark;
    if (
      !materialize ||
      (this.readCacheConfig?.mode ?? 'on') !== 'on' ||
      this.readCacheConfig?.eagerTailFillEnabled === false
    ) {
      return;
    }
    if (!this.hub.hasActiveClients(watermark.contestId)) {
      contestEventReadMetrics.add('eagerTailFillNoActiveSkips');
      return;
    }

    const fill = Promise.resolve()
      .then(() => materialize.call(this.readCache, watermark))
      .then(
        () => 'completed' as const,
        () => 'failed' as const,
      );
    const waitMs = this.readCacheConfig?.eagerNotifyWaitMs ?? 250;
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<'timeout'>((resolve) => {
      timer = setTimeout(() => resolve('timeout'), waitMs);
      timer.unref?.();
    });
    const outcome = await Promise.race([fill, timeout]);
    if (timer) {
      clearTimeout(timer);
    }
    if (outcome === 'completed') {
      contestEventReadMetrics.add('eagerTailFillWaitCompleted');
    } else if (outcome === 'failed') {
      contestEventReadMetrics.add('eagerTailFillWaitFailures');
    } else {
      contestEventReadMetrics.add('eagerTailFillWaitTimeouts');
    }
  }
}

function closedPreparedAttachment(): PreparedContestSseAttachment {
  return {
    closed: true,
    activate: () => undefined,
    abort: () => undefined,
  };
}

function isResponseWritable(response: ContestSseResponse): boolean {
  return !response.destroyed && !response.writableEnded && !response.writableFinished;
}

function getErrorClass(error: unknown): string {
  return error instanceof Error ? error.name : typeof error;
}
