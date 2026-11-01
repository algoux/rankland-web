/// <reference lib="webworker" />

import {
  createEmptyRankTimeDataSet,
  getAllRankTimeData,
  selectUserMainRankTimeData,
} from './rank-time-data.util';
import type { RankTimeDataSet } from './rank-time-data.util';
import type { RankTimeWorkerRequest, RankTimeWorkerResponse } from './rank-time-worker.types';
import { getSortedCalculatedRawSolutions } from '@algoux/standard-ranklist-utils';
import type * as srk from '@algoux/standard-ranklist';

let cachedKey = '';
let cachedDataSet: RankTimeDataSet = createEmptyRankTimeDataSet();
let cachedRanklist: srk.Ranklist | undefined;
let cachedUnit: srk.TimeDuration | undefined;
let cachedSolutions: ReturnType<typeof getSortedCalculatedRawSolutions> = [];
let cachedUserId: string | undefined;

function ensureDataSet(message: RankTimeWorkerRequest) {
  if (cachedKey !== message.cacheKey || !cachedRanklist) {
    if (!message.ranklist || !message.unit) {
      throw new Error('Rank time worker cache is not prepared');
    }
    cachedRanklist = message.ranklist;
    cachedUnit = message.unit;
    cachedSolutions = getSortedCalculatedRawSolutions(cachedRanklist.rows);
    cachedUserId = undefined;
    cachedDataSet = createEmptyRankTimeDataSet();
    cachedKey = message.cacheKey;
  }
  // Ranking still includes everyone. Only the requested user's historical
  // points are retained, with a one-user cache rather than N x time buckets.
  if (message.kind === 'select' && cachedUserId !== message.userId) {
    cachedDataSet = getAllRankTimeData(cachedRanklist, cachedSolutions, cachedUnit!, message.userId);
    cachedUserId = message.userId;
  }
  return cachedDataSet;
}

export function handleRankTimeWorkerMessage(message: RankTimeWorkerRequest): RankTimeWorkerResponse {
  try {
    const dataSet = ensureDataSet(message);
    const response: RankTimeWorkerResponse = {
      requestId: message.requestId,
      kind: message.kind,
    };

    if (message.kind === 'select') {
      response.data = selectUserMainRankTimeData({
        rankTimeDataSet: dataSet,
        user: message.user,
        staticSeries: message.staticSeries,
        staticMarkers: message.staticMarkers,
        userId: message.userId,
        fixedMarker: message.fixedMarker,
      });
    }

    return response;
  } catch (error) {
    return {
      requestId: message.requestId,
      kind: message.kind,
      error: error instanceof Error ? error.message : String(error),
    } satisfies RankTimeWorkerResponse;
  }
}

if (typeof self !== 'undefined') {
  self.onmessage = (event: MessageEvent<RankTimeWorkerRequest>) => {
    self.postMessage(handleRankTimeWorkerMessage(event.data));
  };
}
