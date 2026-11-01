/// <reference lib="webworker" />
import { diagnoseRanklist } from '@algoux/standard-ranklist-utils';
import type * as srk from '@algoux/standard-ranklist';
import type { RanklistDiagnostics } from '@algoux/standard-ranklist-utils';

export type RanklistDiagnosticsResponse = { diagnostics: RanklistDiagnostics } | { error: string };

export function diagnoseInWorker(data: srk.Ranklist): RanklistDiagnosticsResponse {
  try {
    return { diagnostics: diagnoseRanklist(data) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

if (typeof self !== 'undefined') {
  self.onmessage = (event: MessageEvent<srk.Ranklist>) => self.postMessage(diagnoseInWorker(event.data));
}
