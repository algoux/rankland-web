<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { formatTimeDuration, secToTimeStr } from '@algoux/standard-ranklist-utils';
import { THEME_TOKEN } from '@/lib/theme';
import type { RankTimePoint, RankTimeSeriesSegment, RankTimeSolvedEventPoint } from '@/utils/rank-time-data.util';

const props = defineProps<{
  unit: string;
  points: RankTimePoint[];
  solvedEventPoints: RankTimeSolvedEventPoint[];
  seriesSegments: RankTimeSeriesSegment[];
  totalUsers: number;
}>();

const theme = inject(THEME_TOKEN, undefined);
const container = ref<HTMLDivElement | null>(null);
let chart: import('@antv/g2').Chart | null = null;

const primaryColor = '#5b8ff9';
const solvedColor = '#64de7c';
const acColor = '#99ff99';
const fbColor = '#009900';
const animationDuration = 2000;

function updateChartDueToThemeChange() {
  if (!chart || !theme) {
    return;
  }
  chart.theme({ type: theme.state.theme === 'dark' ? 'classicDark' : 'classic' });
  chart.interaction('tooltip', {
    ...getTooltipInteractionOptions(),
    crosshairsStroke: theme.state.theme === 'dark' ? '#dadada' : '#373737',
    crosshairsLineWidth: 1,
  });
  chart.render();
}

async function renderChart() {
  if (!container.value || props.points.length === 0) {
    return;
  }
  const { Chart } = await import('@antv/g2');
  const maxTime = props.points[props.points.length - 1].time;
  const maxRank = Math.min(Math.max(50, Math.max(...props.points.map((item) => item.rank)) + 10), props.totalUsers);
  const yTicks = [1];
  for (let i = 50; i <= maxRank; i += 50) {
    yTicks.push(i);
  }

  chart = new Chart({
    container: container.value,
    theme: theme?.state.theme === 'dark' ? 'classicDark' : 'classic',
    autoFit: true,
    paddingTop: 48,
    paddingRight: 48,
    paddingLeft: 'auto',
    paddingBottom: 'auto',
  });

  chart
    .line()
    .data(props.points)
    .encode('x', 'time')
    .encode('y', 'rank')
    .scale('y', { type: 'linear', domain: [1, maxRank], tickMethod: () => yTicks, range: [0, 1] })
    .axis('x', {
      title: `时间（${props.unit}）`,
    })
    .axis('y', {
      title: '主排名',
    })
    .tooltip({
      title: (d: RankTimePoint) => `${secToTimeStr(formatTimeDuration([d.time, props.unit as any], 's'))}`,
      items: [
        (_d: RankTimePoint, index: number, _data: unknown, column: any) => ({
          name: '主排名',
          value: column.y.value[index],
        }),
        (d: RankTimePoint) => ({
          name: '解题数',
          color: solvedColor,
          value: d.solved,
        }),
      ],
    })
    .animate('enter', { type: 'pathIn', duration: animationDuration });

  for (const segment of props.seriesSegments) {
    chart
      .area()
      .data(segment.points)
      .transform({ type: 'groupX', y: 'mean', y1: 'mean' })
      .encode('x', 'time')
      .encode('y', ['start', 'end'])
      .axis('y', {
        labelFilter: (value: number) => value > 0,
      })
      .scale('y', { nice: true })
      .style('fill', segment.resolvedColor)
      .style('fillOpacity', 0.3)
      .tooltip({
        title: '',
        items: [
          (_d: RankTimeSeriesSegment, index: number, _data: unknown, column: any) => ({
            name: segment.title,
            value: `${column.y.value[index]}-${column.y1.value[index]}`,
          }),
        ],
      });
  }

  for (const point of props.solvedEventPoints) {
    const startAt = (maxTime ? (point.time / maxTime) * animationDuration : animationDuration) + 200;
    chart
      .text()
      .data([point])
      .encode('x', 'time')
      .encode('y', 'rank')
      .encode('shape', 'badge')
      .style({
        text: `${point.rank}`,
        dy: -1,
        fill: '#fff',
        markerSize: 24,
        markerFill: point.fb ? fbColor : primaryColor,
        markerFillOpacity: 0.65,
      })
      .tooltip({
        title: '',
        items: [
          () => ({
            name: point.fb ? 'FB' : 'AC',
            color: point.fb ? fbColor : acColor,
            value: `${point.problemAlias} (${secToTimeStr(formatTimeDuration(point.solvedTime, 's'))})`,
          }),
        ],
      })
      .animate('enter', { type: 'zoomIn', duration: 200, delay: startAt });
  }

  chart.interaction('tooltip', {
    ...getTooltipInteractionOptions(),
    crosshairsStroke: theme?.state.theme === 'dark' ? '#dadada' : '#373737',
    crosshairsLineWidth: 1,
  });

  chart.render();
}

onMounted(() => {
  renderChart();
});

onBeforeUnmount(() => {
  chart?.destroy();
  chart = null;
});

watch(() => theme?.state.theme, updateChartDueToThemeChange);

function getTooltipInteractionOptions() {
  return {
    marker: false,
    bounding: container.value
      ? {
          x: 0,
          y: 0,
          width: container.value.clientWidth,
          height: container.value.clientHeight,
        }
      : undefined,
  };
}
</script>

<template>
  <div class="rank-curve">
    <div ref="container" class="rank-curve-chart" />
  </div>
</template>

<style scoped>
.rank-curve {
  background: #fafafa;
  overflow: visible;
}

.rank-curve-chart {
  height: 400px;
  min-height: 400px;
  overflow: visible;
}

html.dark .rank-curve {
  background: #101010;
}
</style>
