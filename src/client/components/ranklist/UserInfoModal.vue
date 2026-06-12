<script setup lang="ts">
import { computed, inject } from 'vue';
import type * as srk from '@algoux/standard-ranklist';
import { EnumTheme, resolveStyle, resolveText, resolveUserMarkers } from '@algoux/standard-ranklist-utils';
import type { StaticRanklistRow } from '@algoux/standard-ranklist-renderer-component-vue';
import { THEME_TOKEN } from '@/lib/theme';
import { findUserMatchedMainICPCSeries } from '@/utils/ranklist.util';
import type { RankTimeData } from '@/utils/rank-time-data.util';
import SrkAssetImage from './SrkAssetImage.vue';
import RankCurve from './RankCurve.vue';
import './user-info-modal.less';

const props = defineProps<{
  user: srk.User;
  row: StaticRanklistRow;
  index: number;
  ranklist: srk.Ranklist;
  assetsScope: string;
  filterMarker?: string;
  rankTimeData: RankTimeData;
}>();

const theme = inject(THEME_TOKEN, undefined);
const themeName = computed(() => theme?.state.theme || EnumTheme.light);
const userMarkers = computed(() => resolveUserMarkers(props.user, props.ranklist.markers));
const matchedMainSeries = computed(() =>
  findUserMatchedMainICPCSeries(props.ranklist.series, userMarkers.value, props.filterMarker),
);
const matchedMainSeriesIndex = computed(() =>
  props.ranklist.series.findIndex((series) => series === matchedMainSeries.value),
);
const matchedSeriesSegment = computed(() => {
  const rankValue = props.row.rankValues[matchedMainSeriesIndex.value] as any;
  return matchedMainSeries.value?.segments?.[rankValue?.segmentIndex];
});
const hasMembers = computed(() => !!props.user.teamMembers && props.user.teamMembers.length > 0);
const photo = computed(() => (props.user as any).photo as string | undefined);
const slogan = computed(() => (props.user as any).x_slogan as string | undefined);

function markerClass(marker: srk.Marker) {
  if (typeof marker.style === 'string') {
    return `srk-preset-marker-${marker.style}`;
  }
  return '';
}

function markerStyle(marker: srk.Marker) {
  if (typeof marker.style === 'string') {
    return undefined;
  }
  const style = resolveStyle(marker.style);
  return {
    color: style.textColor[themeName.value],
    backgroundColor: style.backgroundColor[themeName.value],
  };
}

function formatTeamMemberName(member: srk.ExternalUser) {
  const name = resolveText(member.name);
  return member.role ? `${name} (${member.role})` : name;
}
</script>

<template>
  <div class="user-modal">
    <p class="mb-0">{{ resolveText(user.organization) }}</p>
    <p v-if="user.official === false" class="mt-4 mb-0">＊ 非正式参加者</p>
    <div v-if="hasMembers" class="user-modal-info-team-members mt-2">
      <template v-for="(member, memberIndex) in user.teamMembers" :key="resolveText(member.name)">
        <span v-if="memberIndex > 0" class="user-modal-info-team-members-slash"> / </span>
        <span>{{ formatTeamMemberName(member) }}</span>
      </template>
    </div>
    <div v-if="userMarkers.length > 0" class="user-modal-info-markers mt-2">
      <span
        v-for="marker in userMarkers"
        :key="marker.id"
        class="user-modal-info-marker"
        :class="markerClass(marker)"
        :style="markerStyle(marker)"
      >
        {{ resolveText(marker.label) }}
      </span>
    </div>
    <p v-if="matchedSeriesSegment && matchedMainSeries" class="mt-4 mb-0">
      所在奖区（{{ matchedMainSeries.title }}）：
      <span class="user-modal-segment-label" :class="`bg-segment-${matchedSeriesSegment.style}`">
        {{ matchedSeriesSegment.title }}
      </span>
    </p>
    <div class="mt-4">
      <SrkAssetImage
        v-if="photo"
        :image="photo"
        :asset-scope="assetsScope"
        alt="选手照片"
        style="width: 100%"
      />
      <p v-if="slogan" class="slogan mt-4 mb-2">{{ slogan }}</p>
    </div>
    <div v-if="user.official && rankTimeData.initialized" class="mt-4">
      <RankCurve
        :key="rankTimeData.key"
        :unit="rankTimeData.unit"
        :points="rankTimeData.points"
        :solved-event-points="rankTimeData.solvedEventPoints"
        :series-segments="rankTimeData.seriesSegments"
        :total-users="rankTimeData.totalUsers"
      />
    </div>
  </div>
</template>
