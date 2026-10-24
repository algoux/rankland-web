import type {
  LiveContestConfig,
  LiveContestEvent,
  LiveContestStreamState,
} from '@common/modules/contest/live-contest-types';

export * from '@common/modules/contest/live-contest-types';

export interface LiveContestEventPage {
  uk: string;
  fromEventId: number | null;
  toEventId: number | null;
  checkpointEventId: number;
  latestEventId: number;
  streamRevision: number;
  hasMore: boolean;
  resetRequired: boolean;
  resetReason: string;
  events: LiveContestEvent[];
}

export interface LiveContestEventsAvailable {
  uk: string;
  latestEventId: number;
  streamRevision: number;
}

export interface LiveContestEventSubscription {
  close: () => void;
}

export interface LiveContestFailure extends Error {
  aborted: boolean;
  transient: boolean;
  retryAfterMs?: number;
}

export interface LiveContestTransport {
  getContest: (uk: string) => Promise<LiveContestConfig>;
  getStreamState: (uk: string, signal: AbortSignal) => Promise<LiveContestStreamState>;
  getEvents: (options: {
    uk: string;
    afterEventId: number;
    streamRevision: number;
    signal: AbortSignal;
  }) => Promise<LiveContestEventPage>;
  subscribeEvents: (
    uk: string,
    callbacks: {
      onAvailable: (payload: LiveContestEventsAvailable) => void;
      onError: (error: Event) => void;
    },
  ) => LiveContestEventSubscription;
}
