<template>
  <div class="ranklist-card-list">
    <header class="ranklist-card-legend" :style="{ gridTemplateColumns: `repeat(${problems.length}, minmax(0, 1fr))` }">
      <div v-for="(problem, index) in problems" :key="index" class="ranklist-card-legend-cell"
           :style="{ '--problem-color': problem.color || 'transparent' }"
           @click="emitProblemClick(problem, index)">
        {{ problem.alias }}<br>{{ problem.accepted ?? '' }}
      </div>
    </header>
    <div v-for="(row, rowIndex) in data.rows" :key="rowIndex" class="ranklist-card">
      <div class="ranklist-card-head" @click="emitUserClick(row, rowIndex)">
        <div class="ranklist-card-ranks" :style="{ '--segment-color': getSegmentColor(row) }">
          <div v-for="(rv, si) in row.rankValues" :key="si">
            <b>{{ seriesTitles[si] }}</b> {{ rv.rank ?? '*' }}
          </div>
        </div>
        <div class="ranklist-card-identity">
          <div class="ranklist-card-name">
            <span>{{ resolveText(row.user.name) }}</span>
            <span v-if="row.user.official === false" class="ranklist-card-unofficial">*</span>
          </div>
          <div class="ranklist-card-org">{{ resolveText(row.user.organization) || '' }}</div>
          <div class="ranklist-card-score">
            <b>Score: {{ row.score?.value ?? 0 }}</b> Time: {{ formatTime(row.score?.time) }}
          </div>
        </div>
      </div>
      <div class="ranklist-card-cells" :style="{ gridTemplateColumns: `repeat(${problems.length}, minmax(0, 1fr))` }">
        <div v-for="(status, pi) in row.statuses" :key="pi"
             :class="['ranklist-card-cell', getCellClass(status)]"
             :style="{ '--problem-color': problems[pi]?.color || 'transparent' }"
             @click="emitSolutionClick(row, rowIndex, pi, status)">
          {{ getCellText(status) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { StaticRanklist, StaticRanklistRow } from '@algoux/standard-ranklist-renderer-component-vue';
import {
  getRankProblemStatusCellClassName,
  getRankProblemStatusTries,
  formatRanklistStatusTime,
} from '@algoux/standard-ranklist-renderer-component-core';
import { resolveText as resolveTextUtil } from '@algoux/standard-ranklist-utils';
import type { EnumTheme } from '@algoux/standard-ranklist-utils';
import type { TimeDuration } from '@algoux/standard-ranklist';

const props = defineProps<{
  data: StaticRanklist;
  themeName?: EnumTheme;
  languages?: readonly string[];
}>();

const emit = defineEmits<{
  (event: 'userClick', payload: { user: any; row: StaticRanklistRow; rowIndex: number; ranklist: StaticRanklist }): void;
  (event: 'solutionClick', payload: { user: any; row: StaticRanklistRow; rowIndex: number; problemIndex: number; problem: any; status: any; solutions: any[]; ranklist: StaticRanklist }): void;
  (event: 'problemClick', payload: { problem: any; problemIndex: number; ranklist: StaticRanklist }): void;
}>();

const SEGMENT_COLORS: Record<string, string> = {
  gold: '#f8bf29',
  silver: '#adadad',
  bronze: '#d69872',
  iron: '#a94442',
};

const problems = computed(() => props.data.problems.map((p) => ({
  alias: p.alias,
  color: p.style?.backgroundColor || null,
  accepted: p.statistics?.accepted ?? null,
})));

const seriesTitles = computed(() =>
  props.data.series.map((s) => resolveTextUtil(s.title, props.languages) || String(s.title)),
);

function resolveText(text: any): string {
  return resolveTextUtil(text, props.languages);
}

function formatTime(time: TimeDuration | undefined): string {
  return formatRanklistStatusTime(time, props.data);
}

function getSegmentColor(row: StaticRanklistRow): string {
  const rv = row.rankValues?.[0];
  if (!rv?.segmentIndex && rv?.segmentIndex !== 0) return 'transparent';
  const segment = props.data.series[0]?.segments?.[rv.segmentIndex];
  return segment?.style ? SEGMENT_COLORS[segment.style] || 'transparent' : 'transparent';
}

function getCellClass(status: any): string {
  return getRankProblemStatusCellClassName(status, props.data) || '';
}

function getCellText(status: any): string {
  if (!status.result) return '';
  return String(getRankProblemStatusTries(status));
}

function emitUserClick(row: StaticRanklistRow, rowIndex: number) {
  emit('userClick', { user: row.user, row, rowIndex, ranklist: props.data });
}

function emitSolutionClick(row: StaticRanklistRow, rowIndex: number, problemIndex: number, status: any) {
  if (!status.result) return;
  emit('solutionClick', {
    user: row.user,
    row,
    rowIndex,
    problemIndex,
    problem: props.data.problems[problemIndex],
    status,
    solutions: status.solutions || [],
    ranklist: props.data,
  });
}

function emitProblemClick(problem: any, problemIndex: number) {
  emit('problemClick', { problem, problemIndex, ranklist: props.data });
}
</script>

<style>
@import './ranklist-card-list.less';
</style>
