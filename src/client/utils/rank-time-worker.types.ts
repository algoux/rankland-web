import type * as srk from '@algoux/standard-ranklist';
import type { StaticRanklist } from '@algoux/standard-ranklist-utils';
import type { SelectedUserMainRankTimeData } from './rank-time-data.util';

interface RankTimeWorkerBaseRequest {
  requestId: number;
  cacheKey: string;
}

interface RankTimeWorkerDataPayload {
  ranklist: srk.Ranklist;
  unit: srk.TimeDuration;
}

export interface RankTimeWorkerPrepareRequest extends RankTimeWorkerBaseRequest, RankTimeWorkerDataPayload {
  kind: 'prepare';
}

export interface RankTimeWorkerSelectRequest extends RankTimeWorkerBaseRequest {
  kind: 'select';
  ranklist?: srk.Ranklist;
  unit?: srk.TimeDuration;
  user?: srk.User;
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
