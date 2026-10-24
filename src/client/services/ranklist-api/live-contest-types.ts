import type * as srk from '@algoux/standard-ranklist';

export interface LiveContestConfig {
  uk: string;
  name: string;
  contest: srk.Contest;
  problems: srk.Problem[];
  users: srk.User[];
  markers: srk.Marker[];
  series: srk.RankSeries[];
  sorter?: srk.Sorter;
  contributors?: srk.Contributor[];
}

export interface LiveContestStreamState {
  uk: string;
  lastEventId: number;
  streamRevision: number;
}

export type LiveJudgeResult =
  | Exclude<srk.SolutionResultFull, null>
  | 'PD'
  | 'JG'
  | 'CNL';

interface LiveContestEventBase {
  eventId: number;
}

export interface LiveNewSolutionEvent extends LiveContestEventBase {
  type: 'NEW';
  solutionId: number;
  userId: string;
  problemAlias: string;
  time: srk.TimeDuration;
  timeNs: string;
}

export interface LiveSolutionProgressEvent extends LiveContestEventBase {
  type: 'PROGRESS';
  solutionId: number;
  percentageProgress: number;
  time?: srk.TimeDuration;
}

export interface LiveSolutionSettleEvent extends LiveContestEventBase {
  type: 'SETTLE';
  solutionId: number;
  result: LiveJudgeResult;
  time: srk.TimeDuration;
}

export interface LiveSolutionChangeEvent extends LiveContestEventBase {
  type: 'CHANGE';
  solutionId: number;
  previousResult: LiveJudgeResult;
  result: LiveJudgeResult;
  time: srk.TimeDuration;
}

export interface LiveContestConfigChangeEvent extends LiveContestEventBase {
  type: 'CONFIG_CHANGE';
  changedFields: string[];
  time?: srk.TimeDuration;
}

export type LiveContestEvent =
  | LiveNewSolutionEvent
  | LiveSolutionProgressEvent
  | LiveSolutionSettleEvent
  | LiveSolutionChangeEvent
  | LiveContestConfigChangeEvent;

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

export interface LiveScrollSolutionItem {
  problem: {
    alias: string;
  };
  score: {
    value: srk.RankScore['value'];
  };
  previousResult?: Exclude<srk.SolutionResultFull, null>;
  result: Exclude<srk.SolutionResultFull, null>;
  user: {
    name: srk.User['name'];
    organization: srk.User['organization'];
  };
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
