export const SSR_REQUEST_LANGUAGES_STATE_KEY = '__ssrLanguages';

export type SsrRequestLanguageInitialState = {
  [SSR_REQUEST_LANGUAGES_STATE_KEY]: readonly string[];
};

interface LanguagePreference {
  tag: string;
  q: number;
  index: number;
}

export function parseAcceptLanguageHeader(header: unknown): readonly string[] | undefined {
  const rawHeader = Array.isArray(header) ? header.join(',') : header;
  if (typeof rawHeader !== 'string') {
    return undefined;
  }

  const preferences = rawHeader
    .split(',')
    .map((part, index) => parseLanguagePreference(part, index))
    .filter((preference): preference is LanguagePreference => !!preference)
    .sort((a, b) => (b.q === a.q ? a.index - b.index : b.q - a.q));

  return normalizeRequestLanguages(preferences.map((preference) => preference.tag));
}

export function normalizeRequestLanguages(languages: unknown): readonly string[] | undefined {
  if (!Array.isArray(languages)) {
    return undefined;
  }

  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const language of languages) {
    const tag = typeof language === 'string' ? normalizeLanguageTag(language) : undefined;
    if (!tag) {
      continue;
    }
    const dedupeKey = tag.toLowerCase();
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);
    normalized.push(tag);
  }

  return normalized.length > 0 ? normalized : undefined;
}

export function createSsrRequestLanguageInitialState(
  languages: unknown,
): SsrRequestLanguageInitialState | undefined {
  const normalized = normalizeRequestLanguages(languages);
  return normalized
    ? {
        [SSR_REQUEST_LANGUAGES_STATE_KEY]: normalized,
      }
    : undefined;
}

function parseLanguagePreference(part: string, index: number): LanguagePreference | undefined {
  const [rawTag, ...rawParams] = part.split(';');
  const tag = normalizeLanguageTag(rawTag);
  if (!tag) {
    return undefined;
  }

  const q = parseQValue(rawParams);
  if (q <= 0) {
    return undefined;
  }

  return { tag, q, index };
}

function parseQValue(params: string[]) {
  for (const param of params) {
    const [rawKey, rawValue] = param.split('=');
    if (rawKey?.trim().toLowerCase() !== 'q') {
      continue;
    }
    const q = Number(rawValue?.trim());
    return Number.isFinite(q) ? Math.min(Math.max(q, 0), 1) : 0;
  }
  return 1;
}

function normalizeLanguageTag(rawTag?: string) {
  const tag = rawTag?.trim().replace(/_/g, '-');
  if (!tag || tag === '*') {
    return undefined;
  }
  try {
    return Intl.getCanonicalLocales(tag)[0];
  } catch (_error) {
    return undefined;
  }
}
