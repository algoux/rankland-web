import type * as srk from '@algoux/standard-ranklist';
import defaultDemoCode from '@/assets/srk-playground-demo.srk.json.txt?raw';

export interface PlaygroundCodeResult {
  valid: boolean;
  data: srk.Ranklist | null;
}

export function createDefaultPlaygroundCode() {
  return defaultDemoCode;
}

export function parsePlaygroundCode(code: string): PlaygroundCodeResult {
  try {
    const data = JSON.parse(code);
    if (isRanklistLike(data)) {
      return {
        valid: true,
        data,
      };
    }
  } catch (_error) {
    // Invalid user input is rendered as a preview placeholder.
  }

  return {
    valid: false,
    data: null,
  };
}

function isRanklistLike(value: unknown): value is srk.Ranklist {
  return Boolean(
    value
      && typeof value === 'object'
      && !Array.isArray(value)
      && Array.isArray((value as Partial<srk.Ranklist>).rows),
  );
}
