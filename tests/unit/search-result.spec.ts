import { describe, expect, it } from 'vitest';
import type { IApiRanklistInfo } from '@common/rankland-api';
import {
  formatSearchCreatedAt,
  getRecentRanklists,
  normalizeSearchKeyword,
  searchRanklists,
} from '@client/modules/search/search-result';

const ranklists: IApiRanklistInfo[] = [
  {
    id: 'rid-1',
    uniqueKey: 'test-key',
    name: 'Test Contest 2024',
    fileID: 'file-test-1',
    viewCnt: 42,
    content: '',
    createdAt: '2024-04-01T10:00:00',
    updatedAt: '2024-04-01T12:00:00',
  },
  {
    id: 'rid-2',
    uniqueKey: 'another-key',
    name: 'Another Contest',
    fileID: 'file-test-2',
    viewCnt: 7,
    content: '',
    createdAt: '2024-03-15T10:00:00',
    updatedAt: '2024-03-15T12:00:00',
  },
  {
    id: 'rid-3',
    uniqueKey: 'noise-key',
    name: 'Completely Unrelated Match',
    fileID: 'file-test-3',
    viewCnt: 3,
    content: '',
    createdAt: '2024-02-15T10:00:00',
    updatedAt: '2024-02-15T12:00:00',
  },
];

describe('search-result helpers', () => {
  it('normalizes search keywords from route values', () => {
    expect(normalizeSearchKeyword('  contest  ')).toBe('contest');
    expect(normalizeSearchKeyword(['contest'])).toBe('');
    expect(normalizeSearchKeyword(undefined)).toBe('');
  });

  it('returns recent ranklists in source order up to the limit', () => {
    expect(getRecentRanklists(ranklists, 2).map((ranklist) => ranklist.uniqueKey)).toEqual(['test-key', 'another-key']);
  });

  it('returns no search rows for an empty keyword', () => {
    expect(searchRanklists(ranklists, '')).toEqual([]);
  });

  it('finds ranklists by name', () => {
    expect(searchRanklists(ranklists, 'Test 2024').map((ranklist) => ranklist.uniqueKey)).toEqual(['test-key']);
  });

  it('finds ranklists by uniqueKey', () => {
    expect(searchRanklists(ranklists, 'another-key').map((ranklist) => ranklist.uniqueKey)).toEqual(['another-key']);
  });

  it('formats createdAt timestamps using local date parts', () => {
    expect(formatSearchCreatedAt('2024-04-01T10:05:30')).toBe('2024-04-01 10:05');
  });
});
