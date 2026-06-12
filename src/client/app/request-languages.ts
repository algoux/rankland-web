import { inject, type InjectionKey } from 'vue';
import {
  SSR_REQUEST_LANGUAGES_STATE_KEY,
  normalizeRequestLanguages,
} from '@common/request-language';

export const SSR_REQUEST_LANGUAGES_TOKEN: InjectionKey<readonly string[] | undefined> = Symbol(
  'rankland-ssr-request-languages',
);

export function resolveSsrRequestLanguagesFromInitialState(initialState: unknown) {
  if (!initialState || typeof initialState !== 'object') {
    return undefined;
  }
  return normalizeRequestLanguages(
    (initialState as Record<string, unknown>)[SSR_REQUEST_LANGUAGES_STATE_KEY],
  );
}

export function useSsrRequestLanguages(fallback?: readonly string[]) {
  return inject(SSR_REQUEST_LANGUAGES_TOKEN, fallback);
}
