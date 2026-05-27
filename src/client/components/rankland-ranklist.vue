<template>
  <div class="rankland-ranklist">
    <div
      v-if="ranklistState.kind === 'check-error'"
      data-id="rankland-ranklist-check-error"
      class="rankland-ranklist-check-error ml-8"
    >
      <h3>Error occurred while checking srk:</h3>
      <pre>{{ ranklistState.message }}</pre>
    </div>
    <div
      v-else-if="ranklistState.kind === 'error'"
      data-id="rankland-ranklist-render-error"
      class="rankland-ranklist-error"
      role="alert"
    >
      <a-alert
        message="Error occurred when rendering srk"
        :description="ranklistState.message"
        type="error"
        show-icon
      />
    </div>
    <template v-else>
      <header v-if="showHeader" class="rankland-ranklist-header">
        <div v-if="contestBannerSrc" class="rankland-ranklist-banner-wrap flex items-center justify-center">
          <SrkAssetImage
            data-id="rankland-ranklist-banner"
            :src="contestBannerSrc"
            alt="Contest Banner"
            img-class="rankland-ranklist-banner mb-2"
          />
        </div>
        <h1 data-id="rankland-ranklist-title" class="text-center mb-1">{{ ranklistTitle }}</h1>
        <div data-id="rankland-ranklist-header-meta" class="rankland-ranklist-header-meta text-center mt-1">
          <span v-if="hasViewCount" data-id="rankland-ranklist-view-count" class="rankland-ranklist-view-count mr-2">
            <EyeOutlined /> {{ meta.viewCnt || '-' }}
          </span>
          <div data-id="rankland-ranklist-header-actions" class="rankland-ranklist-header-actions">
            <a-dropdown data-id="rankland-ranklist-export-menu" :trigger="['hover']" placement="bottom">
              <a-button
                data-id="rankland-ranklist-export-menu-button"
                :class="[
                  'rankland-ranklist-header-action-trigger border-0 border-solid border-gray-400 mr-2',
                  { 'rankland-ranklist-header-action-separated pl-2 border-l': hasViewCount },
                ]"
                size="small"
                title="导出"
                aria-label="导出"
              >
                <DownloadOutlined />
              </a-button>
              <template #overlay>
                <a-menu data-id="rankland-ranklist-export-menu-overlay">
                  <a-menu-item-group key="export-group" data-id="rankland-ranklist-export-menu-group" title="导出为">
                    <a-menu-item key="export-srk">
                      <button data-id="rankland-ranklist-export-srk-action" type="button" @click="downloadSrkJson">
                        标准榜单格式 (srk)
                      </button>
                    </a-menu-item>
                    <a-menu-item key="export-gym-ghost">
                      <button
                        data-id="rankland-ranklist-export-gym-ghost-action"
                        type="button"
                        @click="downloadGymGhostDat"
                      >
                        Codeforces Gym Ghost (dat)
                      </button>
                    </a-menu-item>
                    <a-menu-item key="export-vjudge">
                      <button data-id="rankland-ranklist-export-vjudge-action" type="button" @click="downloadVJudgeReplay">
                        Virtual Judge Replay (xlsx)
                      </button>
                    </a-menu-item>
                    <a-menu-item key="export-xlsx">
                      <button data-id="rankland-ranklist-export-xlsx-action" type="button" @click="downloadGeneralExcel">
                        Excel 表格 (xlsx)
                      </button>
                    </a-menu-item>
                  </a-menu-item-group>
                </a-menu>
              </template>
            </a-dropdown>

            <a-dropdown data-id="rankland-ranklist-share-menu" :trigger="['hover']" placement="bottom">
              <a-button
                data-id="rankland-ranklist-share-menu-button"
                class="rankland-ranklist-header-action-trigger rankland-ranklist-header-action-separated pl-2 border-0 border-l border-solid border-gray-400"
                size="small"
                title="分享"
                aria-label="分享"
              >
                <ShareAltOutlined />
              </a-button>
              <template #overlay>
                <a-menu data-id="rankland-ranklist-share-menu-overlay">
                  <a-menu-item key="copy-link">
                    <button data-id="rankland-ranklist-copy-link-action" type="button" @click="copyCurrentPageLink">
                      复制本页链接
                    </button>
                  </a-menu-item>
                  <a-menu-item v-if="id" key="copy-embed">
                    <button data-id="rankland-ranklist-copy-embed-action" type="button" @click="copyEmbedCode">
                      复制嵌入代码
                    </button>
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>

            <span v-if="actionStatus" data-id="rankland-ranklist-action-status" class="rankland-ranklist-action-status">
              {{ actionStatus }}
            </span>
          </div>
        </div>
        <p
          v-if="headerContributors.length > 0"
          data-id="rankland-ranklist-contributors"
          class="rankland-ranklist-contributors mb-0"
        >
          贡献者：<template v-for="(contributor, contributorIndex) in headerContributors" :key="contributor.key">
            <span>
              {{ contributorIndex > 0 ? ', ' : '' }}<a v-if="contributor.href" :href="contributor.href" target="_blank" rel="noopener">
                {{ contributor.label }}
              </a><span v-else>{{ contributor.label }}</span>
            </span>
          </template>
        </p>
        <span v-if="mainRefLinks.length > 0" data-id="rankland-ranklist-ref-links" class="rankland-ranklist-ref-links">
          相关链接：<template v-for="(refLink, refLinkIndex) in mainRefLinks" :key="refLink.key">
            <span>
              {{ refLinkIndex > 0 ? ', ' : '' }}<a :href="refLink.href" target="_blank" rel="noopener">{{ refLink.label }}</a>
            </span>
          </template>
          <a-dropdown
            v-if="extraRefLinks.length > 0"
            :trigger="['hover']"
            placement="bottom"
          >
            <span data-id="rankland-ranklist-ref-link-extra-action" class="rankland-ranklist-ref-link-extra-action">
              and {{ extraRefLinks.length }} more <CaretDownOutlined />
            </span>
            <template #overlay>
              <a-menu data-id="rankland-ranklist-ref-link-extra-overlay">
                <a-menu-item v-for="refLink in extraRefLinks" :key="refLink.key">
                  <a
                    :data-id="`rankland-ranklist-ref-link-extra-${refLink.dataId}`"
                    :href="refLink.href"
                    target="_blank"
                    rel="noopener"
                  >
                    {{ refLink.label }}
                  </a>
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </span>
        <p data-id="rankland-ranklist-time" class="rankland-ranklist-time text-center mb-0">{{ contestTimeRange }}</p>
      </header>

      <div v-if="showProgress" data-id="rankland-ranklist-progress" class="rankland-ranklist-progress mx-4">
        <ProgressBar :data="ranklist" enable-time-travel :live="isLive" @time-travel="handleTimeTravel" />
      </div>

      <div
        v-if="showFilter || hasExtraAction"
        data-id="rankland-ranklist-controls"
        class="rankland-ranklist-controls mt-3 mx-4 flex justify-between items-center"
      >
        <div v-if="showFilter" data-id="rankland-ranklist-filters" class="rankland-ranklist-filters">
          <label class="rankland-ranklist-filter">
            <span>筛选</span>
            <a-select
              v-model:value="filter.organizations"
              data-id="rankland-ranklist-organization-filter"
              mode="multiple"
              allow-clear
              placeholder="选择组织/单位"
              class="rankland-ranklist-select ml-2"
              :max-tag-count="0"
              :max-tag-placeholder="formatOrganizationSelectionPlaceholder"
            >
              <a-select-option v-for="organization in ranklistState.organizations" :key="organization" :value="organization">
                {{ organization }}
              </a-select-option>
            </a-select>
          </label>

          <label class="rankland-ranklist-filter rankland-ranklist-checkbox ml-5 inline-flex items-center">
            <span class="mr-1">仅正式参赛</span>
            <a-switch
              v-model:checked="filter.officialOnly"
              data-id="rankland-ranklist-official-filter"
              size="small"
            />
          </label>

          <a-radio-group
            v-if="ranklistState.markers.length > 0"
            v-model:value="filter.marker"
            data-id="rankland-ranklist-marker-filter"
            class="rankland-ranklist-marker-filter ml-5 inline-flex items-center"
            button-style="solid"
          >
            <a-radio-button value="">全部</a-radio-button>
            <a-radio-button v-for="marker in ranklistState.markers" :key="marker.id" :value="marker.id">
              {{ resolveTextValue(marker.label) }}
            </a-radio-button>
          </a-radio-group>
        </div>

        <div v-if="hasExtraAction" data-id="rankland-ranklist-extra-action" class="rankland-ranklist-extra-action">
          <slot name="extra-action" :ranklist="ranklist" />
        </div>
      </div>

      <div data-id="rankland-ranklist-table-spacer" class="rankland-ranklist-table-spacer mt-6" />
      <div data-id="rankland-ranklist-table-wrapper" v-bind="tableWrapperAttrs">
        <div v-if="ranklistState.staticRanklist.remarks" class="rankland-ranklist-remarks mb-4 text-center">
          <span class="srk-remarks">备注：{{ resolveTextValue(ranklistState.staticRanklist.remarks) }}</span>
        </div>

        <Ranklist
          :data="ranklistState.staticRanklist"
          :theme="ranklistTheme"
          striped-rows
          :format-srk-asset-url="formatRanklistAssetUrl"
          @user-click="handleUserClick"
          @solution-click="handleSolutionClick"
        />
      </div>

      <footer v-if="showFooter" data-id="rankland-ranklist-footer" class="rankland-ranklist-footer text-center mt-8">
        <p class="mb-0">© 2022-present algoUX. All Rights Reserved.</p>
        <p class="mt-1 mb-0">
          Find us on <a href="https://github.com/algoux" target="_blank">GitHub</a>
        </p>
        <p class="mt-1 mb-0">
          Powered by
          <a href="https://github.com/algoux/standard-ranklist" target="_blank">
            Standard Ranklist
          </a>
        </p>
        <p class="mt-1 mb-0">
          欢迎补充榜单数据至
          <a href="https://github.com/algoux/srk-collection" target="_blank">榜单合集</a>
        </p>
        <p class="mt-1 mb-0">
          需要专业的赛事外榜托管？
          <ContactUs>
            <a data-id="contact-us-trigger" class="contact-us-trigger">联系我们</a>
          </ContactUs>
        </p>
        <p v-if="footerSiteState.showBeian" data-id="rankland-ranklist-beian" class="mt-1 mb-0">
          备案号：
          <a
            data-id="rankland-ranklist-beian-link"
            href="https://beian.miit.gov.cn/"
            target="_blank"
          >
            {{ footerSiteState.beianText }}
          </a>
        </p>
      </footer>

      <div data-id="rankland-ranklist-user-modal">
        <Modal
          :open="!!activeUserPayload"
          :title="activeUserTitle"
          :width="userModalWidth"
          root-class-name="srk-general-modal-root srk-react-modal-root"
          wrap-class-name="rankland-user-modal"
          @close="handleUserModalClose"
        >
          <div v-if="activeUserPayload" class="rankland-user-modal-body user-modal">
            <p
              data-id="rankland-user-modal-organization"
              class="rankland-user-modal-line rankland-user-modal-organization mb-0"
            >
              {{ activeUserOrganization }}
            </p>
            <p
              v-if="activeUserPayload.user.official === false"
              data-id="rankland-user-modal-unofficial"
              class="rankland-user-modal-unofficial mt-4 mb-0"
            >
              ＊ 非正式参加者
            </p>
            <div
              v-if="activeUserTeamMembers.length > 0"
              data-id="rankland-user-modal-team-members"
              class="rankland-user-modal-team-members user-modal-info-team-members mt-2"
            >
              <template v-for="(member, memberIndex) in activeUserTeamMembers" :key="memberIndex">
                <span
                  v-if="memberIndex > 0"
                  data-id="rankland-user-modal-team-separator"
                  class="rankland-user-modal-team-separator user-modal-info-team-members-slash"
                >
                  /
                </span>
                <span data-id="rankland-user-modal-team-member">{{ resolveTextValue(member.name) }}</span>
              </template>
            </div>
            <div v-if="activeUserMarkerLabels.length > 0" class="rankland-user-modal-markers user-modal-info-markers mt-2">
              <span
                v-for="marker in activeUserMarkerLabels"
                :key="marker.id"
                data-id="rankland-user-modal-marker"
                class="rankland-user-modal-marker user-modal-info-marker"
                :class="marker.className"
                :style="marker.style"
              >
                {{ marker.label }}
              </span>
            </div>
            <p
              v-if="activeUserSegment"
              data-id="rankland-user-modal-segment"
              class="rankland-user-modal-line rankland-user-modal-segment mt-4 mb-0"
            >
              所在奖区（{{ activeUserSegment.seriesTitle }}）：
              <span
                data-id="rankland-user-modal-segment-label"
                class="rankland-user-modal-segment-label user-modal-segment-label"
                :class="`bg-segment-${activeUserSegment.segmentStyle}`"
              >
                {{ activeUserSegment.segmentTitle }}
              </span>
            </p>
            <div class="rankland-user-modal-photo mt-4">
              <SrkAssetImage
                v-if="activeUserPhotoSrc"
                data-id="rankland-user-modal-photo"
                :src="activeUserPhotoSrc"
                alt="选手照片"
              />
              <p
                v-if="activeUserSlogan"
                data-id="rankland-user-modal-slogan"
                class="rankland-user-modal-slogan slogan mt-4 mb-2"
              >
                {{ activeUserSlogan }}
              </p>
            </div>

            <div
              v-if="activeUserRankTimeData"
              data-id="rankland-rank-time-panel"
              class="rankland-rank-time-panel mt-4"
            >
              <RanklandRankTimeChart :rank-time-data="activeUserRankTimeData" />
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
          root-class-name="srk-general-modal-root srk-react-modal-root"
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
  resolveContributor,
  resolveStyle,
  resolveText,
  resolveUserMarkers,
} from '@algoux/standard-ranklist-utils';
import {
  DefaultSolutionModal,
  Modal,
  ProgressBar,
  Ranklist,
  type SolutionClickPayload,
  type UserClickPayload,
} from '@algoux/standard-ranklist-renderer-component-vue';
import { CaretDownOutlined, DownloadOutlined, EyeOutlined, ShareAltOutlined } from '@ant-design/icons-vue';
import { notification } from 'ant-design-vue';
import '@algoux/standard-ranklist-renderer-component-styles';
import ContactUs from './contact-us.vue';
import RanklandRankTimeChart from './rankland-rank-time-chart.vue';
import SrkAssetImage from './srk-asset-image.vue';
import { createRanklandFooterSiteState } from './rankland-footer-site';
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
  type SelectedUserMainRankTimeData,
} from './rankland-rank-time';
import { formatSrkAssetUrl } from '@client/utils/srk-asset.util';

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

function formatDateTime(timestamp: number, includeOffset = false): string {
  const date = new Date(timestamp);
  const offsetMinutes = -date.getTimezoneOffset();
  const offsetSign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteOffsetMinutes = Math.abs(offsetMinutes);
  const offsetHours = Math.floor(absoluteOffsetMinutes / 60);
  const offsetRemainderMinutes = absoluteOffsetMinutes % 60;
  const formattedTime = [
    `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`,
    `${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}:${padDatePart(date.getSeconds())}`,
  ].join(' ');

  if (!includeOffset) {
    return formattedTime;
  }

  return `${formattedTime} ${offsetSign}${padDatePart(offsetHours)}:${padDatePart(offsetRemainderMinutes)}`;
}

interface RanklandRanklistMeta {
  viewCnt?: number;
}

interface HeaderContributor {
  key: string;
  label: string;
  href: string;
}

interface HeaderRefLink {
  key: string;
  label: string;
  href: string;
  dataId: string;
}

interface ActiveUserSegment {
  seriesTitle: string;
  segmentTitle: string;
  segmentStyle: string;
}

interface ActiveUserMarkerLabel {
  id: string;
  label: string;
  className: string;
  style: Record<string, string>;
}

function normalizeHeaderDataId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'link';
}

export default defineComponent({
  name: 'RanklandRanklist',
  components: {
    CaretDownOutlined,
    ContactUs,
    DefaultSolutionModal,
    DownloadOutlined,
    EyeOutlined,
    Modal,
    ProgressBar,
    Ranklist,
    RanklandRankTimeChart,
    ShareAltOutlined,
    SrkAssetImage,
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
      default: true,
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
    meta: {
      type: Object as PropType<RanklandRanklistMeta>,
      required: false,
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
      ranklistTheme: 'light' as 'light' | 'dark',
      viewportWidth: 1280,
      themeObserver: undefined as MutationObserver | undefined,
      viewportResizeHandler: undefined as (() => void) | undefined,
    };
  },
  computed: {
    ranklistState() {
      return createRanklandRanklistState(this.ranklist, {
        filter: this.filter,
        timeTravelTime: this.timeTravelTime,
      });
    },
    footerSiteState() {
      return createRanklandFooterSiteState();
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
      return `${formatDateTime(startAt)} ~ ${formatDateTime(endAt, true)}`;
    },
    hasExtraAction(): boolean {
      return !!this.$slots['extra-action'];
    },
    actionName(): string {
      return this.name || this.id || 'ranklist';
    },
    hasViewCount(): boolean {
      return !!this.meta;
    },
    tableWrapperAttrs(): Record<string, string> {
      return this.tableClass ? { class: this.tableClass } : {};
    },
    headerContributors(): HeaderContributor[] {
      if (this.ranklistState.kind !== 'ready' || !Array.isArray(this.ranklistState.staticRanklist.contributors)) {
        return [];
      }

      return this.ranklistState.staticRanklist.contributors
        .map((contributor, index) => {
          const resolved = resolveContributor(contributor);
          if (!resolved) {
            return null;
          }
          return {
            key: `${index}-${JSON.stringify(contributor)}`,
            label: resolved.name,
            href: resolved.url || '',
          };
        })
        .filter((contributor): contributor is HeaderContributor => !!contributor);
    },
    headerRefLinks(): HeaderRefLink[] {
      if (this.ranklistState.kind !== 'ready' || !Array.isArray(this.ranklistState.staticRanklist.contest.refLinks)) {
        return [];
      }

      return this.ranklistState.staticRanklist.contest.refLinks.map((refLink, index) => {
        const label = resolveText(refLink.title);
        return {
          key: `${index}-${refLink.link}`,
          label,
          href: refLink.link,
          dataId: normalizeHeaderDataId(label),
        };
      });
    },
    mainRefLinks(): HeaderRefLink[] {
      return this.headerRefLinks.slice(0, 3);
    },
    extraRefLinks(): HeaderRefLink[] {
      return this.headerRefLinks.slice(3);
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
    activeUserMarkerLabels(): ActiveUserMarkerLabel[] {
      if (!this.activeUserPayload || this.baseRanklistState.kind !== 'ready') {
        return [];
      }
      return resolveUserMarkers(this.activeUserPayload.user, this.baseRanklistState.staticRanklist.markers)
        .map((marker) => {
          const style = marker.style;
          if (typeof style === 'string') {
            return {
              id: marker.id,
              label: resolveText(marker.label),
              className: `srk-preset-marker-${style}`,
              style: {},
            };
          }

          const resolvedStyle = resolveStyle(style);
          return {
            id: marker.id,
            label: resolveText(marker.label),
            className: '',
            style: {
              color: resolvedStyle.textColor[this.ranklistTheme] || '',
              backgroundColor: resolvedStyle.backgroundColor[this.ranklistTheme] || '',
            },
          };
        });
    },
    activeUserSegment(): ActiveUserSegment | null {
      if (!this.activeUserPayload) {
        return null;
      }

      const userMarkers = resolveUserMarkers(this.activeUserPayload.user, this.activeUserPayload.ranklist.markers);
      const matchedSeries = this.findUserMatchedMainICPCSeries(
        this.activeUserPayload.ranklist.series,
        userMarkers,
        this.filter.marker,
      );
      if (!matchedSeries) {
        return null;
      }

      const matchedSeriesIndex = this.activeUserPayload.ranklist.series.findIndex((series) => series === matchedSeries);
      const matchedSegmentIndex = this.activeUserPayload.row.rankValues[matchedSeriesIndex]?.segmentIndex;
      if (matchedSegmentIndex === undefined || matchedSegmentIndex === null) {
        return null;
      }

      const matchedSegment = matchedSeries.segments?.[matchedSegmentIndex];
      if (!matchedSegment) {
        return null;
      }

      return {
        seriesTitle: resolveText(matchedSeries.title),
        segmentTitle: resolveText(matchedSegment.title),
        segmentStyle: typeof matchedSegment.style === 'string' ? matchedSegment.style : 'custom',
      };
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
    userModalWidth(): number {
      return this.viewportWidth >= 980 ? 960 : Math.max(this.viewportWidth - 20, 0);
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
  mounted() {
    this.updateViewportWidth();
    this.viewportResizeHandler = () => {
      this.updateViewportWidth();
    };
    window.addEventListener('resize', this.viewportResizeHandler, { passive: true });
    this.syncRanklistTheme();
    this.themeObserver = new MutationObserver(() => {
      this.syncRanklistTheme();
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  },
  beforeUnmount() {
    this.themeObserver?.disconnect();
    if (this.viewportResizeHandler) {
      window.removeEventListener('resize', this.viewportResizeHandler);
    }
  },
  methods: {
    updateViewportWidth() {
      this.viewportWidth = window.innerWidth;
    },
    syncRanklistTheme() {
      this.ranklistTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    },
    findUserMatchedMainICPCSeries(
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
    },
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
    formatOrganizationSelectionPlaceholder(omittedValues: unknown[]): string {
      return `已选择 ${omittedValues.length} 个`;
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
        notification.success({
          message: successMessage,
          duration: 2,
          style: {
            width: '280px',
          },
        });
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
@font-face {
  font-family: 'ZCOOL XiaoWei';
  font-style: normal;
  font-weight: normal;
  src: url('../assets/fonts/ZCOOL_XiaoWei/ZCOOLXiaoWei-Regular.woff2') format('woff2');
}

.rankland-ranklist {
  width: 100%;
  overflow-x: auto;
}

.rankland-ranklist a,
.rankland-ranklist-footer :deep(.contact-us-trigger) {
  color: var(--rankland-link-color);
}

.rankland-ranklist a:hover,
.rankland-ranklist-footer :deep(.contact-us-trigger:hover) {
  color: var(--rankland-link-hover-color);
}

.rankland-ranklist-header {
  margin-bottom: 0;
  text-align: center;
}

.rankland-ranklist-header h1 {
  margin: 0 0 4px;
  font-size: 32px;
  font-weight: 500;
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

.rankland-ranklist-header-meta {
  margin: 4px 0 0;
  font-size: 14px;
}

.rankland-ranklist-header-actions {
  display: inline;
  margin: 0;
}

.rankland-ranklist-view-count {
  color: var(--rankland-legacy-text-color);
}

.rankland-ranklist-contributors,
.rankland-ranklist-ref-links {
  margin: 0;
  color: var(--rankland-legacy-text-color);
  font-size: 14px;
}

.rankland-ranklist-ref-link-extra-action {
  cursor: pointer;
}

.rankland-ranklist-header-actions button,
:global(.ant-dropdown-menu-item) button {
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.rankland-ranklist-header-actions .rankland-ranklist-header-action-trigger {
  width: auto;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  color: var(--rankland-link-color);
}

.rankland-ranklist-header-actions .rankland-ranklist-header-action-trigger:hover,
.rankland-ranklist-header-actions .rankland-ranklist-header-action-trigger:focus {
  background: transparent;
  color: var(--rankland-link-hover-color);
}

.rankland-ranklist-header-actions .rankland-ranklist-header-action-trigger :deep(.anticon) {
  color: inherit;
}

.rankland-ranklist-header-actions .rankland-ranklist-header-action-separated {
  padding-left: 8px;
  border-left: 1px solid #9ca3af;
}

.rankland-ranklist-header-actions .rankland-ranklist-header-action-separated:hover,
.rankland-ranklist-header-actions .rankland-ranklist-header-action-separated:focus {
  border-left-color: #9ca3af;
}

.rankland-ranklist-action-status {
  align-self: center;
  color: #237804;
}

.rankland-ranklist-time {
  margin: 0;
  color: var(--rankland-legacy-text-color);
  font-size: 14px;
}

.rankland-ranklist-progress {
  margin: 0 16px;
}

@media (max-width: 767px) {
  .rankland-ranklist-progress :deep(.srk-progress-secondary-area) {
    flex-wrap: wrap;
    gap: 4px 12px;
  }

  .rankland-ranklist-progress :deep(.srk-progress-secondary-area-left),
  .rankland-ranklist-progress :deep(.srk-progress-secondary-area-right) {
    flex: 1 1 140px;
    min-width: 0;
  }
}

.rankland-ranklist-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px 16px 0;
}

:global(.rankland-ranklist-filters) {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0;
}

:global(.rankland-ranklist-filter) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

:global(.rankland-ranklist-checkbox) {
  margin-left: 20px;
  gap: 4px;
}

.rankland-ranklist-select {
  width: 160px;
}

:global(.rankland-ranklist-marker-filter) {
  display: inline-flex;
  align-items: center;
  margin-left: 20px;
  white-space: nowrap;
}

.rankland-ranklist-remarks {
  margin-bottom: 16px;
  text-align: center;
}

.srk-remarks {
  display: inline-block;
  padding: 4px 8px;
  border: 1px solid rgba(var(--rankland-primary-color-rgb), 0.8);
  border-radius: 4px;
  font-size: 12px;
  opacity: 0.75;
}

.rankland-ranklist-table-spacer {
  height: 0;
}

.mt-6 {
  margin-top: 24px;
}

.ml-4 {
  margin-left: 16px;
}

.ml-8 {
  margin-left: 32px;
}

.rankland-ranklist-footer {
  margin-top: 32px;
  text-align: center;
}

.rankland-ranklist-footer p {
  margin: 0;
}

.rankland-ranklist-footer p + p {
  margin-top: 4px;
}

.rankland-user-modal-body {
  color: var(--rankland-legacy-text-color);
}

.rankland-user-modal-line {
  margin: 4px 0;
}

.rankland-user-modal-organization {
  margin: 0;
}

.rankland-user-modal-unofficial {
  margin: 16px 0 0;
}

.rankland-user-modal-team-members {
  display: block;
  margin-top: 8px;
  padding-top: 6px;
  opacity: 0.8;
}

.rankland-user-modal-team-separator {
  color: inherit;
  font-size: 80%;
  opacity: 0.5;
}

.rankland-user-modal-markers {
  display: block;
  margin-top: 8px;
}

.rankland-user-modal-marker {
  display: inline-block;
  padding: 2px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 12px;
}

.rankland-user-modal-marker:not(:last-of-type) {
  margin-right: 4px;
}

.rankland-user-modal-segment {
  margin: 16px 0 0;
}

.rankland-user-modal-segment-label {
  display: inline-block;
  padding: 4px;
  border-radius: 4px;
  color: #fff;
}

.bg-segment-gold {
  background-color: var(--srk-color-gold);
}

.bg-segment-silver {
  background-color: var(--srk-color-silver);
}

.bg-segment-bronze {
  background-color: var(--srk-color-bronze);
}

.srk-preset-marker-red {
  background-color: var(--srk-color-marker-red);
}

.srk-preset-marker-orange {
  background-color: var(--srk-color-marker-orange);
}

.srk-preset-marker-yellow {
  background-color: var(--srk-color-marker-yellow);
}

.srk-preset-marker-green {
  background-color: var(--srk-color-marker-green);
}

.srk-preset-marker-blue {
  background-color: var(--srk-color-marker-blue);
}

.srk-preset-marker-purple {
  background-color: var(--srk-color-marker-purple);
}

.srk-preset-marker-pink {
  background-color: var(--srk-color-marker-pink);
}

.bg-segment-iron {
  background-color: var(--srk-color-iron);
}

.rankland-user-modal-photo {
  margin-top: 16px;

  img {
    width: 100%;
    max-width: 100%;
  }
}

.rankland-user-modal-slogan {
  margin: 16px 0 8px;
  font-family: 'ZCOOL XiaoWei', serif;
  font-size: 32px;
  text-align: center;
}

.rankland-user-modal-slogan::before {
  display: block;
  font-size: 14px;
  content: 'SLOGAN';
}

.rankland-rank-time-panel {
  margin-top: 16px;
}

.rankland-rank-time-curve {
  display: block;
  width: 100%;
}

.rankland-ranklist-error {
  max-width: 400px;
  margin: 100px auto;
}

@media (max-width: 767px) {
  .rankland-ranklist-controls {
    align-items: stretch;
    flex-direction: column;
  }

  :global(.rankland-ranklist-filters) {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
  }

  :global(.rankland-ranklist-checkbox),
  :global(.rankland-ranklist-marker-filter) {
    margin-left: 0;
  }

  .rankland-ranklist-select {
    width: 100%;
  }
}
</style>
