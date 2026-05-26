import { describe, expect, it } from 'vitest';
import type * as srk from '@algoux/standard-ranklist';
import fixture from '../fixtures/ranklist.srk.json';
import { createRanklandRanklistState } from '@client/components/rankland-ranklist-state';

function createFilterFixture(): srk.Ranklist {
  const ranklist = JSON.parse(JSON.stringify(fixture)) as srk.Ranklist;
  ranklist.markers = [
    { id: 'gold', label: 'Gold Group', style: 'gold' },
    { id: 'silver', label: 'Silver Group', style: 'silver' },
  ];
  ranklist.series = [
    ranklist.series[0],
    {
      title: 'Gold Rank',
      rule: {
        preset: 'ICPC',
        options: {
          filter: {
            byMarker: 'gold',
          },
        },
      },
    },
  ];
  ranklist.rows[0].user.organization = 'Org A';
  ranklist.rows[0].user.markers = ['gold'];
  ranklist.rows[1].user.organization = 'Org B';
  ranklist.rows[1].user.official = false;
  ranklist.rows[1].user.markers = ['silver'];
  return ranklist;
}

describe('createRanklandRanklistState', () => {
  it('returns static ranklist data for valid SRK input', () => {
    const result = createRanklandRanklistState(fixture as srk.Ranklist);

    expect(result.kind).toBe('ready');
    if (result.kind === 'ready') {
      expect(result.staticRanklist.rows).toHaveLength(2);
      expect(result.staticRanklist.rows[0].user.name).toBe('Team Alpha');
    }
  });

  it('returns a render error for SRK input that cannot be converted', () => {
    const result = createRanklandRanklistState({ type: 'general' } as srk.Ranklist);

    expect(result.kind).toBe('error');
    if (result.kind === 'error') {
      expect(result.message).toContain('Cannot read');
    }
  });

  it('filters rows by organization and recalculates problem statistics', () => {
    const result = createRanklandRanklistState(createFilterFixture(), {
      filter: {
        organizations: ['Org A'],
        officialOnly: false,
        marker: '',
      },
    });

    expect(result.kind).toBe('ready');
    if (result.kind === 'ready') {
      expect(result.organizations).toEqual(['Org A', 'Org B']);
      expect(result.staticRanklist.rows.map((row) => row.user.id)).toEqual(['team-alpha']);
      expect(result.staticRanklist.problems?.[0].statistics).toEqual({ accepted: 1, submitted: 1 });
      expect(result.staticRanklist.problems?.[1].statistics).toEqual({ accepted: 1, submitted: 2 });
    }
  });

  it('filters out unofficial rows when officialOnly is enabled', () => {
    const result = createRanklandRanklistState(createFilterFixture(), {
      filter: {
        organizations: [],
        officialOnly: true,
        marker: '',
      },
    });

    expect(result.kind).toBe('ready');
    if (result.kind === 'ready') {
      expect(result.staticRanklist.rows.map((row) => row.user.id)).toEqual(['team-alpha']);
    }
  });

  it('filters out rows with missing official flag when officialOnly is enabled', () => {
    const result = createRanklandRanklistState(fixture as srk.Ranklist, {
      filter: {
        organizations: [],
        officialOnly: true,
        marker: '',
      },
    });

    expect(result.kind).toBe('ready');
    if (result.kind === 'ready') {
      expect(result.staticRanklist.rows.map((row) => row.user.id)).toEqual(['team-alpha']);
    }
  });

  it('filters rows and marker-scoped ICPC series by marker', () => {
    const result = createRanklandRanklistState(createFilterFixture(), {
      filter: {
        organizations: [],
        officialOnly: false,
        marker: 'gold',
      },
    });

    expect(result.kind).toBe('ready');
    if (result.kind === 'ready') {
      expect(result.markers.map((marker) => marker.id)).toEqual(['gold', 'silver']);
      expect(result.staticRanklist.rows.map((row) => row.user.id)).toEqual(['team-alpha']);
      expect(result.staticRanklist.series.map((series) => series.title)).toEqual(['Rank', 'Gold Rank']);
    }
  });

  it('regenerates ranklist rows before rendering when time travel is enabled', () => {
    const result = createRanklandRanklistState(fixture as srk.Ranklist, {
      timeTravelTime: 50 * 60 * 1000,
    });

    expect(result.kind).toBe('ready');
    if (result.kind === 'ready') {
      const alpha = result.staticRanklist.rows.find((row) => row.user.id === 'team-alpha');
      const beta = result.staticRanklist.rows.find((row) => row.user.id === 'team-beta');

      expect(alpha?.score.value).toBe(1);
      expect(beta?.score.value).toBe(0);
    }
  });
});
