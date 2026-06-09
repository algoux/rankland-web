/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable max-depth */
/* eslint-disable complexity */
import type * as srk from '@algoux/standard-ranklist';
import {
  EnumTheme,
  convertToStaticRanklist,
  formatTimeDuration,
  regenerateRanklistBySolutions,
  regenerateRowsByIncrementalSolutions,
  resolveThemeColor,
  resolveUserMarkers,
} from '@algoux/standard-ranklist-utils';
import type { CalculatedSolutionTetrad, StaticRanklist } from '@algoux/standard-ranklist-utils';
import { findUserMatchedMainICPCSeries } from './ranklist.util';

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
  points: {
    time: number;
    start: number;
    end: number;
  }[];
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

export interface RankTimeData extends SelectedUserMainRankTimeData {
  key: string;
  initialized: boolean;
}

export function createEmptyRankTimeDataSet(): RankTimeDataSet {
  return {
    unit: 'min',
    userRankTimePointsList: new Map(),
    userRankTimeSolvedEventPointsList: new Map(),
    seriesSegmentsList: [],
    totalUsers: 0,
  };
}

export function createEmptyRankTimeData(): RankTimeData {
  return {
    key: '',
    initialized: false,
    unit: 'min',
    points: [],
    solvedEventPoints: [],
    seriesSegments: [],
    totalUsers: 0,
  };
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

function cloneDeep<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function resolveSegmentStyle(style: srk.RankSeriesSegment['style']): srk.Color {
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

export function getAllRankTimeData(
  ranklist: srk.Ranklist,
  solutions: CalculatedSolutionTetrad[],
  unit: srk.TimeDuration,
): RankTimeDataSet {
  const unitTimeValue = formatTimeDuration(unit);
  const timePoints: srk.TimeDuration[] = [];
  {
    const durationInTargetUnit = formatTimeDuration(ranklist.contest.duration, unit[1]);
    let ts = 0;
    timePoints.push([ts, unit[1]]);
    while (ts < durationInTargetUnit) {
      ts = Math.min(ts + unit[0], durationInTargetUnit);
      timePoints.push([ts, unit[1]]);
    }
  }

  const icpcSeriesList: srk.RankSeries[] = ranklist.series
    .filter((series) => series.rule?.preset === 'ICPC')
    .map((icpcSeries) => {
      const options = (icpcSeries.rule as srk.RankSeriesRulePresetICPC).options;
      if (
        !icpcSeries ||
        (!options?.ratio?.value.some((value) => value > 0) && !options?.count?.value.some((value) => value > 0))
      ) {
        return {
          title: '#',
          segments: [],
          rule: { preset: 'ICPC', options: { count: { value: [] } } },
        };
      }
      return icpcSeries;
    });

  const seriesSegmentRangesList: RankTimeSeriesSegment[][] = [];
  const fixedSeriesSegmentRangesList: { start: number; end: number }[][] = [];
  for (const icpcSeries of icpcSeriesList) {
    const seriesSegmentRanges: RankTimeSeriesSegment[] = [];
    const fixedSeriesSegmentRanges: { start: number; end: number }[] = [];
    const icpcSeriesOptions = (icpcSeries.rule as srk.RankSeriesRulePresetICPC).options!;

    const segments = icpcSeries.segments || [];
    seriesSegmentRanges.push(
      ...segments.map((segment) => ({
        title: segment.title!,
        resolvedColor: resolveSegmentStyle(segment.style),
        points: [],
      })),
    );
    if (icpcSeriesOptions.count?.noTied) {
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
  const userRankTimeSolvedEventPointsComm = new Map<string, RankTimeSolvedEventPoint[]>();
  {
    let solutionIndex = 0;
    const lastRows = regenerateRanklistBySolutions(ranklist, []).rows;
    const lastRanklist: srk.Ranklist = {
      ...ranklist,
      series: icpcSeriesList,
      rows: lastRows,
    };
    for (let tpIndex = 0; tpIndex < timePoints.length; tpIndex++) {
      const timePoint = timePoints[tpIndex];
      for (let i = 0; i < icpcSeriesList.length; i++) {
        const fixedSeriesSegmentRanges = fixedSeriesSegmentRangesList[i];
        if (fixedSeriesSegmentRanges.length > 0) {
          seriesSegmentRangesList[i].forEach((segment, index) => {
            segment.points.push({
              time: timePoint[0],
              ...fixedSeriesSegmentRanges[index],
            });
          });
        }
      }

      const timeValue = formatTimeDuration(timePoint);
      const check = (tetrad: CalculatedSolutionTetrad) => formatTimeDuration(tetrad[3]) <= timeValue;
      const incrementalSolutions: CalculatedSolutionTetrad[] = [];
      while (solutionIndex < solutions.length) {
        const solution = solutions[solutionIndex];
        if (check(solution)) {
          incrementalSolutions.push(solution);
          solutionIndex++;
        } else {
          break;
        }
      }
      if (incrementalSolutions.length) {
        for (const solution of incrementalSolutions) {
          const [userId, problemIndex, result, time] = solution;
          if (!userRankTimeSolvedEventPointsComm.has(userId)) {
            userRankTimeSolvedEventPointsComm.set(userId, []);
          }
          if (result !== 'AC' && result !== 'FB') {
            continue;
          }
          const solvedEventPoints = userRankTimeSolvedEventPointsComm.get(userId)!;
          const problemAlias = ranklist.problems[problemIndex].alias!;
          solvedEventPoints.push({
            time: timePoint[0],
            rank: -1,
            problemAlias,
            solvedTime: time,
            fb: result === 'FB',
          });
        }
        lastRanklist.rows = regenerateRowsByIncrementalSolutions(lastRanklist, incrementalSolutions);
        const staticRows = convertToStaticRanklist(lastRanklist).rows;
        rowsGroupByTimePoints.push(staticRows);

        for (let i = 0; i < icpcSeriesList.length; i++) {
          const seriesSegmentRanges = seriesSegmentRangesList[i];
          const fixedSeriesSegmentRanges = fixedSeriesSegmentRangesList[i];
          const rankValueList = staticRows.map((row) => row.rankValues[i]);
          const ranges = new Array(seriesSegmentRanges.length).fill(0).map(() => ({
            time: timePoint[0],
            start: -1,
            end: -1,
          }));
          if (fixedSeriesSegmentRanges.length === 0) {
            let segmentIndex = -1;
            let cursor = 0;
            while (segmentIndex < seriesSegmentRanges.length && cursor < rankValueList.length) {
              const cur = rankValueList[cursor];
              if (!cur.rank) {
                cursor++;
                continue;
              }
              if (typeof cur.segmentIndex !== 'number') {
                break;
              }
              if (cur.segmentIndex > segmentIndex) {
                segmentIndex = cur.segmentIndex;
                ranges[segmentIndex].start = ranges[segmentIndex].end = cur.rank;
              } else if (cur.segmentIndex === segmentIndex) {
                ranges[segmentIndex].end = cur.rank;
              }
              cursor++;
            }
          }
          for (let j = 0; j < ranges.length; ++j) {
            const range = ranges[j];
            if (range.start !== -1 && range.end !== -1) {
              if (j + 1 < ranges.length && ranges[j + 1].start !== -1 && ranges[j + 1].start > range.end) {
                range.end = ranges[j + 1].start - 1;
              }
              seriesSegmentRanges[j].points.push(range);
            } else {
              break;
            }
          }
        }
      } else {
        if (rowsGroupByTimePoints.length) {
          rowsGroupByTimePoints.push(rowsGroupByTimePoints[rowsGroupByTimePoints.length - 1]);
        } else {
          rowsGroupByTimePoints.push(convertToStaticRanklist(lastRanklist).rows);
        }
        seriesSegmentRangesList.forEach((seriesSegmentRanges, index) => {
          if (fixedSeriesSegmentRangesList[index].length === 0) {
            seriesSegmentRanges.forEach((range) => {
              if (range.points.length) {
                range.points.push(cloneDeep(range.points[range.points.length - 1]));
                range.points[range.points.length - 1].time = timePoint[0];
              }
            });
          }
        });
      }
    }
  }

  const userRankTimePointsList = new Map<string, RankTimePoint[][]>();
  const userRankTimeSolvedEventPointsList = new Map<string, RankTimeSolvedEventPoint[][]>();
  for (let i = 0; i < timePoints.length; i++) {
    const timePoint = timePoints[i];
    const rows = rowsGroupByTimePoints[i];
    for (const row of rows) {
      const user = row.user;
      if (!userRankTimePointsList.has(user.id)) {
        userRankTimePointsList.set(user.id, []);
      }
      const rankTimePointsList = userRankTimePointsList.get(user.id)!;
      while (rankTimePointsList.length < icpcSeriesList.length) {
        rankTimePointsList.push([]);
      }
      for (let j = 0; j < icpcSeriesList.length; j++) {
        const rankTimePoints = rankTimePointsList[j];
        const rank = row.rankValues[j].rank;
        if (typeof rank !== 'number') {
          continue;
        }
        rankTimePoints.push({
          time: timePoint[0],
          rank,
          solved: row.score.value,
        });
      }
    }
  }
  for (const [userId, solvedEventPointsComm] of userRankTimeSolvedEventPointsComm) {
    const rankTimePointsList = userRankTimePointsList.get(userId)!;
    const rankTimeSolvedEventPointsList: RankTimeSolvedEventPoint[][] = [];
    for (let i = 0; i < icpcSeriesList.length; i++) {
      const rankTimePoints = rankTimePointsList[i];
      const rankTimeSolvedEventPoints: RankTimeSolvedEventPoint[] = cloneDeep(solvedEventPointsComm);
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
