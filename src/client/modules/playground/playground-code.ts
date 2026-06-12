import type * as srk from '@algoux/standard-ranklist';
import defaultDemoCode from '@/assets/srk-playground-demo.srk.json.txt?raw';

export interface PlaygroundCodeResult {
  valid: boolean;
  data: srk.Ranklist | null;
}

export const PLAYGROUND_AUTO_PREVIEW_MAX_CHARACTERS = 2_000_000;
export const PLAYGROUND_AUTO_PREVIEW_MAX_LINES = 30_000;

export interface PlaygroundFastPasteDecisionInput {
  isFullDocumentSelection: boolean;
  isCurrentDocumentLarge: boolean;
  pastedText: string;
}

export interface PlaygroundDocumentSizeStats {
  characterCount: number;
  lineCount: number;
}

export function createDefaultPlaygroundCode() {
  return defaultDemoCode;
}

export function shouldUseFastFullDocumentPaste({
  isFullDocumentSelection,
  isCurrentDocumentLarge,
  pastedText,
}: PlaygroundFastPasteDecisionInput) {
  return (
    isLargePlaygroundCode(pastedText)
    && (isFullDocumentSelection || isCurrentDocumentLarge)
  );
}

export function isLargePlaygroundDocument({
  characterCount,
  lineCount,
}: PlaygroundDocumentSizeStats) {
  return (
    characterCount > PLAYGROUND_AUTO_PREVIEW_MAX_CHARACTERS
    || lineCount > PLAYGROUND_AUTO_PREVIEW_MAX_LINES
  );
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

function isLargePlaygroundCode(code: string) {
  return (
    isLargePlaygroundDocument({
      characterCount: code.length,
      lineCount: 1,
    })
    || hasMoreLinesThan(code, PLAYGROUND_AUTO_PREVIEW_MAX_LINES)
  );
}

function hasMoreLinesThan(code: string, maxLines: number) {
  let lines = 1;
  for (let index = 0; index < code.length && lines <= maxLines; index += 1) {
    if (code.charCodeAt(index) === 10) {
      lines += 1;
    }
  }
  return lines > maxLines;
}
