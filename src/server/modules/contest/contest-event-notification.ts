import { Inject, Provide } from 'bwcx-core';
import ContestEventStreamService from './contest-event-stream.service';
import ContestSseHub, { ContestSseRegistration, ContestSseResponse } from './contest-sse-hub';
import { ContestCommittedWatermark } from './contest-event-watermark';
import ContestEventNotificationRedisAdapter from './contest-event-notification.redis';
import { promises as fs } from 'fs';

const RECONCILE_INTERVAL_MS = 5_000;
const ERROR_LOG_INTERVAL_MS = 30_000;

interface PendingAttachment {
  response: ContestSseResponse;
  closed: boolean;
  terminalListener: () => void;
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

  public constructor(
    @Inject(ContestEventStreamService)
    private readonly eventStreamService: ContestEventStreamService,
    @Inject(ContestSseHub)
    private readonly hub: ContestSseHub,
    @Inject(ContestEventNotificationRedisAdapter)
    private readonly redisAdapter?: ContestEventNotificationRedisAdapter,
  ) {}

  public start(): Promise<void> {
    if (this.started || this.stopping) {
      return Promise.resolve();
    }
    this.started = true;
    this.hub.start();
    this.phaseDelayMs ??= Math.floor(Math.random() * RECONCILE_INTERVAL_MS);
    this.phaseTimer = setTimeout(() => {
      this.phaseTimer = undefined;
      if (this.stopping) {
        return;
      }
      this.reconcile().catch(() => undefined);
      this.reconcileTimer = setInterval(() => {
        this.reconcile().catch(() => undefined);
      }, RECONCILE_INTERVAL_MS);
      this.reconcileTimer.unref?.();
    }, this.phaseDelayMs);
    this.phaseTimer.unref?.();
    if (this.redisAdapter) {
      try {
        const starting = this.redisAdapter.start({
          onWatermark: (watermark) => this.notifyFromRedis(watermark),
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
    if (this.stopping) {
      this.safeEnd(response);
      return;
    }

    const pending = this.createPendingAttachment(response);
    let registration: ContestSseRegistration | undefined;
    try {
      const identity = await this.eventStreamService.getAuthoritativeStreamState(uk);
      if (pending.closed || this.stopping) {
        this.safeEnd(response);
        return;
      }
      this.removePendingAttachment(pending);
      registration = this.hub.addClient(identity.contestId, uk, response);
      if (registration.closed) {
        return;
      }

      const current = await this.eventStreamService.getAuthoritativeStreamState(uk);
      if (current.contestId !== identity.contestId) {
        registration.close();
        return;
      }
      registration.notifyInitial({
        latestEventId: current.lastEventId,
        streamRevision: current.streamRevision,
      });
    } catch (_error) {
      if (registration) {
        registration.close();
      } else if (!pending.closed) {
        this.safeEnd(response);
      }
    } finally {
      this.removePendingAttachment(pending);
    }
  }

  public async announceCommitted(watermark: ContestCommittedWatermark): Promise<void> {
    if (this.stopping) {
      return;
    }
    try {
      this.hub.notify(watermark);
    } catch (error) {
      this.safeWarn('contest_event_notification.local_notify_failed', {
        contestId: watermark.contestId,
        errorClass: getErrorClass(error),
      });
    }
    if (this.redisAdapter) {
      try {
        await this.waitAtTestCommitPublishBarrier(watermark);
        await this.redisAdapter.publish(watermark);
      } catch (error) {
        this.safeWarn('contest_event_notification.publish_failed', {
          contestId: watermark.contestId,
          errorClass: getErrorClass(error),
        });
      }
    }
  }

  public stop(): Promise<void> {
    if (this.stopping) {
      return Promise.resolve();
    }
    this.stopping = true;
    this.started = false;
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
      this.removePendingAttachment(pending);
      this.safeEnd(pending.response);
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

  private notifyFromRedis(watermark: ContestCommittedWatermark): void {
    if (this.stopping) {
      return;
    }
    try {
      this.hub.notify(watermark);
    } catch (error) {
      this.safeWarn('contest_event_notification.local_notify_failed', {
        contestId: watermark.contestId,
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
    const activeContestIds = this.hub.getActiveContestIds();
    if (activeContestIds.length === 0) {
      return;
    }

    this.reconcileInFlight = true;
    try {
      const states = await this.eventStreamService.getAuthoritativeStreamStates(activeContestIds);
      if (this.stopping) {
        return;
      }
      const statesByContestId = new Map(states.map((state) => [state.contestId, state]));
      for (const contestId of activeContestIds) {
        const state = statesByContestId.get(contestId);
        if (!state) {
          this.hub.closeContest(contestId);
          continue;
        }
        try {
          this.hub.notify({
            contestId: state.contestId,
            canonicalUk: state.uk,
            latestEventId: state.lastEventId,
            streamRevision: state.streamRevision,
          });
        } catch (error) {
          this.safeWarn('contest_event_notification.local_notify_failed', {
            contestId,
            errorClass: getErrorClass(error),
          });
        }
      }
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

  private removePendingAttachment(pending: PendingAttachment): void {
    if (!this.pendingAttachments.delete(pending)) {
      return;
    }
    pending.response.removeListener('close', pending.terminalListener);
    pending.response.removeListener('error', pending.terminalListener);
    pending.response.removeListener('finish', pending.terminalListener);
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
}

function getErrorClass(error: unknown): string {
  return error instanceof Error ? error.name : typeof error;
}
