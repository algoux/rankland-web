import type * as srk from '@algoux/standard-ranklist';

export function findUserMatchedMainICPCSeries(
  seriesList: srk.RankSeries[],
  userMarkers: srk.Marker[],
  fixedMarker?: string,
): srk.RankSeries | undefined {
  const icpcSeries = seriesList.filter((series) => series.rule?.preset === 'ICPC');
  if (icpcSeries.length === 0) {
    return undefined;
  }

  if (fixedMarker) {
    if (!userMarkers.find((marker) => marker.id === fixedMarker)) {
      return undefined;
    }
    return icpcSeries.find((series) => {
      const rule = series.rule as srk.RankSeriesRulePresetICPC;
      return rule.options?.filter?.byMarker === fixedMarker;
    });
  }

  const markerMatchedSeries = icpcSeries.find((series) => {
    const rule = series.rule as srk.RankSeriesRulePresetICPC;
    const seriesFilterMarker = rule.options?.filter?.byMarker;
    return !!(seriesFilterMarker && userMarkers.find((marker) => marker.id === seriesFilterMarker));
  });
  if (markerMatchedSeries) {
    return markerMatchedSeries;
  }

  return icpcSeries.find((series) => {
    const rule = series.rule as srk.RankSeriesRulePresetICPC;
    return !rule.options?.filter?.byMarker;
  });
}
