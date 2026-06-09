import type * as srk from '@algoux/standard-ranklist';
import type { CalculatedSolutionTetrad, StaticRanklist } from '@algoux/standard-ranklist-utils';
import type { SelectedUserMainRankTimeData } from './rank-time-data.util';

interface RankTimeWorkerBaseRequest {
  requestId: number;
  cacheKey: string;
  ranklist: srk.Ranklist;
  solutions: CalculatedSolutionTetrad[];
  unit: srk.TimeDuration;
}

export interface RankTimeWorkerPrepareRequest extends RankTimeWorkerBaseRequest {
  kind: 'prepare';
}

export interface RankTimeWorkerSelectRequest extends RankTimeWorkerBaseRequest {
  kind: 'select';
  staticRows: StaticRanklist['rows'];
  staticSeries: StaticRanklist['series'];
  staticMarkers?: srk.Marker[];
  userId: string;
  fixedMarker?: string;
}

export type RankTimeWorkerRequest = RankTimeWorkerPrepareRequest | RankTimeWorkerSelectRequest;

export interface RankTimeWorkerResponse {
  requestId: number;
  kind: RankTimeWorkerRequest['kind'];
  data?: SelectedUserMainRankTimeData | null;
  error?: string;
}
