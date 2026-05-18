<template>
  <div class="rankland-ranklist">
    <div v-if="ranklistState.kind === 'error'" data-id="rankland-ranklist-render-error" class="rankland-ranklist-error">
      <h3>Error occurred when rendering srk</h3>
      <pre>{{ ranklistState.message }}</pre>
    </div>
    <template v-else>
      <header v-if="showHeader" class="rankland-ranklist-header">
        <h1 data-id="rankland-ranklist-title">{{ ranklistTitle }}</h1>
        <div data-id="rankland-ranklist-header-actions" class="rankland-ranklist-header-actions">
          <details data-id="rankland-ranklist-export-menu" class="rankland-ranklist-action-menu">
            <summary data-id="rankland-ranklist-export-menu-button">导出</summary>
            <div class="rankland-ranklist-action-list">
              <button data-id="rankland-ranklist-export-srk-action" type="button" @click="downloadSrkJson">
                标准榜单格式 (srk)
              </button>
              <button data-id="rankland-ranklist-export-gym-ghost-action" type="button" disabled>
                Codeforces Gym Ghost (dat)
              </button>
              <button data-id="rankland-ranklist-export-vjudge-action" type="button" disabled>
                Virtual Judge Replay (xlsx)
              </button>
              <button data-id="rankland-ranklist-export-xlsx-action" type="button" disabled>
                Excel 表格 (xlsx)
              </button>
            </div>
          </details>

          <details data-id="rankland-ranklist-share-menu" class="rankland-ranklist-action-menu">
            <summary data-id="rankland-ranklist-share-menu-button">分享</summary>
            <div class="rankland-ranklist-action-list">
              <button data-id="rankland-ranklist-copy-link-action" type="button" @click="copyCurrentPageLink">
                复制本页链接
              </button>
              <button
                v-if="id"
                data-id="rankland-ranklist-copy-embed-action"
                type="button"
                @click="copyEmbedCode"
              >
                复制嵌入代码
              </button>
            </div>
          </details>

          <span v-if="actionStatus" data-id="rankland-ranklist-action-status" class="rankland-ranklist-action-status">
            {{ actionStatus }}
          </span>
        </div>
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
        <Ranklist
          :data="ranklistState.staticRanklist"
          striped-rows
          @user-click="handleUserClick"
          @solution-click="handleSolutionClick"
        />
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

      <div data-id="rankland-ranklist-user-modal">
        <DefaultUserModal
          :open="!!activeUserPayload"
          :user="activeUserPayload?.user"
          :markers="ranklistState.staticRanklist.markers || []"
          @close="handleUserModalClose"
        />
      </div>

      <div data-id="rankland-ranklist-solution-modal">
        <DefaultSolutionModal
          :open="!!activeSolutionPayload"
          :user="activeSolutionPayload?.user"
          :problem="activeSolutionPayload?.problem"
          :problem-index="activeSolutionPayload?.problemIndex || 0"
          :solutions="activeSolutionPayload?.solutions || []"
          @close="handleSolutionModalClose"
        />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type * as srk from '@algoux/standard-ranklist';
import { formatTimeDuration, resolveText } from '@algoux/standard-ranklist-utils';
import {
  DefaultSolutionModal,
  DefaultUserModal,
  ProgressBar,
  Ranklist,
  type SolutionClickPayload,
  type UserClickPayload,
} from '@algoux/standard-ranklist-renderer-component-vue';
import '@algoux/standard-ranklist-renderer-component-styles';
import { createRanklandRanklistState, type RanklandRanklistFilterState } from './rankland-ranklist-state';
import {
  buildRanklandEmbedCode,
  createSrkExportFile,
  normalizeRanklandShareUrl,
  type RanklandEmbedKind,
} from './rankland-ranklist-actions';

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
    DefaultSolutionModal,
    DefaultUserModal,
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
      activeUserPayload: null as UserClickPayload | null,
      activeSolutionPayload: null as SolutionClickPayload | null,
      actionStatus: '',
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
    actionName(): string {
      return this.name || this.id || 'ranklist';
    },
    embedKind(): RanklandEmbedKind {
      return this.isLive ? 'live' : 'ranklist';
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
      this.activeUserPayload = null;
      this.activeSolutionPayload = null;
      this.actionStatus = '';
    },
    resolveTextValue(value: srk.Text | undefined): string {
      return resolveText(value);
    },
    handleUserClick(payload: UserClickPayload) {
      this.activeUserPayload = payload;
      this.activeSolutionPayload = null;
    },
    handleSolutionClick(payload: SolutionClickPayload) {
      this.activeSolutionPayload = payload;
      this.activeUserPayload = null;
    },
    handleUserModalClose() {
      this.activeUserPayload = null;
    },
    handleSolutionModalClose() {
      this.activeSolutionPayload = null;
    },
    downloadSrkJson() {
      const file = createSrkExportFile(this.ranklist, this.actionName);
      const blob = new Blob([file.content], { type: file.type });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.filename;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      this.actionStatus = 'SRK 已导出';
    },
    async copyCurrentPageLink() {
      await this.copyText(normalizeRanklandShareUrl(window.location.href), '链接已复制');
    },
    async copyEmbedCode() {
      await this.copyText(
        buildRanklandEmbedCode({
          origin: window.location.origin,
          kind: this.embedKind,
          id: this.id,
        }),
        '嵌入代码已复制',
      );
    },
    async copyText(text: string, successMessage: string) {
      try {
        await this.writeClipboardText(text);
        this.actionStatus = successMessage;
      } catch (error) {
        this.actionStatus = '复制失败';
      }
    },
    async writeClipboardText(text: string) {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
      }

      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const copied = document.execCommand('copy');
      textarea.remove();
      if (!copied) {
        throw new Error('Clipboard copy failed.');
      }
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

.rankland-ranklist-header-actions {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: center;
  gap: 8px;
  margin: 4px 0 8px;
  font-size: 13px;
}

.rankland-ranklist-action-menu {
  position: relative;
  text-align: left;
}

.rankland-ranklist-action-menu summary {
  min-width: 44px;
  padding: 4px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  color: #1f2937;
  background: #fff;
  cursor: pointer;
  list-style: none;
  text-align: center;
}

.rankland-ranklist-action-menu summary::-webkit-details-marker {
  display: none;
}

.rankland-ranklist-action-list {
  position: absolute;
  z-index: 20;
  top: calc(100% + 4px);
  left: 50%;
  display: flex;
  width: max-content;
  min-width: 190px;
  max-width: min(280px, calc(100vw - 32px));
  padding: 4px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 8px 24px rgb(15 23 42 / 12%);
  flex-direction: column;
  transform: translateX(-50%);
}

.rankland-ranklist-action-list button {
  padding: 7px 10px;
  border: 0;
  border-radius: 3px;
  color: #1f2937;
  background: transparent;
  cursor: pointer;
  font: inherit;
  text-align: left;
  white-space: nowrap;
}

.rankland-ranklist-action-list button:hover:not(:disabled) {
  background: #f1f5f9;
}

.rankland-ranklist-action-list button:disabled {
  color: #94a3b8;
  cursor: not-allowed;
}

.rankland-ranklist-action-status {
  align-self: center;
  color: #237804;
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
