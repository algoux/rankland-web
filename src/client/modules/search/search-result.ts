import Fuse from 'fuse.js';
import type { IApiRanklistInfo } from '@common/rankland-api';

export function normalizeSearchKeyword(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function getRecentRanklists(ranklists: IApiRanklistInfo[], limit = 10): IApiRanklistInfo[] {
  return ranklists.slice(0, limit);
}

export function searchRanklists(ranklists: IApiRanklistInfo[], keyword: string): IApiRanklistInfo[] {
  if (!keyword) {
    return [];
  }

  const fuse = new Fuse(ranklists, {
    keys: ['name', 'uniqueKey'],
    threshold: 0.3,
  });

  return fuse.search(keyword).map((result) => result.item);
}

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatSearchCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());
  const hour = padDatePart(date.getHours());
  const minute = padDatePart(date.getMinutes());

  return `${year}-${month}-${day} ${hour}:${minute}`;
}
