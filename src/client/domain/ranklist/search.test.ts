import { describe, expect, it } from 'vitest';
import type { IApiRanklistInfo } from '@/services/ranklist-api';
import {
  formatRanklistCreatedAt,
  getRecentRanklists,
  getSearchKeyword,
  searchRanklists,
} from './search';

const makeRank = (patch: Partial<IApiRanklistInfo> & Pick<IApiRanklistInfo, 'uniqueKey' | 'name'>): IApiRanklistInfo => ({
  id: patch.uniqueKey,
  uniqueKey: patch.uniqueKey,
  name: patch.name,
  fileID: `${patch.uniqueKey}.srk`,
  viewCnt: patch.viewCnt ?? 0,
  content: patch.content ?? '',
  createdAt: patch.createdAt ?? '2026-01-02T03:04:05',
  updatedAt: patch.updatedAt ?? '2026-01-02T03:04:05',
});

const ranks = [
  makeRank({
    uniqueKey: 'icpc-2026-shanghai',
    name: '2026 ICPC Asia Shanghai Regional Contest',
    viewCnt: 96,
    createdAt: '2026-11-24T10:30:00',
  }),
  makeRank({
    uniqueKey: 'ccpc-2025-final',
    name: 'CCPC 2025 Final',
    viewCnt: 42,
    createdAt: '2025-05-01T01:02:03',
  }),
  makeRank({
    uniqueKey: 'winter-camp',
    name: 'Training Camp Day 1',
    viewCnt: 7,
    createdAt: '2025-01-03T12:13:14',
  }),
];

describe('ranklist search helpers', () => {
  it('keeps the source recent-list behavior by taking the first ranks', () => {
    expect(getRecentRanklists(ranks, 2).map((item) => item.uniqueKey)).toEqual([
      'icpc-2026-shanghai',
      'ccpc-2025-final',
    ]);
  });

  it('searches by ranklist name and unique key with Fuse', () => {
    expect(searchRanklists(ranks, 'Shanghai').map((item) => item.uniqueKey)).toEqual(['icpc-2026-shanghai']);
    expect(searchRanklists(ranks, 'ccpc-2025')[0]?.uniqueKey).toBe('ccpc-2025-final');
  });

  it('returns no search rows until a keyword is present', () => {
    expect(searchRanklists(ranks, '')).toEqual([]);
    expect(searchRanklists(ranks, '   ')).toEqual([]);
  });

  it('normalizes route-query keyword values', () => {
    expect(getSearchKeyword('icpc')).toBe('icpc');
    expect(getSearchKeyword(['ccpc', 'ignored'])).toBe('ccpc');
    expect(getSearchKeyword(undefined)).toBe('');
  });

  it('formats created-at timestamps like the legacy dayjs view', () => {
    expect(formatRanklistCreatedAt('2026-11-24T10:30:00')).toBe('2026-11-24 10:30');
  });
});
