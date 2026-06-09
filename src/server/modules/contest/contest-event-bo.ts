import { rankland_live_contest_common } from '@common/proto/rankland_live_contest';

export interface ContestTimeDurationBO {
  value: string;
  unit: rankland_live_contest_common.TimeUnit;
}

export interface ContestNewSolutionEventBO {
  solutionId: number;
  userId: string;
  problemAlias: string;
  time: ContestTimeDurationBO;
}

export interface ContestSolutionOnProgressEventBO {
  solutionId: number;
  percentageProgress: number;
}

export interface ContestSolutionOnResultSettleEventBO {
  solutionId: number;
  result: rankland_live_contest_common.Result;
  time: ContestTimeDurationBO;
}

export interface ContestSolutionOnResultChangeEventBO {
  solutionId: number;
  previousResult: rankland_live_contest_common.Result;
  result: rankland_live_contest_common.Result;
  time: ContestTimeDurationBO;
}

export interface ContestConfigChangeEventBO {}

export interface ContestProducerEventBO {
  eventId: number;
  type: rankland_live_contest_common.EventType;
  newSolutionData?: ContestNewSolutionEventBO;
  solutionOnProgressData?: ContestSolutionOnProgressEventBO;
  solutionOnResultSettleData?: ContestSolutionOnResultSettleEventBO;
  solutionOnResultChangeData?: ContestSolutionOnResultChangeEventBO;
  contestConfigChangeData?: ContestConfigChangeEventBO;
}

export interface ContestProducerBatchBO {
  streamRevision: number;
  events: ContestProducerEventBO[];
}

export interface ContestClientEventBO {
  eventId: number;
  type: rankland_live_contest_common.EventType;
  newSolutionData?: ContestNewSolutionEventBO;
  solutionOnProgressData?: ContestSolutionOnProgressEventBO;
  solutionOnResultSettleData?: ContestSolutionOnResultSettleEventBO;
  solutionOnResultChangeData?: ContestSolutionOnResultChangeEventBO;
  contestConfigChangeData?: ContestConfigChangeEventBO;
}

export interface ContestEventsResponseBO {
  uk: string;
  fromEventId: number | null;
  toEventId: number | null;
  checkpointEventId: number;
  latestEventId: number;
  streamRevision: number;
  hasMore: boolean;
  resetRequired: boolean;
  resetReason?: string;
  events: ContestClientEventBO[];
}
