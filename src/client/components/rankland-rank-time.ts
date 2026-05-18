import type * as srk from '@algoux/standard-ranklist';
import {
  convertToStaticRanklist,
  EnumTheme,
  formatTimeDuration,
  regenerateRanklistBySolutions,
  regenerateRowsByIncrementalSolutions,
  resolveThemeColor,
  resolveUserMarkers,
  type CalculatedSolutionTetrad,
  type StaticRanklist,
} from '@algoux/standard-ranklist-utils';

export interface RankTimePoint {
  time: number;
  rank: number;
  solved: number;
}

export interface RankTimeSolvedEventPoint {
  time: number;
  rank: number;
  problemAlias: string;
  solvedTime: srk.TimeDuration;
  fb?: boolean;
}

export interface RankTimeSeriesSegment {
  title: string;
  resolvedColor: string;
  points: Array<{
    time: number;
    start: number;
    end: number;
  }>;
}

export interface RankTimeDataSet {
  unit: srk.TimeUnit;
  userRankTimePointsList: Map<string, RankTimePoint[][]>;
  userRankTimeSolvedEventPointsList: Map<string, RankTimeSolvedEventPoint[][]>;
  seriesSegmentsList: RankTimeSeriesSegment[][];
  totalUsers: number;
}

export interface SelectedUserMainRankTimeData {
  unit: srk.TimeUnit;
  points: RankTimePoint[];
  solvedEventPoints: RankTimeSolvedEventPoint[];
  seriesSegments: RankTimeSeriesSegment[];
  totalUsers: number;
}

export function getProperRankTimeChunkUnit(contest: srk.Contest): srk.TimeDuration {
  const durationInHour = formatTimeDuration(contest.duration, 'h');
  if (durationInHour <= 5) {
    return [1, 'min'];
  }
  if (durationInHour <= 24) {
    return [5, 'min'];
  }
  if (durationInHour <= 24 * 7) {
    return [1, 'h'];
  }
  return [1, 'd'];
}

function findUserMatchedMainICPCSeries(
  seriesList: srk.RankSeries[],
  userMarkers: srk.Marker[],
  fixedMarker?: string,
): srk.RankSeries | undefined {
  const icpcSeries = seriesList.filter((series) => series.rule?.preset === 'ICPC');
  if (icpcSeries.length === 0) {
    return undefined;
  }

  if (fixedMarker) {
    if (!userMarkers.find((userMarker) => userMarker.id === fixedMarker)) {
      return undefined;
    }
    return icpcSeries.find(
      (series) => (series.rule as srk.RankSeriesRulePresetICPC).options?.filter?.byMarker === fixedMarker,
    );
  }

  const markerScopedSeries = icpcSeries.find((series) => {
    const seriesFilterMarker = (series.rule as srk.RankSeriesRulePresetICPC).options?.filter?.byMarker;
    return !!(seriesFilterMarker && userMarkers.find((userMarker) => userMarker.id === seriesFilterMarker));
  });
  if (markerScopedSeries) {
    return markerScopedSeries;
  }

  return icpcSeries.find(
    (series) => !(series.rule as srk.RankSeriesRulePresetICPC).options?.filter?.byMarker,
  );
}

export function selectUserMainRankTimeData(params: {
  rankTimeDataSet: RankTimeDataSet;
  staticRows: StaticRanklist['rows'];
  staticSeries: StaticRanklist['series'];
  staticMarkers?: srk.Marker[];
  userId: string;
  fixedMarker?: string;
}): SelectedUserMainRankTimeData | null {
  const { rankTimeDataSet, staticRows, staticSeries, staticMarkers, userId, fixedMarker } = params;
  const user = staticRows.find((row) => row.user?.id === userId)?.user;
  if (!user) {
    return null;
  }

  const icpcSeries = staticSeries.filter((series) => series.rule?.preset === 'ICPC');
  const userMarkers = resolveUserMarkers(user, staticMarkers);
  const matchedMainICPCSeries = findUserMatchedMainICPCSeries(icpcSeries, userMarkers, fixedMarker);
  if (!matchedMainICPCSeries) {
    return null;
  }

  const matchedMainICPCSeriesIndex = icpcSeries.findIndex((series) => series === matchedMainICPCSeries);
  if (matchedMainICPCSeriesIndex < 0) {
    return null;
  }

  const points = (rankTimeDataSet.userRankTimePointsList.get(userId) || [])[matchedMainICPCSeriesIndex] || [];
  if (points.length === 0) {
    return null;
  }

  return {
    unit: rankTimeDataSet.unit,
    points,
    solvedEventPoints:
      (rankTimeDataSet.userRankTimeSolvedEventPointsList.get(userId) || [])[matchedMainICPCSeriesIndex] || [],
    seriesSegments: rankTimeDataSet.seriesSegmentsList[matchedMainICPCSeriesIndex] || [],
    totalUsers: rankTimeDataSet.totalUsers,
  };
}

function resolveSegmentStyle(style: srk.RankSeriesSegment['style']): string {
  if (typeof style === 'string') {
    switch (style) {
      case 'gold':
        return '#f8bf29';
      case 'silver':
        return '#c0c0c0';
      case 'bronze':
        return '#d69872';
      case 'iron':
        return '#a94442';
      default:
        return 'transparent';
    }
  }
  if (style?.backgroundColor) {
    return resolveThemeColor(style.backgroundColor)[EnumTheme.light] || 'transparent';
  }
  return 'transparent';
}

function cloneSolvedEventPoint(point: RankTimeSolvedEventPoint): RankTimeSolvedEventPoint {
  return {
    ...point,
    solvedTime: [...point.solvedTime] as srk.TimeDuration,
  };
}

export function getAllRankTimeData(
  ranklist: srk.Ranklist,
  solutions: CalculatedSolutionTetrad[],
  unit: srk.TimeDuration,
): RankTimeDataSet {
  const timePoints: srk.TimeDuration[] = [];
  const durationInTargetUnit = formatTimeDuration(ranklist.contest.duration, unit[1]);
  let ts = 0;
  timePoints.push([ts, unit[1]]);
  while (ts < durationInTargetUnit) {
    ts = Math.min(ts + unit[0], durationInTargetUnit);
    timePoints.push([ts, unit[1]]);
  }

  const icpcSeriesList: srk.RankSeries[] = ranklist.series
    .filter((series) => series.rule?.preset === 'ICPC')
    .map((icpcSeries) => {
      const options = (icpcSeries.rule as srk.RankSeriesRulePresetICPC).options;
      const hasRatio = options?.ratio?.value.some((value) => value > 0);
      const hasCount = options?.count?.value.some((value) => value > 0);
      if (!hasRatio && !hasCount) {
        return {
          title: '#',
          segments: [],
          rule: { preset: 'ICPC', options: { count: { value: [] } } },
        } as srk.RankSeries;
      }
      return icpcSeries;
    });

  const seriesSegmentRangesList: RankTimeSeriesSegment[][] = [];
  const fixedSeriesSegmentRangesList: Array<Array<{ start: number; end: number }>> = [];
  for (const icpcSeries of icpcSeriesList) {
    const seriesSegmentRanges: RankTimeSeriesSegment[] = [];
    const fixedSeriesSegmentRanges: Array<{ start: number; end: number }> = [];
    const icpcSeriesOptions = (icpcSeries.rule as srk.RankSeriesRulePresetICPC).options;

    seriesSegmentRanges.push(
      ...(icpcSeries.segments || []).map((segment) => ({
        title: segment.title || '',
        resolvedColor: resolveSegmentStyle(segment.style),
        points: [],
      })),
    );

    if (icpcSeriesOptions?.count?.noTied) {
      let start = 1;
      icpcSeriesOptions.count.value.forEach((value) => {
        fixedSeriesSegmentRanges.push({
          start,
          end: start + value - 1,
        });
        start += value;
      });
    }

    seriesSegmentRangesList.push(seriesSegmentRanges);
    fixedSeriesSegmentRangesList.push(fixedSeriesSegmentRanges);
  }

  const rowsGroupByTimePoints: StaticRanklist['rows'][] = [];
  const commonSolvedEventPoints = new Map<string, RankTimeSolvedEventPoint[]>();
  let solutionIndex = 0;
  const lastRows = regenerateRanklistBySolutions(ranklist, []).rows;
  const lastRanklist: srk.Ranklist = {
    ...ranklist,
    series: icpcSeriesList,
    rows: lastRows,
  };

  for (let timePointIndex = 0; timePointIndex < timePoints.length; timePointIndex++) {
    const timePoint = timePoints[timePointIndex];
    for (let seriesIndex = 0; seriesIndex < icpcSeriesList.length; seriesIndex++) {
      const fixedSeriesSegmentRanges = fixedSeriesSegmentRangesList[seriesIndex];
      if (fixedSeriesSegmentRanges.length > 0) {
        seriesSegmentRangesList[seriesIndex].forEach((segment, index) => {
          segment.points.push({
            time: timePoint[0],
            ...fixedSeriesSegmentRanges[index],
          });
        });
      }
    }

    const timeValue = formatTimeDuration(timePoint);
    const incrementalSolutions: CalculatedSolutionTetrad[] = [];
    while (solutionIndex < solutions.length && formatTimeDuration(solutions[solutionIndex][3]) <= timeValue) {
      incrementalSolutions.push(solutions[solutionIndex]);
      solutionIndex++;
    }

    if (incrementalSolutions.length) {
      for (const solution of incrementalSolutions) {
        const [userId, problemIndex, result, time] = solution;
        if (!commonSolvedEventPoints.has(userId)) {
          commonSolvedEventPoints.set(userId, []);
        }
        if (result !== 'AC' && result !== 'FB') {
          continue;
        }

        commonSolvedEventPoints.get(userId)!.push({
          time: timePoint[0],
          rank: -1,
          problemAlias: ranklist.problems[problemIndex].alias || `${problemIndex + 1}`,
          solvedTime: time,
          fb: result === 'FB',
        });
      }

      lastRanklist.rows = regenerateRowsByIncrementalSolutions(lastRanklist, incrementalSolutions);
      const staticRows = convertToStaticRanklist(lastRanklist).rows;
      rowsGroupByTimePoints.push(staticRows);

      for (let seriesIndex = 0; seriesIndex < icpcSeriesList.length; seriesIndex++) {
        const seriesSegmentRanges = seriesSegmentRangesList[seriesIndex];
        const fixedSeriesSegmentRanges = fixedSeriesSegmentRangesList[seriesIndex];
        const rankValueList = staticRows.map((row) => row.rankValues[seriesIndex]).filter(Boolean);
        const ranges = seriesSegmentRanges.map(() => ({
          time: timePoint[0],
          start: -1,
          end: -1,
        }));

        if (fixedSeriesSegmentRanges.length === 0) {
          let segmentIndex = -1;
          let cursor = 0;
          while (segmentIndex < seriesSegmentRanges.length && cursor < rankValueList.length) {
            const current = rankValueList[cursor];
            if (!current.rank) {
              cursor++;
              continue;
            }
            if (typeof current.segmentIndex !== 'number') {
              break;
            }
            if (current.segmentIndex > segmentIndex) {
              segmentIndex = current.segmentIndex;
              ranges[segmentIndex].start = ranges[segmentIndex].end = current.rank;
            } else if (current.segmentIndex === segmentIndex) {
              ranges[segmentIndex].end = current.rank;
            }
            cursor++;
          }
        }

        for (let rangeIndex = 0; rangeIndex < ranges.length; rangeIndex++) {
          const range = ranges[rangeIndex];
          const nextRange = ranges[rangeIndex + 1];
          if (range.start !== -1 && range.end !== -1) {
            if (nextRange && nextRange.start !== -1 && nextRange.start > range.end) {
              range.end = nextRange.start - 1;
            }
            seriesSegmentRanges[rangeIndex].points.push(range);
          } else {
            break;
          }
        }
      }
    } else if (rowsGroupByTimePoints.length) {
      rowsGroupByTimePoints.push(rowsGroupByTimePoints[rowsGroupByTimePoints.length - 1]);
      seriesSegmentRangesList.forEach((seriesSegmentRanges, seriesIndex) => {
        if (fixedSeriesSegmentRangesList[seriesIndex].length === 0) {
          seriesSegmentRanges.forEach((segment) => {
            const latestPoint = segment.points[segment.points.length - 1];
            if (latestPoint) {
              segment.points.push({ ...latestPoint, time: timePoint[0] });
            }
          });
        }
      });
    } else {
      rowsGroupByTimePoints.push(convertToStaticRanklist(lastRanklist).rows);
    }
  }

  const userRankTimePointsList = new Map<string, RankTimePoint[][]>();
  const userRankTimeSolvedEventPointsList = new Map<string, RankTimeSolvedEventPoint[][]>();
  for (let timePointIndex = 0; timePointIndex < timePoints.length; timePointIndex++) {
    const timePoint = timePoints[timePointIndex];
    const rows = rowsGroupByTimePoints[timePointIndex] || [];
    for (const row of rows) {
      const user = row.user;
      if (!userRankTimePointsList.has(user.id)) {
        userRankTimePointsList.set(user.id, []);
      }

      const rankTimePointsList = userRankTimePointsList.get(user.id)!;
      while (rankTimePointsList.length < icpcSeriesList.length) {
        rankTimePointsList.push([]);
      }

      for (let seriesIndex = 0; seriesIndex < icpcSeriesList.length; seriesIndex++) {
        const rank = row.rankValues[seriesIndex]?.rank;
        if (typeof rank !== 'number') {
          continue;
        }

        rankTimePointsList[seriesIndex].push({
          time: timePoint[0],
          rank,
          solved: row.score.value,
        });
      }
    }
  }

  for (const [userId, solvedEventPoints] of commonSolvedEventPoints) {
    const rankTimePointsList = userRankTimePointsList.get(userId);
    if (!rankTimePointsList) {
      continue;
    }

    const rankTimeSolvedEventPointsList: RankTimeSolvedEventPoint[][] = [];
    for (let seriesIndex = 0; seriesIndex < icpcSeriesList.length; seriesIndex++) {
      const rankTimePoints = rankTimePointsList[seriesIndex] || [];
      const rankTimeSolvedEventPoints = solvedEventPoints.map(cloneSolvedEventPoint);
      for (const solvedEventPoint of rankTimeSolvedEventPoints) {
        const rankTimePoint = rankTimePoints.find((point) => point.time === solvedEventPoint.time);
        if (rankTimePoint) {
          solvedEventPoint.rank = rankTimePoint.rank;
        }
      }
      rankTimeSolvedEventPointsList.push(rankTimeSolvedEventPoints);
    }
    userRankTimeSolvedEventPointsList.set(userId, rankTimeSolvedEventPointsList);
  }

  return {
    unit: unit[1],
    userRankTimePointsList,
    userRankTimeSolvedEventPointsList,
    seriesSegmentsList: seriesSegmentRangesList,
    totalUsers: ranklist.rows.length,
  };
}
