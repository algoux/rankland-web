import type * as srk from '@algoux/standard-ranklist';
import type { StaticRanklist } from '@algoux/standard-ranklist-utils';
import { convertToStaticRanklist } from '@algoux/standard-ranklist-renderer-component-core';
import {
  calculateProblemStatistics,
  filterSolutionsUntil,
  getSortedCalculatedRawSolutions,
  regenerateRanklistBySolutions,
  resolveText,
  resolveUserMarkers,
} from '@algoux/standard-ranklist-utils';
import { getLegacyRanklistCheckError } from './rankland-ranklist-checker';

export interface RanklandRanklistFilterState {
  organizations: string[];
  officialOnly: boolean;
  marker: string;
}

export interface RanklandRanklistStateOptions {
  filter?: RanklandRanklistFilterState;
  timeTravelTime?: number | null;
}

export type RanklandRanklistState =
  | {
      kind: 'ready';
      staticRanklist: StaticRanklist;
      organizations: string[];
      markers: srk.Marker[];
    }
  | {
      kind: 'check-error';
      message: string;
    }
  | {
      kind: 'error';
      message: string;
    };

function normalizeRenderError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error || 'Unknown renderer error.');
}

function deriveTimeTravelRanklist(ranklist: srk.Ranklist, timeTravelTime?: number | null): srk.Ranklist {
  if (timeTravelTime === undefined || timeTravelTime === null) {
    return ranklist;
  }

  const solutions = getSortedCalculatedRawSolutions(ranklist.rows);
  return regenerateRanklistBySolutions(ranklist, filterSolutionsUntil(solutions, [timeTravelTime, 'ms']));
}

function getOrganizations(staticRanklist: StaticRanklist): string[] {
  return Array.from(
    new Set(staticRanklist.rows.map((row) => resolveText(row.user?.organization)).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
}

function getFilteredSeriesIndexes(staticRanklist: StaticRanklist, marker: string): number[] {
  return staticRanklist.series
    .map((_, index) => index)
    .filter((seriesIndex) => {
      if (!marker) {
        return true;
      }

      const series = staticRanklist.series[seriesIndex];
      if (series.rule?.preset === 'ICPC') {
        return !series.rule.options?.filter?.byMarker || series.rule.options.filter.byMarker === marker;
      }

      return true;
    });
}

function filterStaticRanklist(staticRanklist: StaticRanklist, filter: RanklandRanklistFilterState): StaticRanklist {
  const filteredSeriesIndexes = getFilteredSeriesIndexes(staticRanklist, filter.marker);
  const filteredSeries = staticRanklist.series.filter((_, index) => filteredSeriesIndexes.includes(index));
  const filteredRows = staticRanklist.rows
    .filter((row) => {
      if (filter.organizations.length > 0 && !filter.organizations.includes(resolveText(row.user?.organization))) {
        return false;
      }
      if (filter.officialOnly && row.user?.official !== true) {
        return false;
      }
      if (
        filter.marker &&
        !resolveUserMarkers(row.user, staticRanklist.markers).some((marker) => marker.id === filter.marker)
      ) {
        return false;
      }
      return true;
    })
    .map((row) => {
      if (filteredSeriesIndexes.length === staticRanklist.series.length) {
        return row;
      }

      return {
        ...row,
        rankValues: filteredSeriesIndexes.map((seriesIndex) => row.rankValues[seriesIndex]),
      };
    });
  const problemStatistics = calculateProblemStatistics({
    ...staticRanklist,
    rows: filteredRows,
  } as srk.Ranklist);

  return {
    ...staticRanklist,
    problems: staticRanklist.problems?.map((problem, index) => ({
      ...problem,
      statistics: problemStatistics[index] || problem.statistics,
    })),
    series: filteredSeries,
    rows: filteredRows,
  };
}

export function createRanklandRanklistState(
  ranklist: srk.Ranklist,
  options: RanklandRanklistStateOptions = {},
): RanklandRanklistState {
  try {
    const checkError = getLegacyRanklistCheckError(ranklist);
    if (checkError) {
      return {
        kind: 'check-error',
        message: checkError,
      };
    }

    const renderRanklist = deriveTimeTravelRanklist(ranklist, options.timeTravelTime);
    const staticRanklist = convertToStaticRanklist(renderRanklist);
    const filter = options.filter || {
      organizations: [],
      officialOnly: false,
      marker: '',
    };

    return {
      kind: 'ready',
      staticRanklist: filterStaticRanklist(staticRanklist, filter),
      organizations: getOrganizations(staticRanklist),
      markers: staticRanklist.markers || [],
    };
  } catch (error) {
    return {
      kind: 'error',
      message: normalizeRenderError(error),
    };
  }
}
