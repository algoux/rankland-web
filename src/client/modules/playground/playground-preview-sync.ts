import { parsePlaygroundSrkSource, type PlaygroundSrkParseState } from './playground-srk';

export interface PlaygroundPreviewSyncState {
  draftSource: string;
  parseState: PlaygroundSrkParseState;
}

export function syncPlaygroundPreviewSource(source: string): PlaygroundPreviewSyncState {
  const draftSource = source || '';

  return {
    draftSource,
    parseState: parsePlaygroundSrkSource(draftSource),
  };
}
