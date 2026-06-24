<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type * as srk from '@algoux/standard-ranklist';
import { numberToAlphabet, resolveText } from '@algoux/standard-ranklist-utils';
import type { CalculatedSolutionTetrad } from '@algoux/standard-ranklist-utils';
import type { StaticRanklist } from '@algoux/standard-ranklist-renderer-component-vue';
import {
  calculateProblemStatisticsFooter,
  formatProblemStatisticsAcceptedMinute,
  formatProblemStatisticsAverageHardness,
  formatProblemStatisticsPercent,
  formatSolutionTimestamp,
  getSolutionResultMeta,
} from '@algoux/standard-ranklist-renderer-component-core';
import type { ProblemStatisticsFooter } from '@algoux/standard-ranklist-renderer-component-core';
import { ExternalLink } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationEllipsis,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
} from '@/components/ui/pagination';
import './problem-info-modal.less';

const props = defineProps<{
  problem: srk.Problem;
  problemIndex: number;
  ranklist: StaticRanklist;
  solutions: CalculatedSolutionTetrad[];
  languages?: readonly string[];
}>();

const LIMIT = 5;
const page = ref(1);

function resolveDisplayText(text: Parameters<typeof resolveText>[0]) {
  return resolveText(text, props.languages);
}

const resolvedTitle = computed(() => resolveDisplayText(props.problem.title));
const problemLink = computed(() => props.problem.link || '');
// Only render the info row when the problem actually carries a title and/or a link.
const showInfo = computed(() => !!resolvedTitle.value || !!props.problem.link);
const alias = computed(() => props.problem.alias || numberToAlphabet(props.problemIndex));
// Real title when present; otherwise (link-only) fall back to a "Problem <alias>" default.
const displayTitle = computed(() => resolvedTitle.value || `Problem ${alias.value}`);

// Problem statistics for the whole contest (per the spec, computed via renderer-component-core).
const statistics = computed<ProblemStatisticsFooter | undefined>(
  () => calculateProblemStatisticsFooter(props.ranklist)[props.problemIndex],
);

const statMetrics = computed(() => {
  const stat = statistics.value;
  if (!stat) {
    return [];
  }
  return [
    {
      key: 'accepted',
      label: 'Accepted',
      tooltip: 'Number of participants who solved this problem',
      primary: `${stat.accepted}`,
      secondary: formatProblemStatisticsPercent(stat.accepted, stat.participantCount),
    },
    {
      key: 'attempted',
      label: 'Attempted',
      tooltip: 'Number of participants who attempted this problem',
      primary: `${stat.attempted}`,
      secondary: formatProblemStatisticsPercent(stat.attempted, stat.participantCount),
    },
    {
      key: 'submitted',
      label: 'Submitted',
      tooltip: 'Total number of valid submissions for this problem',
      primary: `${stat.submitted}`,
      secondary: undefined,
    },
    {
      key: 'dirt',
      label: 'Dirt',
      tooltip: 'Wrong submissions among participants who solved this problem',
      primary: `${stat.dirt}`,
      secondary: formatProblemStatisticsPercent(stat.dirt, stat.dirtSubmitted),
    },
    {
      key: 'se',
      label: 'SE',
      tooltip: 'Average hardness, calculated as (participants - accepted) / participants',
      primary: formatProblemStatisticsAverageHardness(stat),
      secondary: undefined,
    },
    {
      key: 'fbLbAt',
      label: 'FB/LB at',
      tooltip: 'First Blood / Last Blood at, also known as first / last solve time, in minutes',
      primary: `${formatProblemStatisticsAcceptedMinute(stat.firstAcceptedTime)}/${formatProblemStatisticsAcceptedMinute(stat.lastAcceptedTime)}`,
      secondary: stat.firstAcceptedTime || stat.lastAcceptedTime ? 'min' : undefined,
    },
  ];
});

// Map user id -> user so the submission list can render a user column.
const userMap = computed(() => {
  const map = new Map<string, srk.User>();
  for (const row of props.ranklist.rows) {
    if (row.user?.id !== undefined && row.user?.id !== null) {
      map.set(`${row.user.id}`, row.user);
    }
  }
  return map;
});

// All submissions for this problem in reverse-chronological order (newest first).
// `props.solutions` is the parent's cached full-contest list that updates as the ranklist changes.
const problemSolutions = computed(() =>
  props.solutions.filter((tetrad) => tetrad[1] === props.problemIndex).reverse(),
);

const pageCount = computed(() => Math.max(1, Math.ceil(problemSolutions.value.length / LIMIT)));
const pagedSolutions = computed(() => {
  const start = (page.value - 1) * LIMIT;
  return problemSolutions.value.slice(start, start + LIMIT);
});

watch(
  () => props.problemIndex,
  () => {
    page.value = 1;
  },
);
watch(pageCount, (count) => {
  if (page.value > count) {
    page.value = count;
  }
});

function resolveUserName(userId: string) {
  const user = userMap.value.get(userId);
  return user ? resolveDisplayText(user.name) : userId;
}

function resolveUserOrganization(userId: string) {
  const user = userMap.value.get(userId);
  return user ? resolveDisplayText(user.organization) : '';
}

function formatTimestamp(tetrad: CalculatedSolutionTetrad) {
  return formatSolutionTimestamp({ result: tetrad[2], time: tetrad[3] } as srk.Solution);
}
</script>

<template>
  <div class="problem-modal">
    <!-- 3.1 Problem information -->
    <div v-if="showInfo" class="problem-modal-info">
      <a
        v-if="problemLink"
        class="problem-modal-title-link"
        :href="problemLink"
        target="_blank"
        rel="noopener"
      >
        <span class="problem-modal-title">{{ displayTitle }}</span>
        <ExternalLink class="problem-modal-external-icon" />
      </a>
      <div v-else class="problem-modal-title-plain">
        <span class="problem-modal-title">{{ displayTitle }}</span>
      </div>
    </div>

    <!-- 3.2 Problem statistics -->
    <div v-if="statMetrics.length > 0" class="problem-modal-stats" :class="{ 'mt-4': showInfo }">
      <div v-for="metric in statMetrics" :key="metric.key" class="problem-modal-stat" :title="metric.tooltip">
        <div class="problem-modal-stat-label">{{ metric.label }}</div>
        <div class="problem-modal-stat-primary">{{ metric.primary }}</div>
        <div v-if="metric.secondary !== undefined" class="problem-modal-stat-secondary">{{ metric.secondary }}</div>
      </div>
    </div>

    <!-- 3.3 Submission list -->
    <div class="problem-modal-submissions mt-6">
      <table class="srk-common-table srk-solutions-table problem-modal-submissions-table">
        <thead>
          <tr>
            <th class="srk--text-left problem-modal-col-user">User</th>
            <th class="srk--text-left problem-modal-col-result">Result</th>
            <th class="srk--text-right problem-modal-col-time">Time</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(solution, index) in pagedSolutions"
            :key="`${solution[0]}_${solution[2]}_${solution[3]?.[0]}_${index}`"
          >
            <td>
              <div class="problem-modal-submission-user">{{ resolveUserName(solution[0]) }}</div>
              <div v-if="resolveUserOrganization(solution[0])" class="problem-modal-submission-org">
                {{ resolveUserOrganization(solution[0]) }}
              </div>
            </td>
            <td>
              <span class="srk-solution-result-text" :class="getSolutionResultMeta(solution[2]).className">
                {{ getSolutionResultMeta(solution[2]).label }}
              </span>
            </td>
            <td class="srk--text-right">{{ formatTimestamp(solution) }}</td>
          </tr>
          <tr v-if="problemSolutions.length === 0">
            <td colspan="3" class="srk--text-center problem-modal-submissions-empty">暂无提交记录</td>
          </tr>
        </tbody>
      </table>

      <Pagination
        v-if="pageCount > 1"
        v-model:page="page"
        class="problem-modal-pagination"
        :total="problemSolutions.length"
        :items-per-page="LIMIT"
        :sibling-count="1"
        show-edges
      >
        <PaginationList v-slot="{ items }" class="problem-modal-pagination-list">
          <PaginationPrev />
          <template v-for="(item, itemIndex) in items">
            <PaginationListItem
              v-if="item.type === 'page'"
              :key="`page-${item.value}`"
              :value="item.value"
              as-child
            >
              <Button
                class="w-9 h-9 p-0"
                :variant="item.value === page ? 'default' : 'outline'"
              >
                {{ item.value }}
              </Button>
            </PaginationListItem>
            <PaginationEllipsis v-else :key="`ellipsis-${itemIndex}`" />
          </template>
          <PaginationNext />
        </PaginationList>
      </Pagination>
    </div>
  </div>
</template>
