<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type * as srk from '@algoux/standard-ranklist';
import { diagnoseRanklist } from '@algoux/standard-ranklist-utils';
import type {
  RanklistCompletenessItems,
  RanklistCorrectnessChecks,
  RanklistDiagnostics,
} from '@algoux/standard-ranklist-utils';
import { Modal } from '@algoux/standard-ranklist-renderer-component-vue';
import { Button } from '@/components/ui/button';
import RanklistQualityScoreRing from './RanklistQualityScoreRing.vue';
import {
  COMPLETENESS_LABELS_ZH,
  COMPLETENESS_LEVEL_TEXT_ZH,
  CORRECTNESS_LABELS_ZH,
  PRECISION_LABELS_ZH,
  QUALITY_BADGE_TONE_CLASSES,
  QUALITY_TONE_BUTTON_CLASSES,
  QUALITY_TONE_TEXT_CLASSES,
  calculateRanklistQualityScore,
  formatCompletenessCount,
  formatCorrectnessCount,
  formatPrecisionText,
  getCompletenessBadgeTone,
  getCorrectnessBadgeTone,
  getCorrectnessStatusText,
  getScoreTone,
} from './ranklist-diagnostics-score';
import './ranklist-quality-action.less';

const props = defineProps<{
  data: srk.Ranklist;
  clientWidth: number;
}>();

const mounted = ref(false);
const modalOpen = ref(false);

onMounted(() => {
  // A rAF scheduled inside onMounted still fires before the first paint; only the nested
  // one is guaranteed to run after it, so the placeholder button paints before the
  // expensive synchronous diagnose call. Hidden documents suspend rAF entirely (and have
  // no paint to protect), so compute immediately there.
  if (document.visibilityState === 'hidden') {
    mounted.value = true;
    return;
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      mounted.value = true;
    });
  });
});

type QualityState =
  | { status: 'pending' }
  | { status: 'error' }
  | { status: 'ready'; diagnostics: RanklistDiagnostics; score: number };

const state = computed<QualityState>(() => {
  if (!mounted.value) {
    return { status: 'pending' };
  }
  try {
    const diagnostics = diagnoseRanklist(props.data);
    return { status: 'ready', diagnostics, score: calculateRanklistQualityScore(diagnostics) };
  } catch (error) {
    console.error('[RanklistQualityAction] failed to diagnose ranklist:', error);
    return { status: 'error' };
  }
});

const score = computed(() => (state.value.status === 'ready' ? state.value.score : null));

const buttonToneClass = computed(() =>
  score.value !== null ? QUALITY_TONE_BUTTON_CLASSES[getScoreTone(score.value)] : QUALITY_TONE_BUTTON_CLASSES.muted,
);

const scoreToneClass = computed(() =>
  score.value !== null ? QUALITY_TONE_TEXT_CLASSES[getScoreTone(score.value)] : '',
);

const precisionRows = computed(() => {
  if (state.value.status !== 'ready') {
    return [];
  }
  const { precision } = state.value.diagnostics.summary;
  return (Object.keys(precision) as (keyof typeof precision)[]).map((key) => ({
    key,
    label: PRECISION_LABELS_ZH[key] ?? key,
    text: formatPrecisionText(precision[key]),
  }));
});

// optional cosmetic items are displayed at the end of the completeness section
const COMPLETENESS_TRAILING_KEYS: (keyof RanklistCompletenessItems)[] = ['banner', 'userAvatar', 'userPhoto'];

const completenessRows = computed(() => {
  if (state.value.status !== 'ready') {
    return [];
  }
  const { items } = state.value.diagnostics.completeness;
  const keys = Object.keys(items) as (keyof RanklistCompletenessItems)[];
  const orderedKeys = [
    ...keys.filter((key) => !COMPLETENESS_TRAILING_KEYS.includes(key)),
    ...COMPLETENESS_TRAILING_KEYS.filter((key) => keys.includes(key)),
  ];
  return orderedKeys.map((key) => {
    const item = items[key];
    return {
      key,
      label: COMPLETENESS_LABELS_ZH[key] ?? item.label,
      badgeClass: QUALITY_BADGE_TONE_CLASSES[getCompletenessBadgeTone(item)],
      levelText: COMPLETENESS_LEVEL_TEXT_ZH[item.level] ?? item.level,
      countText: formatCompletenessCount(item),
    };
  });
});

const correctnessRows = computed(() => {
  if (state.value.status !== 'ready') {
    return [];
  }
  const { checks } = state.value.diagnostics.correctness;
  return (Object.keys(checks) as (keyof RanklistCorrectnessChecks)[]).map((key) => {
    const check = checks[key];
    return {
      key,
      label: CORRECTNESS_LABELS_ZH[key] ?? check.label,
      badgeClass: QUALITY_BADGE_TONE_CLASSES[getCorrectnessBadgeTone(check)],
      statusText: getCorrectnessStatusText(check),
      countText: formatCorrectnessCount(check),
    };
  });
});
</script>

<template>
  <template v-if="state.status !== 'error'">
    <span class="srk-ranklist-meta-divider" />
    <span class="srk-ranklist-action-menu srk-ranklist-action-trigger" data-id="ranklist-quality-action">
      <Button
        variant="ghost"
        :class="['srk-ranklist-quality-action-button h-6 gap-1 rounded-md px-1.5 text-xs font-normal', buttonToneClass]"
        :disabled="score === null"
        aria-label="数据完整度"
        @click="modalOpen = true"
      >
        <RanklistQualityScoreRing :score="score" :size="16" />
        <span v-if="score !== null">{{ score }}%</span>
      </Button>
      <span class="srk-ranklist-action-tooltip" data-id="ranklist-quality-tooltip" role="tooltip">
        数据完整度
      </span>
    </span>

    <Modal
      :open="modalOpen"
      title="榜单数据完整度"
      :width="clientWidth >= 640 ? 380 : Math.max(clientWidth - 20, 280)"
      root-class-name="srk-general-modal-root"
      @close="modalOpen = false"
      @update:open="modalOpen = $event"
    >
      <div v-if="score !== null" class="srk-ranklist-quality-modal" data-id="ranklist-quality-modal">
        <div :class="['srk-ranklist-quality-score', scoreToneClass]">
          <RanklistQualityScoreRing :score="score" :size="42" />
          <div class="srk-ranklist-quality-score-text">
            <span class="srk-ranklist-quality-score-value">{{ score }}%</span>
            <!-- <span class="srk-ranklist-quality-score-caption">综合得分</span> -->
          </div>
        </div>
        <section class="srk-ranklist-quality-section">
          <h3>数据检测</h3>
          <div v-for="row in precisionRows" :key="row.key" class="srk-ranklist-quality-item">
            <span class="srk-ranklist-quality-item-label">{{ row.label }}</span>
            <span class="srk-ranklist-quality-item-value">
              <span class="srk-ranklist-quality-count">{{ row.text }}</span>
            </span>
          </div>
        </section>
        <section class="srk-ranklist-quality-section">
          <h3>完整性</h3>
          <div v-for="row in completenessRows" :key="row.key" class="srk-ranklist-quality-item">
            <span class="srk-ranklist-quality-item-label">{{ row.label }}</span>
            <span class="srk-ranklist-quality-item-value">
              <span :class="['srk-ranklist-quality-badge', row.badgeClass]">{{ row.levelText }}</span>
              <span class="srk-ranklist-quality-count">{{ row.countText }}</span>
            </span>
          </div>
        </section>
        <section class="srk-ranklist-quality-section">
          <h3>正确性</h3>
          <div v-for="row in correctnessRows" :key="row.key" class="srk-ranklist-quality-item">
            <span class="srk-ranklist-quality-item-label">{{ row.label }}</span>
            <span class="srk-ranklist-quality-item-value">
              <span :class="['srk-ranklist-quality-badge', row.badgeClass]">{{ row.statusText }}</span>
              <span class="srk-ranklist-quality-count">{{ row.countText }}</span>
            </span>
          </div>
        </section>
      </div>
    </Modal>
  </template>
</template>
