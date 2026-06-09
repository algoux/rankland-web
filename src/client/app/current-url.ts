import { toUnicode } from 'punycode/';
import { serializeQuery } from './config';

const FOCUS_QUERY_KEYS = new Set(['focus', '聚焦']);

export interface CurrentUrlInput {
  protocol: string;
  host: string;
  pathname: string;
  query: Record<string, unknown>;
}

export function formatCurrentUrl(input: CurrentUrlInput) {
  const search = serializeQuery(input.query, FOCUS_QUERY_KEYS);
  const pathname = normalizePathname(input.pathname);
  const url = `${pathname}${search ? `?${search}` : ''}`;
  return {
    url,
    fullUrl: `${input.protocol}//${toUnicode(input.host)}${url}`,
  };
}

function normalizePathname(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname || '/';
}
