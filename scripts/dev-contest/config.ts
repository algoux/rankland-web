export const BASE_URL = trimTrailingSlash(process.env.DEV_SERVER_URL || 'http://127.0.0.1:3000');
export const CONTEST_UK = process.env.DEV_CONTEST_UK || 'tmp-live-contest';
export const AUTH_TOKEN = process.env.AUTH_TOKEN || 'dev-token';
export const PRODUCER_ID = process.env.DEV_PRODUCER_ID || 'tmp-producer';

export const MYSQL_HOST = process.env.MYSQL_HOST || '127.0.0.1';
export const MYSQL_PORT = parseInt(process.env.MYSQL_PORT || '3306', 10);
export const MYSQL_USER = process.env.MYSQL_USER || 'blue';
export const MYSQL_PASS = process.env.MYSQL_PASS ?? 'test';
export const MYSQL_DB = process.env.MYSQL_DB || 'rankland';

export function apiPath(path: string): string {
  return `/api/v2${path}`;
}

export function contestPath(path: string): string {
  return apiPath(`/contests/${encodeURIComponent(CONTEST_UK)}${path}`);
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}
