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
let cachedDataSetReady = false;

function ensureDataSet(message: RankTimeWorkerRequest) {
  if (cachedKey === message.cacheKey && cachedDataSetReady) {
    return cachedDataSet;
  }

  if (!message.ranklist || !message.solutions || !message.unit) {
    throw new Error('Rank time worker cache is not prepared');
  }

  cachedDataSet = getAllRankTimeData(message.ranklist, message.solutions, message.unit);
  cachedKey = message.cacheKey;
  cachedDataSetReady = true;
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
        staticRows: message.staticRows,
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
