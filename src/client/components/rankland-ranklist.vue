<template>
  <div class="rankland-ranklist">
    <div v-if="ranklistState.kind === 'error'" data-id="rankland-ranklist-render-error" class="rankland-ranklist-error">
      <h3>Error occurred when rendering srk</h3>
      <pre>{{ ranklistState.message }}</pre>
    </div>
    <template v-else>
      <header v-if="showHeader" class="rankland-ranklist-header">
        <div v-if="contestBannerSrc" class="rankland-ranklist-banner-wrap">
          <img
            data-id="rankland-ranklist-banner"
            :src="contestBannerSrc"
            alt="Contest Banner"
            class="rankland-ranklist-banner"
          >
        </div>
        <h1 data-id="rankland-ranklist-title">{{ ranklistTitle }}</h1>
        <div data-id="rankland-ranklist-header-actions" class="rankland-ranklist-header-actions">
          <details data-id="rankland-ranklist-export-menu" class="rankland-ranklist-action-menu">
            <summary data-id="rankland-ranklist-export-menu-button">导出</summary>
            <div class="rankland-ranklist-action-list">
              <button data-id="rankland-ranklist-export-srk-action" type="button" @click="downloadSrkJson">
                标准榜单格式 (srk)
              </button>
              <button data-id="rankland-ranklist-export-gym-ghost-action" type="button" @click="downloadGymGhostDat">
                Codeforces Gym Ghost (dat)
              </button>
              <button data-id="rankland-ranklist-export-vjudge-action" type="button" @click="downloadVJudgeReplay">
                Virtual Judge Replay (xlsx)
              </button>
              <button data-id="rankland-ranklist-export-xlsx-action" type="button" @click="downloadGeneralExcel">
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
          :format-srk-asset-url="formatRanklistAssetUrl"
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
        <Modal
          :open="!!activeUserPayload"
          :title="activeUserTitle"
          :width="960"
          root-class-name="srk-general-modal-root"
          wrap-class-name="rankland-user-modal"
          @close="handleUserModalClose"
        >
          <div v-if="activeUserPayload" class="rankland-user-modal-body">
            <h3 data-id="rankland-user-modal-name" class="rankland-user-modal-name">{{ activeUserTitle }}</h3>
            <p v-if="activeUserOrganization" data-id="rankland-user-modal-organization" class="rankland-user-modal-line">
              {{ activeUserOrganization }}
            </p>
            <p v-if="activeUserPayload.user.official === false" class="rankland-user-modal-line">
              ＊ 非正式参加者
            </p>
            <div v-if="activeUserTeamMembers.length > 0" class="rankland-user-modal-team-members">
              <template v-for="(member, memberIndex) in activeUserTeamMembers" :key="memberIndex">
                <span v-if="memberIndex > 0" class="rankland-user-modal-team-separator"> / </span>
                <span>{{ resolveTextValue(member.name) }}</span>
              </template>
            </div>
            <div v-if="activeUserMarkers.length > 0" class="rankland-user-modal-markers">
              <span
                v-for="marker in activeUserMarkers"
                :key="marker.id"
                class="rankland-user-modal-marker"
              >
                {{ resolveTextValue(marker.label) }}
              </span>
            </div>
            <div v-if="activeUserPhotoSrc" class="rankland-user-modal-photo">
              <img data-id="rankland-user-modal-photo" :src="activeUserPhotoSrc" alt="选手照片">
            </div>
            <p v-if="activeUserSlogan" class="rankland-user-modal-slogan">{{ activeUserSlogan }}</p>

            <div
              v-if="activeUserRankTimeData"
              data-id="rankland-rank-time-panel"
              class="rankland-rank-time-panel"
            >
              <div class="rankland-rank-time-header">
                <h4>排名时间</h4>
                <span data-id="rankland-rank-time-unit">单位：{{ activeUserRankTimeData.unit }}</span>
              </div>
              <svg
                data-id="rankland-rank-time-curve"
                class="rankland-rank-time-curve"
                viewBox="0 0 320 150"
                role="img"
                aria-label="排名时间曲线"
              >
                <polyline
                  :points="rankTimeCurvePoints"
                  fill="none"
                  stroke="#2563eb"
                  stroke-width="3"
                  stroke-linejoin="round"
                  stroke-linecap="round"
                />
                <circle
                  v-for="eventPoint in rankTimeEventMarkers"
                  :key="`${eventPoint.problemAlias}-${eventPoint.time}`"
                  :cx="eventPoint.cx"
                  :cy="eventPoint.cy"
                  r="5"
                  :fill="eventPoint.fb ? '#15803d' : '#2563eb'"
                />
              </svg>
              <p data-id="rankland-rank-time-summary" class="rankland-rank-time-summary">
                当前主排名：{{ activeUserRankTimeLatestPoint?.rank }}，解题数：{{ activeUserRankTimeLatestPoint?.solved }}
              </p>
              <div class="rankland-rank-time-events">
                <span
                  v-for="eventPoint in activeUserRankTimeData.solvedEventPoints"
                  :key="`${eventPoint.problemAlias}-${eventPoint.time}`"
                  data-id="rankland-rank-time-event"
                  class="rankland-rank-time-event"
                >
                  {{ eventPoint.problemAlias }} · {{ eventPoint.fb ? 'FB' : 'AC' }} ·
                  {{ formatSolvedTime(eventPoint.solvedTime) }}
                </span>
              </div>
            </div>
          </div>
        </Modal>
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
import {
  formatTimeDuration,
  getSortedCalculatedRawSolutions,
  resolveText,
  resolveUserMarkers,
  secToTimeStr,
} from '@algoux/standard-ranklist-utils';
import {
  DefaultSolutionModal,
  Modal,
  ProgressBar,
  Ranklist,
  type SolutionClickPayload,
  type UserClickPayload,
} from '@algoux/standard-ranklist-renderer-component-vue';
import '@algoux/standard-ranklist-renderer-component-styles';
import { createRanklandRanklistState, type RanklandRanklistFilterState } from './rankland-ranklist-state';
import {
  buildRanklandEmbedCode,
  createGymGhostExportFile,
  createSrkExportFile,
  normalizeRanklandShareUrl,
  type RanklandEmbedKind,
  writeGeneralExcelFile,
  writeVJudgeReplayFile,
} from './rankland-ranklist-actions';
import {
  getAllRankTimeData,
  getProperRankTimeChunkUnit,
  selectUserMainRankTimeData,
  type RankTimeDataSet,
  type RankTimePoint,
  type RankTimeSolvedEventPoint,
  type SelectedUserMainRankTimeData,
} from './rankland-rank-time';
import { formatSrkAssetUrl } from '@client/utils/srk-asset.util';

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
    Modal,
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
      rankTimeDataSet: null as RankTimeDataSet | null,
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
    contestBannerSrc(): string {
      return this.resolveSrkImageUrl(this.ranklist.contest?.banner);
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
    baseRanklistState() {
      return createRanklandRanklistState(this.ranklist, {
        timeTravelTime: this.timeTravelTime,
      });
    },
    activeUserTitle(): string {
      return this.activeUserPayload ? resolveText(this.activeUserPayload.user.name) : 'User Info';
    },
    activeUserOrganization(): string {
      return this.activeUserPayload ? resolveText(this.activeUserPayload.user.organization) : '';
    },
    activeUserTeamMembers(): srk.ExternalUser[] {
      return this.activeUserPayload?.user.teamMembers || [];
    },
    activeUserMarkers(): srk.Marker[] {
      if (!this.activeUserPayload || this.baseRanklistState.kind !== 'ready') {
        return [];
      }
      return resolveUserMarkers(this.activeUserPayload.user, this.baseRanklistState.staticRanklist.markers);
    },
    activeUserPhotoSrc(): string {
      return this.resolveSrkImageUrl(this.activeUserPayload?.user.photo);
    },
    activeUserSlogan(): string {
      return (this.activeUserPayload?.user as srk.User & { x_slogan?: string }).x_slogan || '';
    },
    activeUserRankTimeData(): SelectedUserMainRankTimeData | null {
      if (!this.activeUserPayload || this.activeUserPayload.user.official !== true || !this.rankTimeDataSet) {
        return null;
      }
      if (this.baseRanklistState.kind !== 'ready') {
        return null;
      }
      return selectUserMainRankTimeData({
        rankTimeDataSet: this.rankTimeDataSet,
        staticRows: this.baseRanklistState.staticRanklist.rows,
        staticSeries: this.baseRanklistState.staticRanklist.series,
        staticMarkers: this.baseRanklistState.staticRanklist.markers,
        userId: this.activeUserPayload.user.id,
        fixedMarker: this.filter.marker,
      });
    },
    activeUserRankTimeLatestPoint(): RankTimePoint | null {
      const points = this.activeUserRankTimeData?.points || [];
      return points[points.length - 1] || null;
    },
    rankTimeCurvePoints(): string {
      const points = this.activeUserRankTimeData?.points || [];
      return points.map((point) => this.getRankTimeSvgPoint(point).join(',')).join(' ');
    },
    rankTimeEventMarkers(): Array<RankTimeSolvedEventPoint & { cx: number; cy: number }> {
      return (this.activeUserRankTimeData?.solvedEventPoints || []).map((eventPoint) => {
        const [cx, cy] = this.getRankTimeSvgPoint(eventPoint);
        return {
          ...eventPoint,
          cx,
          cy,
        };
      });
    },
  },
  watch: {
    id() {
      this.resetControls();
    },
    ranklist() {
      this.rankTimeDataSet = null;
      if (this.activeUserPayload) {
        this.rankTimeDataSet = this.createRankTimeDataSet();
      }
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
      this.rankTimeDataSet = null;
    },
    resolveTextValue(value: srk.Text | undefined): string {
      return resolveText(value);
    },
    resolveSrkImageUrl(image: srk.Image | srk.ImageWithLink | undefined): string {
      if (!image) {
        return '';
      }
      const rawUrl = typeof image === 'string' ? image : image.link || image.image;
      return this.formatRanklistAssetUrl(rawUrl);
    },
    formatRanklistAssetUrl(url: string): string {
      return formatSrkAssetUrl(url, this.id);
    },
    handleUserClick(payload: UserClickPayload) {
      this.activeUserPayload = payload;
      this.activeSolutionPayload = null;
      this.rankTimeDataSet = this.rankTimeDataSet || this.createRankTimeDataSet();
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
    createRankTimeDataSet(): RankTimeDataSet {
      return getAllRankTimeData(
        this.ranklist,
        getSortedCalculatedRawSolutions(this.ranklist.rows),
        getProperRankTimeChunkUnit(this.ranklist.contest),
      );
    },
    getRankTimeSvgPoint(point: Pick<RankTimePoint, 'time' | 'rank'>): [number, number] {
      const data = this.activeUserRankTimeData;
      if (!data || data.points.length === 0) {
        return [20, 130];
      }

      const width = 280;
      const height = 110;
      const left = 24;
      const top = 20;
      const maxTime = data.points[data.points.length - 1].time || 1;
      const maxRank = Math.max(...data.points.map((rankTimePoint) => rankTimePoint.rank), data.totalUsers, 1);
      const x = left + (point.time / maxTime) * width;
      const y = top + ((point.rank - 1) / Math.max(maxRank - 1, 1)) * height;
      return [Number(x.toFixed(2)), Number(y.toFixed(2))];
    },
    formatSolvedTime(time: srk.TimeDuration): string {
      return secToTimeStr(formatTimeDuration(time, 's'));
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
    async downloadGymGhostDat() {
      try {
        const file = await createGymGhostExportFile(this.ranklist, this.actionName);
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
        this.actionStatus = 'Gym Ghost 已导出';
      } catch (error) {
        this.actionStatus = 'Gym Ghost 导出失败';
      }
    },
    async downloadVJudgeReplay() {
      try {
        await writeVJudgeReplayFile(this.ranklist, this.actionName);
        this.actionStatus = 'VJudge Replay 已导出';
      } catch (error) {
        this.actionStatus = 'VJudge Replay 导出失败';
      }
    },
    async downloadGeneralExcel() {
      try {
        await writeGeneralExcelFile(this.ranklist, this.actionName);
        this.actionStatus = 'Excel 已导出';
      } catch (error) {
        this.actionStatus = 'Excel 导出失败';
      }
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

.rankland-ranklist-banner-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.rankland-ranklist-banner {
  max-width: min(100%, 1820px);
  max-height: 40vh;
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

.rankland-user-modal-body {
  color: #1f2937;
}

.rankland-user-modal-name {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
}

.rankland-user-modal-line {
  margin: 4px 0;
}

.rankland-user-modal-team-members,
.rankland-user-modal-markers,
.rankland-rank-time-events {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.rankland-user-modal-team-separator {
  color: #94a3b8;
}

.rankland-user-modal-marker,
.rankland-rank-time-event {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #334155;
  font-size: 12px;
}

.rankland-user-modal-photo {
  margin-top: 16px;

  img {
    max-width: 100%;
  }
}

.rankland-user-modal-slogan {
  margin: 16px 0 0;
}

.rankland-rank-time-panel {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.rankland-rank-time-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;

  h4 {
    margin: 0;
    font-size: 16px;
  }

  span {
    color: #64748b;
    font-size: 13px;
  }
}

.rankland-rank-time-curve {
  display: block;
  width: 100%;
  height: 190px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background:
    linear-gradient(to right, rgb(148 163 184 / 16%) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(148 163 184 / 16%) 1px, transparent 1px);
  background-size: 40px 32px;
}

.rankland-rank-time-summary {
  margin: 8px 0 0;
  color: #334155;
  font-size: 13px;
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
