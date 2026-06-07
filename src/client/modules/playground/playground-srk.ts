import type * as srk from '@algoux/standard-ranklist';

export type PlaygroundSrkParseState =
  | {
      kind: 'valid';
      data: srk.Ranklist;
    }
  | {
      kind: 'invalid';
      message: string;
    };

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error || 'Invalid JSON.');
}

export function parsePlaygroundSrkSource(source: string): PlaygroundSrkParseState {
  try {
    const data = JSON.parse(source);

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return {
        kind: 'invalid',
        message: 'SRK JSON must be an object.',
      };
    }

    return {
      kind: 'valid',
      data: data as srk.Ranklist,
    };
  } catch (error) {
    return {
      kind: 'invalid',
      message: normalizeErrorMessage(error),
    };
  }
}
