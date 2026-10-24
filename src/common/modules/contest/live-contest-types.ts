import type * as srk from '@algoux/standard-ranklist';
import type { ContestStatus } from './contest-status';

export interface LiveContestConfig {
  uk: string;
  name: string;
  status?: ContestStatus;
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
