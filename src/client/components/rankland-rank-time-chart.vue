<template>
  <div
    data-id="rankland-rank-time-curve"
    :style="{ height: `${chartModel.containerHeight}px` }"
  >
    <div
      ref="chartContainer"
      data-id="rankland-rank-time-g2-chart"
      data-chart-library="@antv/g2"
      :data-line-animation="`${chartModel.lineAnimation.type}:${chartModel.lineAnimation.duration}`"
      :data-event-animation="`zoomIn:${firstEventAnimationDuration}`"
      :data-tooltip-items="lineTooltipItems"
      :data-event-tooltip="firstEventTooltip"
    />
    <span v-if="chartStatus === 'error'" data-id="rankland-rank-time-chart-error" class="rankland-rank-time-chart-error">
      排名时间图表加载失败
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import {
  createRankTimeChartModel,
  type RankTimeChartModel,
  type SelectedUserMainRankTimeData,
} from './rankland-rank-time';

type RankTimeChartStatus = 'idle' | 'loading' | 'rendered' | 'error';
type RankTimeTheme = 'light' | 'dark';

export default defineComponent({
  name: 'RanklandRankTimeChart',
  props: {
    rankTimeData: {
      type: Object as PropType<SelectedUserMainRankTimeData>,
      required: true,
    },
  },
  data() {
    return {
      chart: null as any,
      chartStatus: 'idle' as RankTimeChartStatus,
      renderRunId: 0,
      theme: 'light' as RankTimeTheme,
      themeObserver: undefined as MutationObserver | undefined,
    };
  },
  computed: {
    chartModel(): RankTimeChartModel {
      return createRankTimeChartModel(this.rankTimeData);
    },
    firstEventAnimationDuration(): number {
      return this.chartModel.eventBadges[0]?.animation.duration || 0;
    },
    firstEventTooltip(): string {
      const firstEvent = this.chartModel.eventBadges[0];
      return firstEvent ? `${firstEvent.tooltip.name}:${firstEvent.tooltip.value}` : '';
    },
    lineTooltipItems(): string {
      const firstPoint = this.rankTimeData.points[0];
      return firstPoint ? this.chartModel.getLineTooltipItems(firstPoint, 0).map((item) => item.name).join(',') : '';
    },
  },
  watch: {
    rankTimeData: {
      deep: true,
      handler() {
        this.renderChart();
      },
    },
    theme() {
      this.updateChartTheme();
    },
  },
  mounted() {
    this.theme = this.readDocumentTheme();
    this.themeObserver = new MutationObserver(() => {
      this.theme = this.readDocumentTheme();
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    this.renderChart();
  },
  beforeUnmount() {
    this.themeObserver?.disconnect();
    this.destroyChart();
  },
  methods: {
    readDocumentTheme(): RankTimeTheme {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    },
    destroyChart() {
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
    },
    getTooltipCrosshairsStroke(): string {
      return this.theme === 'dark'
        ? this.chartModel.tooltipInteraction.darkCrosshairsStroke
        : this.chartModel.tooltipInteraction.lightCrosshairsStroke;
    },
    updateChartTheme() {
      if (!this.chart) {
        return;
      }
      this.chart.theme({ type: this.theme === 'dark' ? 'classicDark' : 'classic' });
      this.chart.interaction('tooltip', {
        crosshairsStroke: this.getTooltipCrosshairsStroke(),
        crosshairsLineWidth: this.chartModel.tooltipInteraction.crosshairsLineWidth,
      });
      this.chart.render();
    },
    async renderChart() {
      const runId = this.renderRunId + 1;
      this.renderRunId = runId;
      const container = this.$refs.chartContainer as HTMLElement | undefined;
      if (!container) {
        return;
      }

      this.destroyChart();
      container.innerHTML = '';
      this.chartStatus = 'loading';

      try {
        const { Chart } = await import('@antv/g2');
        if (runId !== this.renderRunId) {
          return;
        }

        const chart = new Chart({
          autoFit: true,
          container,
          paddingBottom: 'auto',
          paddingLeft: 'auto',
          theme: this.theme === 'dark' ? 'classicDark' : 'classic',
        });
        const model = this.chartModel;

        chart
          .line()
          .data(this.rankTimeData.points)
          .encode('x', 'time')
          .encode('y', 'rank')
          .scale('y', { type: 'linear', domain: [1, model.maxRank], tickMethod: () => model.yTicks, range: [0, 1] })
          .axis('x', {
            title: model.axis.xTitle,
          })
          .axis('y', {
            title: model.axis.yTitle,
          })
          .tooltip({
            title: (point: any) => model.getLineTooltipTitle(point),
            items: [
              (point: any) => ({
                name: '主排名',
                value: point.rank,
              }),
              (point: any) => ({
                name: '解题数',
                color: model.colors.solved,
                value: point.solved,
              }),
            ],
          })
          .animate('enter', model.lineAnimation);

        for (const segment of this.rankTimeData.seriesSegments) {
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
                (point: any) => ({
                  name: segment.title,
                  value: `${point.start}-${point.end}`,
                }),
              ],
            });
        }

        for (const badge of model.eventBadges) {
          chart
            .text()
            .data([badge])
            .encode('x', 'time')
            .encode('y', 'rank')
            .encode('shape', 'badge')
            .style({
              text: `${badge.rank}`,
              dy: -1,
              fill: badge.textFill,
              markerSize: badge.markerSize,
              markerFill: badge.fill,
              markerFillOpacity: badge.markerFillOpacity,
            })
            .tooltip({
              title: '',
              items: [
                () => ({
                  name: badge.tooltip.name,
                  color: badge.tooltip.color,
                  value: badge.tooltip.value,
                }),
              ],
            })
            .animate('enter', badge.animation);
        }

        chart.interaction('tooltip', {
          crosshairsStroke: this.getTooltipCrosshairsStroke(),
          crosshairsLineWidth: model.tooltipInteraction.crosshairsLineWidth,
        });

        this.chart = chart;
        await Promise.resolve(chart.render());
        if (runId === this.renderRunId) {
          this.chartStatus = 'rendered';
        }
      } catch (error) {
        if (runId === this.renderRunId) {
          this.chartStatus = 'error';
        }
      }
    },
  },
});
</script>

<style lang="less" scoped>
[data-id='rankland-rank-time-curve'] {
  position: relative;
  width: 100%;
}

[data-id='rankland-rank-time-g2-chart'] {
  width: 100%;
  height: 100%;
}

.rankland-rank-time-chart-error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #fecaca;
  color: #991b1b;
  background: #fef2f2;
  font-size: 13px;
}
</style>
