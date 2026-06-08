import Fuse from 'fuse.js';
import type { IApiRanklistInfo } from '@/services/ranklist-api';

export function getRecentRanklists(ranks: IApiRanklistInfo[] = [], limit = 10) {
  return ranks.slice(0, limit);
}

export function searchRanklists(ranks: IApiRanklistInfo[] = [], keyword: string) {
  const normalizedKeyword = keyword.trim();
  if (!normalizedKeyword) {
    return [];
  }

  return new Fuse(ranks, {
    keys: ['name', 'uniqueKey'],
    threshold: 0.3,
  }).search(normalizedKeyword).map((item) => item.item);
}

export function getSearchKeyword(value: unknown) {
  if (Array.isArray(value)) {
    return String(value[0] ?? '');
  }
  return value === undefined || value === null ? '' : String(value);
}

export function formatRanklistCreatedAt(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hour = pad2(date.getHours());
  const minute = pad2(date.getMinutes());
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function pad2(value: number) {
  return String(value).padStart(2, '0');
}
