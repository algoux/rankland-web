import { Provide } from 'bwcx-core';
import {
  compareContestEventWatermarks,
  ContestCommittedWatermark,
  ContestEventWatermark,
  latestContestEventWatermark,
} from './contest-event-watermark';

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

interface ClientState {
  contestId: string;
  requestUk: string;
  response: ContestSseResponse;
  closed: boolean;
  blocked: boolean;
  lastSent?: ContestEventWatermark;
  pending?: ContestEventWatermark;
  backpressureTimer?: NodeJS.Timeout;
  terminalListener: () => void;
  drainListener: () => void;
}

@Provide()
export default class ContestSseHub {
  private readonly clients = new Map<string, Set<ClientState>>();
  private heartbeatTimer?: NodeJS.Timeout;
  private draining = false;

  public start(): void {
    if (this.heartbeatTimer || this.draining) {
      return;
    }
    this.heartbeatTimer = setInterval(() => this.sendHeartbeats(), HEARTBEAT_INTERVAL_MS);
    this.heartbeatTimer.unref?.();
  }

  public addClient(contestId: string, requestUk: string, response: ContestSseResponse): ContestSseRegistration {
    if (this.draining || !this.isResponseWritable(response)) {
      this.safeEnd(response);
      return closedRegistration();
    }

    const state: ClientState = {
      contestId,
      requestUk,
      response,
      closed: false,
      blocked: false,
      terminalListener: () => this.closeClient(state, false),
      drainListener: () => this.handleDrain(state),
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

    return {
      get closed() {
        return state.closed;
      },
      notifyInitial: (watermark) => this.sendWatermark(state, watermark),
      close: () => this.closeClient(state, true, state.blocked),
    };
  }

  public notify(watermark: ContestCommittedWatermark): void {
    const contestClients = this.clients.get(watermark.contestId);
    if (!contestClients) {
      return;
    }
    for (const state of [...contestClients]) {
      this.sendWatermark(state, watermark);
    }
  }

  public getActiveContestIds(): string[] {
    return [...this.clients.keys()];
  }

  public closeContest(contestId: string): void {
    const contestClients = this.clients.get(contestId);
    if (!contestClients) {
      return;
    }
    for (const state of [...contestClients]) {
      this.closeClient(state, true, state.blocked);
    }
  }

  public beginDraining(): void {
    if (this.draining) {
      return;
    }
    this.draining = true;
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  public closeAll(): void {
    for (const contestClients of [...this.clients.values()]) {
      for (const state of [...contestClients]) {
        this.closeClient(state, true, state.blocked);
      }
    }
  }

  private sendWatermark(state: ClientState, watermark: ContestEventWatermark): void {
    if (state.closed) {
      return;
    }
    if (!this.isResponseWritable(state.response)) {
      this.closeClient(state, false);
      return;
    }

    const current = state.pending
      ? state.lastSent
        ? latestContestEventWatermark(state.lastSent, state.pending)
        : state.pending
      : state.lastSent;
    if (current && compareContestEventWatermarks(watermark, current) <= 0) {
      return;
    }
    if (state.blocked) {
      const latestPending = state.pending ? latestContestEventWatermark(state.pending, watermark) : watermark;
      state.pending = { ...latestPending };
      return;
    }

    this.writeEvent(state, watermark);
  }

  private writeEvent(state: ClientState, watermark: ContestEventWatermark): void {
    const payload: ContestEventsAvailablePayload = {
      uk: state.requestUk,
      latestEventId: watermark.latestEventId,
      streamRevision: watermark.streamRevision,
    };
    const frame = `event: events-available\ndata: ${JSON.stringify(payload)}\n\n`;
    try {
      if (!this.isResponseWritable(state.response)) {
        this.closeClient(state, false);
        return;
      }
      const writable = state.response.write(frame);
      state.lastSent = { ...watermark };
      if (!writable) {
        this.markBlocked(state);
      }
    } catch (_error) {
      this.closeClient(state, true, true);
    }
  }

  private sendHeartbeats(): void {
    for (const contestClients of [...this.clients.values()]) {
      for (const state of [...contestClients]) {
        if (state.closed || state.blocked) {
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
      this.closeClient(state, true, true);
    }, BACKPRESSURE_TIMEOUT_MS);
    state.backpressureTimer.unref?.();
  }

  private handleDrain(state: ClientState): void {
    if (state.closed || !state.blocked) {
      return;
    }
    this.clearBackpressureTimer(state);
    state.blocked = false;
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
