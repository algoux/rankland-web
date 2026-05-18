<template>
  <div class="rankland-ranklist">
    <div v-if="ranklistState.kind === 'error'" data-id="rankland-ranklist-render-error" class="rankland-ranklist-error">
      <h3>Error occurred when rendering srk</h3>
      <pre>{{ ranklistState.message }}</pre>
    </div>
    <template v-else>
      <header v-if="showHeader" class="rankland-ranklist-header">
        <h1 data-id="rankland-ranklist-title">{{ ranklistTitle }}</h1>
        <p data-id="rankland-ranklist-time" class="rankland-ranklist-time">{{ contestTimeRange }}</p>
      </header>

      <div v-if="showProgress" data-id="rankland-ranklist-progress" class="rankland-ranklist-progress">
        <ProgressBar :data="ranklist" enable-time-travel :live="isLive" @time-travel="handleTimeTravel" />
      </div>

      <div
        v-if="showFilter || hasExtraAction"
        data-id="rankland-ranklist-controls"
        class="rankland-ranklist-controls"
      >
        <div v-if="showFilter" data-id="rankland-ranklist-filters" class="rankland-ranklist-filters">
          <label class="rankland-ranklist-filter">
            <span>筛选</span>
            <select
              v-model="filter.organizations"
              data-id="rankland-ranklist-organization-filter"
              multiple
              class="rankland-ranklist-select"
            >
              <option v-for="organization in ranklistState.organizations" :key="organization" :value="organization">
                {{ organization }}
              </option>
            </select>
          </label>

          <label class="rankland-ranklist-filter rankland-ranklist-checkbox">
            <input
              v-model="filter.officialOnly"
              data-id="rankland-ranklist-official-filter"
              type="checkbox"
            >
            <span>仅正式参赛</span>
          </label>

          <fieldset
            v-if="ranklistState.markers.length > 0"
            data-id="rankland-ranklist-marker-filter"
            class="rankland-ranklist-marker-filter"
          >
            <label>
              <input v-model="filter.marker" type="radio" value="">
              <span>全部</span>
            </label>
            <label v-for="marker in ranklistState.markers" :key="marker.id">
              <input v-model="filter.marker" type="radio" :value="marker.id">
              <span>{{ resolveTextValue(marker.label) }}</span>
            </label>
          </fieldset>
        </div>

        <div v-if="hasExtraAction" data-id="rankland-ranklist-extra-action" class="rankland-ranklist-extra-action">
          <slot name="extra-action" :ranklist="ranklist" />
        </div>
      </div>

      <div v-if="ranklistState.staticRanklist.remarks" class="rankland-ranklist-remarks">
        备注：{{ resolveTextValue(ranklistState.staticRanklist.remarks) }}
      </div>

      <div :class="tableClass">
        <Ranklist :data="ranklistState.staticRanklist" striped-rows />
      </div>

      <footer v-if="showFooter" data-id="rankland-ranklist-footer" class="rankland-ranklist-footer">
        <p>© 2022-present algoUX. All Rights Reserved.</p>
        <p>
          Find us on <a href="https://github.com/algoux" target="_blank" rel="noreferrer">GitHub</a>
        </p>
        <p>
          Powered by
          <a href="https://github.com/algoux/standard-ranklist" target="_blank" rel="noreferrer">
            Standard Ranklist
          </a>
        </p>
        <p>
          欢迎补充榜单数据至
          <a href="https://github.com/algoux/srk-collection" target="_blank" rel="noreferrer">榜单合集</a>
        </p>
      </footer>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type * as srk from '@algoux/standard-ranklist';
import { formatTimeDuration, resolveText } from '@algoux/standard-ranklist-utils';
import { ProgressBar, Ranklist } from '@algoux/standard-ranklist-renderer-component-vue';
import '@algoux/standard-ranklist-renderer-component-styles';
import { createRanklandRanklistState, type RanklandRanklistFilterState } from './rankland-ranklist-state';

function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default defineComponent({
  name: 'RanklandRanklist',
  components: {
    ProgressBar,
    Ranklist,
  },
  props: {
    ranklist: {
      type: Object as PropType<srk.Ranklist>,
      required: true,
    },
    name: {
      type: String,
      default: '',
    },
    id: {
      type: String,
      default: '',
    },
    showHeader: {
      type: Boolean,
      default: false,
    },
    showFilter: {
      type: Boolean,
      default: false,
    },
    showProgress: {
      type: Boolean,
      default: false,
    },
    showFooter: {
      type: Boolean,
      default: false,
    },
    isLive: {
      type: Boolean,
      default: false,
    },
    tableClass: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      filter: {
        organizations: [],
        officialOnly: false,
        marker: '',
      } as RanklandRanklistFilterState,
      timeTravelTime: null as number | null,
    };
  },
  computed: {
    ranklistState() {
      return createRanklandRanklistState(this.ranklist, {
        filter: this.filter,
        timeTravelTime: this.timeTravelTime,
      });
    },
    ranklistTitle(): string {
      return resolveText(this.ranklist.contest?.title);
    },
    contestTimeRange(): string {
      const startAt = new Date(this.ranklist.contest.startAt).getTime();
      const endAt = startAt + formatTimeDuration(this.ranklist.contest.duration, 'ms');
      return `${formatDateTime(startAt)} ~ ${formatDateTime(endAt)}`;
    },
    hasExtraAction(): boolean {
      return !!this.$slots['extra-action'];
    },
  },
  watch: {
    id() {
      this.resetControls();
    },
  },
  methods: {
    handleTimeTravel(time: number | null) {
      this.timeTravelTime = time;
    },
    resetControls() {
      this.filter = {
        organizations: [],
        officialOnly: false,
        marker: '',
      };
      this.timeTravelTime = null;
    },
    resolveTextValue(value: srk.Text | undefined): string {
      return resolveText(value);
    },
  },
});
</script>

<style lang="less" scoped>
.rankland-ranklist {
  width: 100%;
  overflow-x: auto;
}

.rankland-ranklist-header {
  margin-bottom: 12px;
  text-align: center;
}

.rankland-ranklist-header h1 {
  margin: 0 0 4px;
  font-size: 28px;
}

.rankland-ranklist-time {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}

.rankland-ranklist-progress {
  margin: 12px 16px;
}

.rankland-ranklist-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 16px;
}

.rankland-ranklist-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.rankland-ranklist-filter,
.rankland-ranklist-checkbox,
.rankland-ranklist-marker-filter,
.rankland-ranklist-extra-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.rankland-ranklist-select {
  width: 160px;
  min-height: 32px;
}

.rankland-ranklist-marker-filter {
  margin: 0;
  padding: 0;
  border: 0;
}

.rankland-ranklist-marker-filter label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.rankland-ranklist-remarks {
  margin: 16px;
  text-align: center;
}

.rankland-ranklist-footer {
  margin-top: 32px;
  text-align: center;
}

.rankland-ranklist-footer p {
  margin: 4px 0;
}

.rankland-ranklist-error {
  padding: 16px;
  border: 1px solid #fecaca;
  border-radius: 4px;
  color: #991b1b;
  background: #fef2f2;

  pre {
    margin: 8px 0 0;
    white-space: pre-wrap;
  }
}

@media (max-width: 767px) {
  .rankland-ranklist-controls {
    align-items: stretch;
    flex-direction: column;
  }

  .rankland-ranklist-filters {
    align-items: stretch;
    flex-direction: column;
  }

  .rankland-ranklist-select {
    width: 100%;
  }
}
</style>
