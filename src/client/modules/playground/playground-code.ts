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

interface PlaygroundSourceResponse {
  ok: boolean;
  status: number;
  statusText: string;
  text(): Promise<string>;
}

interface PlaygroundInitialCodeOptions {
  sourceUrl: unknown;
  fallbackCode?: string;
  fetchImpl?: (url: string) => Promise<PlaygroundSourceResponse>;
}

export interface PlaygroundInitialCodeResult {
  code: string;
  sourceUrl: string;
  error: Error | null;
}

export function createDefaultPlaygroundCode() {
  return defaultDemoCode;
}

export function getPlaygroundQueryValue(value: unknown) {
  const firstValue = Array.isArray(value) ? value[0] : value;
  return typeof firstValue === 'string' ? firstValue.trim() : '';
}

export async function loadPlaygroundInitialCode({
  sourceUrl,
  fallbackCode = createDefaultPlaygroundCode(),
  fetchImpl = fetch,
}: PlaygroundInitialCodeOptions): Promise<PlaygroundInitialCodeResult> {
  const normalizedSourceUrl = getPlaygroundQueryValue(sourceUrl);
  if (!normalizedSourceUrl) {
    return {
      code: fallbackCode,
      error: null,
      sourceUrl: '',
    };
  }

  try {
    const response = await fetchImpl(normalizedSourceUrl);
    if (!response.ok) {
      throw new Error(`Failed to download srk source: ${response.status} ${response.statusText}`);
    }
    const parsedSource = JSON.parse(await response.text());
    return {
      code: JSON.stringify(parsedSource, null, 2),
      error: null,
      sourceUrl: normalizedSourceUrl,
    };
  } catch (error) {
    return {
      code: fallbackCode,
      error: error instanceof Error ? error : new Error(String(error)),
      sourceUrl: normalizedSourceUrl,
    };
  }
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
