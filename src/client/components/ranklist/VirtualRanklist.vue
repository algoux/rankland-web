<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, ref, render, shallowRef, useSlots, watch } from 'vue';
import { Ranklist } from '@algoux/standard-ranklist-renderer-component-vue';
import type { RanklistProps } from '@algoux/standard-ranklist-renderer-component-vue';
import { getRanklistColumnWidths } from './ranklist-column-widths';
import {
  LARGE_RANKLIST_THRESHOLD,
  RANKLIST_ROW_HEIGHT,
  initialRanklistRowWindow,
  getUniformRowWindow,
} from './ranklist-row-window';
import type { RanklistRowWindow } from './ranklist-row-window';

defineOptions({ inheritAttrs: false });
const props = defineProps<RanklistProps>();
const forwardedProps = computed(() => ({ ...props, languages: props.languages ? [...props.languages] : undefined }));
const root = ref<HTMLElement | null>(null);
const fullList = ref(false);
const slots = useSlots();
let printContainer: HTMLDivElement | null = null;
const large = computed(() => props.data.rows.length > LARGE_RANKLIST_THRESHOLD);
const windowed = computed(() => large.value && !fullList.value);
const range = shallowRef<RanklistRowWindow>(initialRanklistRowWindow(props.data.rows.length));
const displayWindow = computed(() => windowed.value ? range.value : undefined);
const columnWidths = computed(() => windowed.value ? getRanklistColumnWidths(props) : undefined);
let frame = 0;
let mounted = false;
let rootObserver: ResizeObserver | null = null;

// Both SSR and the first browser render use the same bounded window. Measuring
// starts only after hydration; the original row nodes are retained.
watch(() => props.data.rows, () => {
  range.value = initialRanklistRowWindow(props.data.rows.length);
  scheduleMeasure();
});
const geometryKey = computed(() => JSON.stringify([
  props.statusCellPreset, props.statusColorAsText, props.splitOrganization,
  props.showDirtColumn, props.showSEColumn, props.showProblemStatisticsFooter,
  props.userAvatarPlacement, props.languages, props.data.series.length,
  props.data.problems.length, props.enableCCPC26,
]));
watch(geometryKey, () => {
  scheduleMeasure();
});
watch(windowed, scheduleMeasure, { flush: 'post' });

function tableElement() {
  return root.value?.querySelector<HTMLTableElement>('.srk-main > table');
}

function scheduleMeasure() {
  if (!mounted || frame) return;
  frame = window.requestAnimationFrame(() => {
    frame = 0;
    measureWindow();
  });
}

function measureWindow() {
  if (!windowed.value || !root.value) return;
  const table = tableElement();
  const body = table?.tBodies[0];
  if (!table || !body) return;
  let viewportTop = 0;
  let viewportBottom = window.innerHeight;
  // An overflow-x wrapper often computes overflow-y:auto too, but it is not a
  // vertical viewport unless its contents actually overflow its own height.
  for (let parent = root.value.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
    const overflow = window.getComputedStyle(parent).overflowY;
    if (/auto|scroll/.test(overflow) && parent.scrollHeight > parent.clientHeight + 1) {
      const rect = parent.getBoundingClientRect();
      viewportTop = Math.max(viewportTop, rect.top + parent.clientTop);
      viewportBottom = Math.min(viewportBottom, rect.top + parent.clientTop + parent.clientHeight);
    }
  }
  const first = body.rows[0]?.getBoundingClientRect();
  if (!first) return;
  const next = getUniformRowWindow(body.rows.length, first.top, first.height, viewportTop, viewportBottom);
  if (next.start !== range.value.start || next.end !== range.value.end) range.value = next;
}

function beforePrint() {
  if (!windowed.value || !root.value || printContainer) return;
  // Chromium snapshots before Vue's queued reactive update. Public render() is
  // synchronous: mount a complete, short-lived print tree only on print demand.
  printContainer = document.createElement('div');
  printContainer.className = 'ranklist-print-copy';
  root.value.append(printContainer);
  render(h(Ranklist, { ...forwardedProps.value, rowWindow: undefined, retainUserText: large.value, columnWidths: undefined, rowHeight: RANKLIST_ROW_HEIGHT }, slots), printContainer);
  root.value.classList.add('ranklist-printing');
}
function afterPrint() {
  if (printContainer) {
    render(null, printContainer);
    printContainer.remove();
    printContainer = null;
  }
  root.value?.classList.remove('ranklist-printing');
  scheduleMeasure();
}

onMounted(() => {
  mounted = true;
  if (typeof ResizeObserver !== 'undefined') {
    rootObserver = new ResizeObserver(scheduleMeasure);
    if (root.value) rootObserver.observe(root.value);
  }
  window.addEventListener('scroll', scheduleMeasure, { capture: true, passive: true });
  window.addEventListener('resize', scheduleMeasure, { passive: true });
  window.addEventListener('beforeprint', beforePrint);
  window.addEventListener('afterprint', afterPrint);
  scheduleMeasure();
});
onBeforeUnmount(() => {
  mounted = false;
  afterPrint();
  window.cancelAnimationFrame(frame);
  rootObserver?.disconnect();
  window.removeEventListener('scroll', scheduleMeasure, true);
  window.removeEventListener('resize', scheduleMeasure);
  window.removeEventListener('beforeprint', beforePrint);
  window.removeEventListener('afterprint', afterPrint);
});
</script>

<template>
  <div ref="root" class="ranklist-window" :data-windowed="windowed ? 'true' : undefined">
    <div v-if="large" class="ranklist-window-controls">
      <span>共 {{ data.rows.length }} 行</span>
      <button type="button" :aria-pressed="fullList" title="队名、学校可直接使用浏览器查找；查找排名、分数或提交状态时请显示完整榜单" @click="fullList = !fullList">
        {{ fullList ? '恢复流畅浏览' : '显示完整榜单（复制或打印）' }}
      </button>
    </div>
    <Ranklist v-bind="{ ...forwardedProps, ...$attrs }" :row-window="displayWindow" :retain-user-text="large" :column-widths="columnWidths" :row-height="RANKLIST_ROW_HEIGHT">
      <template v-for="(_, name) in $slots" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps" />
      </template>
    </Ranklist>
  </div>
</template>

<style>
.ranklist-window { overflow-anchor: none; }
.ranklist-window-controls {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 0 8px 8px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}
.ranklist-window-controls button { text-decoration: underline; text-underline-offset: 3px; }
/* Hide only the live table, not the nested synchronous print copy. */
.ranklist-window.ranklist-printing > .srk-main { display: none; }
@media print {
  .ranklist-window-controls { display: none; }
}
</style>
