import type {
  LiveContestEvent,
  LiveContestEventPage,
  LiveContestEventsAvailable,
  LiveContestEventSubscription,
  LiveContestFailure,
  LiveContestTransport,
} from '@/services/ranklist-api/live-contest-types';

interface ContestEventConsumerOptions {
  transport: LiveContestTransport;
  onInitialEvents: (events: LiveContestEvent[], complete: boolean) => void;
  onEvents: (events: LiveContestEvent[]) => void;
  onReset: (reason: string) => void;
  onFatal: (error: unknown) => void;
  sleep?: (milliseconds: number, signal: AbortSignal) => Promise<void>;
}

export class ContestEventConsumer {
  private readonly transport: LiveContestTransport;
  private readonly callbacks: Omit<ContestEventConsumerOptions, 'transport' | 'sleep'>;
  private readonly sleep: NonNullable<ContestEventConsumerOptions['sleep']>;

  private uk = '';
  private stopped = true;
  private generation = 0;
  private streamRevision = 0;
  private localEventId = 0;
  private targetLatestEventId = 0;
  private initialTargetLatestEventId = 0;
  private initialized = false;
  private abortController: AbortController | null = null;
  private subscription: LiveContestEventSubscription | null = null;
  private catchUpPromise: Promise<void> | null = null;
  private catchUpFollowUpRequested = false;

  public constructor(options: ContestEventConsumerOptions) {
    this.transport = options.transport;
    this.callbacks = {
      onInitialEvents: options.onInitialEvents,
      onEvents: options.onEvents,
      onReset: options.onReset,
      onFatal: options.onFatal,
    };
    this.sleep = options.sleep ?? abortableSleep;
  }

  public async start(uk: string): Promise<void> {
    const previousCatchUp = this.catchUpPromise;
    this.invalidateCurrentSession();
    this.stopped = false;
    this.uk = uk;
    const generation = this.generation;

    if (previousCatchUp) {
      await settle(previousCatchUp);
    }
    if (!this.isActive(generation)) {
      return;
    }

    try {
      const state = await this.loadStreamState(generation);
      if (!state || !this.isActive(generation)) {
        return;
      }
      if (
        state.uk !== uk
        || !Number.isInteger(state.lastEventId)
        || state.lastEventId < 0
        || !Number.isInteger(state.streamRevision)
        || state.streamRevision < 1
      ) {
        throw new ContestEventConsumerError('Invalid contest event stream state');
      }
      this.streamRevision = state.streamRevision;
      this.localEventId = 0;
      this.targetLatestEventId = state.lastEventId;
      this.initialTargetLatestEventId = state.lastEventId;
      this.initialized = false;

      if (state.lastEventId === 0) {
        this.finishInitial(generation);
      } else {
        await this.ensureCatchUp(generation);
      }
    } catch (error) {
      if (!isAbortError(error, this.abortController?.signal) && this.isActive(generation)) {
        this.fail(error, generation);
      }
    }
  }

  public stop() {
    this.invalidateCurrentSession();
  }

  private async loadStreamState(generation: number) {
    let attempt = 0;
    for (;;) {
      const controller = new AbortController();
      this.abortController = controller;
      try {
        return await this.transport.getStreamState(this.uk, controller.signal);
      } catch (error) {
        if (!this.isActive(generation) || isAbortError(error, controller.signal)) {
          return null;
        }
        if (!isTransientError(error)) {
          throw error;
        }
        await this.waitBeforeRetry(error, attempt, generation);
        attempt += 1;
      } finally {
        if (this.abortController === controller) {
          this.abortController = null;
        }
      }
    }
  }

  private async ensureCatchUp(generation: number): Promise<void> {
    const existing = this.catchUpPromise;
    if (existing) {
      await settle(existing);
      if (this.isActive(generation) && this.localEventId < this.targetLatestEventId) {
        await this.ensureCatchUp(generation);
      }
      return;
    }
    if (!this.isActive(generation)) {
      return;
    }

    const promise = this.runCatchUp(generation);
    this.catchUpPromise = promise;
    try {
      await promise;
    } finally {
      if (this.catchUpPromise === promise) {
        this.catchUpPromise = null;
      }
      const scheduleFollowUp = this.catchUpFollowUpRequested;
      this.catchUpFollowUpRequested = false;
      if (scheduleFollowUp && !this.stopped) {
        this.scheduleCatchUp(this.generation);
      }
    }
  }

  private async runCatchUp(generation: number) {
    let retryAttempt = 0;
    while (this.isActive(generation)) {
      if (this.localEventId >= this.targetLatestEventId) {
        if (!this.initialized) {
          this.finishInitial(generation);
        }
        return;
      }

      const requestUk = this.uk;
      const requestRevision = this.streamRevision;
      const requestAfterEventId = this.localEventId;
      const controller = new AbortController();
      this.abortController = controller;

      let page: LiveContestEventPage;
      try {
        page = await this.transport.getEvents({
          uk: requestUk,
          afterEventId: requestAfterEventId,
          streamRevision: requestRevision,
          signal: controller.signal,
        });
        retryAttempt = 0;
      } catch (error) {
        if (!this.isRequestCurrent(requestUk, generation, requestRevision) || isAbortError(error, controller.signal)) {
          return;
        }
        if (!isTransientError(error)) {
          this.fail(error, generation);
          return;
        }
        await this.waitBeforeRetry(error, retryAttempt, generation);
        retryAttempt += 1;
        continue;
      } finally {
        if (this.abortController === controller) {
          this.abortController = null;
        }
      }

      if (!this.isRequestCurrent(requestUk, generation, requestRevision)) {
        return;
      }
      if (page.uk !== requestUk) {
        this.fail(new ContestEventConsumerError('Contest event page UK mismatch'), generation);
        return;
      }
      if (page.resetRequired) {
        this.handleResetPage(page, requestRevision, generation);
        return;
      }
      if (page.streamRevision !== requestRevision) {
        this.fail(
          new ContestEventConsumerError('Contest event page revision mismatch'),
          generation,
        );
        return;
      }
      if (!isValidEventPage(page, requestAfterEventId)) {
        this.fail(
          new ContestEventConsumerError('Contest event page has an invalid checkpoint or event sequence'),
          generation,
        );
        return;
      }

      this.targetLatestEventId = Math.max(this.targetLatestEventId, page.latestEventId);
      if (!this.initialized) {
        const initialBoundary = this.initialTargetLatestEventId;
        const initialBatch = page.events.filter((item) => item.eventId <= initialBoundary);
        if (page.checkpointEventId >= initialBoundary) {
          this.localEventId = initialBoundary;
          if (!this.finishInitial(generation, initialBatch)) {
            return;
          }
        } else {
          if (!this.publishInitialBatch(initialBatch, false, generation)) {
            return;
          }
          this.localEventId = page.checkpointEventId;
        }
        continue;
      }

      try {
        this.callbacks.onEvents(page.events);
      } catch (error) {
        this.fail(error, generation);
        return;
      }
      if (!this.isActive(generation)) {
        return;
      }
      this.localEventId = page.checkpointEventId;
    }
  }

  private publishInitialBatch(
    events: LiveContestEvent[],
    complete: boolean,
    generation: number,
  ) {
    if (!this.isActive(generation)) {
      return false;
    }
    try {
      this.callbacks.onInitialEvents(events, complete);
    } catch (error) {
      this.fail(error, generation);
      return false;
    }
    return this.isActive(generation);
  }

  private finishInitial(generation: number, events: LiveContestEvent[] = []) {
    if (!this.isActive(generation) || this.initialized) {
      return false;
    }
    if (!this.publishInitialBatch(events, true, generation)) {
      return false;
    }
    this.initialized = true;
    this.openSubscription(generation);
    return this.isActive(generation);
  }

  private openSubscription(generation: number) {
    if (this.subscription || !this.isActive(generation)) {
      return;
    }
    try {
      this.subscription = this.transport.subscribeEvents(this.uk, {
        onAvailable: (payload) => this.handleAvailability(payload),
        onError: (error) => {
          console.warn('[ContestEventConsumer] event availability stream error; awaiting reconnect', error);
        },
      });
    } catch (error) {
      this.fail(error, generation);
    }
  }

  private handleAvailability(payload: LiveContestEventsAvailable) {
    if (
      this.stopped
      || payload.uk !== this.uk
      || !Number.isInteger(payload.latestEventId)
      || payload.latestEventId < 0
      || !Number.isInteger(payload.streamRevision)
      || payload.streamRevision < 1
    ) {
      return;
    }
    if (payload.streamRevision < this.streamRevision) {
      return;
    }
    if (payload.streamRevision > this.streamRevision) {
      const generation = this.replaceGeneration(
        payload.streamRevision,
        payload.latestEventId,
        'stream revision changed',
      );
      if (generation !== null) {
        this.scheduleCatchUp(generation);
      }
      return;
    }
    if (payload.latestEventId <= this.targetLatestEventId) {
      return;
    }
    this.targetLatestEventId = payload.latestEventId;
    this.scheduleCatchUp(this.generation);
  }

  private handleResetPage(page: LiveContestEventPage, requestRevision: number, generation: number) {
    if (!this.isActive(generation) || page.streamRevision < requestRevision) {
      return;
    }
    const nextLatestEventId = page.streamRevision === requestRevision
      ? Math.max(this.targetLatestEventId, page.latestEventId)
      : page.latestEventId;
    const nextGeneration = this.replaceGeneration(
      page.streamRevision,
      nextLatestEventId,
      page.resetReason || 'contest event stream reset',
    );
    if (nextGeneration !== null) {
      this.scheduleCatchUp(nextGeneration);
    }
  }

  private scheduleCatchUp(generation: number) {
    if (!this.isActive(generation)) {
      return;
    }
    if (this.catchUpPromise) {
      this.catchUpFollowUpRequested = true;
      return;
    }
    this.ensureCatchUp(generation).catch((error) => {
      if (!isAbortError(error, this.abortController?.signal) && this.isActive(generation)) {
        this.fail(error, generation);
      }
    });
  }

  private replaceGeneration(streamRevision: number, latestEventId: number, reason: string) {
    if (this.stopped) {
      return null;
    }
    this.abortController?.abort();
    this.abortController = null;
    this.generation += 1;
    const generation = this.generation;
    this.streamRevision = streamRevision;
    this.localEventId = 0;
    this.targetLatestEventId = latestEventId;
    this.initialTargetLatestEventId = latestEventId;
    this.initialized = false;
    try {
      this.callbacks.onReset(reason);
    } catch (error) {
      this.fail(error, generation);
      return null;
    }
    return this.isActive(generation) ? generation : null;
  }

  private async waitBeforeRetry(error: unknown, attempt: number, generation: number) {
    const delay = Math.max(
      isLiveContestFailure(error) ? error.retryAfterMs ?? 0 : 0,
      Math.min(30_000, 1000 * (2 ** Math.min(attempt, 5))),
    );
    const controller = new AbortController();
    this.abortController = controller;
    try {
      await this.sleep(delay, controller.signal);
    } finally {
      if (this.abortController === controller) {
        this.abortController = null;
      }
    }
    if (!this.isActive(generation)) {
      throw createAbortError();
    }
  }

  private fail(error: unknown, generation: number) {
    if (!this.isActive(generation)) {
      return;
    }
    this.callbacks.onFatal(error);
    if (!this.isActive(generation)) {
      return;
    }
    this.invalidateCurrentSession();
  }

  private invalidateCurrentSession() {
    this.stopped = true;
    this.generation += 1;
    this.abortController?.abort();
    this.abortController = null;
    this.subscription?.close();
    this.subscription = null;
    this.catchUpFollowUpRequested = false;
    this.initialized = false;
  }

  private isActive(generation: number) {
    return !this.stopped && this.generation === generation;
  }

  private isRequestCurrent(uk: string, generation: number, streamRevision: number) {
    return this.isActive(generation) && this.uk === uk && this.streamRevision === streamRevision;
  }
}

function isValidEventPage(page: LiveContestEventPage, afterEventId: number) {
  if (
    !Number.isInteger(page.latestEventId)
    || page.latestEventId < 0
    || !Number.isInteger(page.checkpointEventId)
    || page.checkpointEventId <= afterEventId
    || page.checkpointEventId > page.latestEventId
  ) {
    return false;
  }
  let previousEventId = afterEventId;
  for (const event of page.events) {
    if (
      !Number.isInteger(event.eventId)
      || event.eventId <= previousEventId
      || event.eventId > page.checkpointEventId
    ) {
      return false;
    }
    previousEventId = event.eventId;
  }
  return true;
}

function isTransientError(error: unknown) {
  return isLiveContestFailure(error) && error.transient;
}

function isAbortError(error: unknown, signal?: AbortSignal) {
  return signal?.aborted === true
    || (isLiveContestFailure(error) && error.aborted);
}

function isLiveContestFailure(error: unknown): error is LiveContestFailure {
  return Boolean(
    error
    && typeof error === 'object'
    && 'aborted' in error
    && typeof (error as { aborted?: unknown }).aborted === 'boolean'
    && 'transient' in error
    && typeof (error as { transient?: unknown }).transient === 'boolean',
  );
}

class ContestEventConsumerError extends Error implements LiveContestFailure {
  public readonly aborted = false;
  public readonly transient = false;
}

function createAbortError() {
  return new ContestEventAbortError('Operation aborted');
}

class ContestEventAbortError extends Error implements LiveContestFailure {
  public readonly aborted = true;
  public readonly transient = false;
}

function abortableSleep(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(createAbortError());
      return;
    }
    const onAbort = () => {
      globalThis.clearTimeout(timer);
      reject(createAbortError());
    };
    const timer = globalThis.setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, milliseconds);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

async function settle(promise: Promise<unknown>) {
  try {
    await promise;
  } catch {
    // Errors are routed through onFatal by the owning generation.
  }
}
