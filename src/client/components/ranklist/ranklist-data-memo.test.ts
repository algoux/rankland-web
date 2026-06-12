import { describe, expect, it, vi } from 'vitest';
import type * as srk from '@algoux/standard-ranklist';
import {
  hasRanklistPayloadReferenceChange,
  toRanklistPayloadWithoutVolatileFields,
} from './ranklist-data-memo';

function createRanklist(rows: srk.Ranklist['rows']): srk.Ranklist {
  return {
    type: 'general',
    version: '0.3.12',
    contest: {
      title: 'Memo Test Contest',
      startAt: '2026-06-01T09:00:00+08:00',
      duration: [5, 'h'],
    },
    problems: [{ alias: 'A' }],
    series: [{ title: '#', rule: { preset: 'ICPC', options: { count: { value: [] } } } }],
    rows,
  };
}

describe('ranklist data memo helpers', () => {
  it('ignores volatile _now-only updates without stringifying the ranklist payload', () => {
    const rows = [
      {
        user: { id: 'alice', name: 'Alice', official: true },
        score: { value: 1, time: [10, 'min'] },
        statuses: [{ result: 'AC', time: [10, 'min'], tries: 1 }],
      },
    ] as srk.Ranklist['rows'];
    const previous = { ...createRanklist(rows), _now: 1 } as srk.Ranklist & { _now: number };
    const next = { ...previous, _now: 2 };
    const stringify = JSON.stringify;
    const stringifySpy = vi.spyOn(JSON, 'stringify').mockImplementation((value, replacer, space) => {
      if (value && typeof value === 'object' && Array.isArray((value as Partial<srk.Ranklist>).rows)) {
        throw new Error('unexpected full ranklist stringify');
      }
      return stringify(value, replacer as never, space);
    });

    try {
      expect(hasRanklistPayloadReferenceChange(previous, next)).toBe(false);
      expect(toRanklistPayloadWithoutVolatileFields(next)).not.toHaveProperty('_now');
    } finally {
      stringifySpy.mockRestore();
    }
  });

  it('detects real payload replacement by top-level references', () => {
    const previous = createRanklist([]);
    const next = createRanklist([
      {
        user: { id: 'alice', name: 'Alice', official: true },
        score: { value: 1, time: [10, 'min'] },
        statuses: [{ result: 'AC', time: [10, 'min'], tries: 1 }],
      },
    ]);

    expect(hasRanklistPayloadReferenceChange(previous, next)).toBe(true);
  });
});
