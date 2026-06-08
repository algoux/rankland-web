/// <reference lib="webworker" />

import {
  createEmptyRankTimeDataSet,
  getAllRankTimeData,
  selectUserMainRankTimeData,
} from './rank-time-data.util';
import type { RankTimeDataSet } from './rank-time-data.util';
import type { RankTimeWorkerRequest, RankTimeWorkerResponse } from './rank-time-worker.types';

let cachedKey = '';
let cachedDataSet: RankTimeDataSet = createEmptyRankTimeDataSet();

function ensureDataSet(message: RankTimeWorkerRequest) {
  if (cachedKey === message.cacheKey && cachedDataSet.totalUsers > 0) {
    return cachedDataSet;
  }

  cachedDataSet = getAllRankTimeData(message.ranklist, message.solutions, message.unit);
  cachedKey = message.cacheKey;
  return cachedDataSet;
}

self.onmessage = (event: MessageEvent<RankTimeWorkerRequest>) => {
  const message = event.data;
  try {
    const dataSet = ensureDataSet(message);
    const response: RankTimeWorkerResponse = {
      requestId: message.requestId,
      kind: message.kind,
    };

    if (message.kind === 'select') {
      response.data = selectUserMainRankTimeData({
        rankTimeDataSet: dataSet,
        staticRows: message.staticRows,
        staticSeries: message.staticSeries,
        staticMarkers: message.staticMarkers,
        userId: message.userId,
        fixedMarker: message.fixedMarker,
      });
    }

    self.postMessage(response);
  } catch (error) {
    self.postMessage({
      requestId: message.requestId,
      kind: message.kind,
      error: error instanceof Error ? error.message : String(error),
    } satisfies RankTimeWorkerResponse);
  }
};
