<template>
  <div class="plugin_scroll-solution-container" data-id="scroll-solution-container">
    <TransitionGroup name="scroll-solution" tag="div">
      <div
        v-for="item in visibleItems"
        :key="item.key"
        class="plugin_scroll-solution-toast"
      >
        <div
          :class="[
            'scroll-solution-row',
            { 'scroll-solution-row-change': item.data.previousResult },
          ]"
        >
          <div class="score">{{ item.data.score.value }}</div>
          <div class="user">
            <span class="user-name">{{ resolveDisplayText(item.data.user.name) }}</span>
            <span v-if="item.data.user.organization" class="user-second-name">
              {{ resolveDisplayText(item.data.user.organization) }}
            </span>
          </div>
          <div class="problem">{{ item.data.problem.alias }}</div>
          <template v-if="item.data.previousResult">
            <div :class="resultClass(item.data.previousResult)">
              <span>{{ item.data.previousResult }}</span>
            </div>
            <div class="result-change">→</div>
            <div :class="resultClass(item.data.result)">
              <span>{{ item.data.result }}</span>
            </div>
          </template>
          <template v-else>
            <div :class="resultClass(item.data.result)">
              <span>{{ item.data.result }}</span>
            </div>
          </template>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { resolveText } from '@algoux/standard-ranklist-utils';
import type * as srk from '@algoux/standard-ranklist';
import type { LiveScrollSolutionItem } from '@/services/ranklist-api/live-contest-types';
import {
  SCROLL_SOLUTION_LEFT_OFFSET,
  createScrollSolutionState,
  SCROLL_SOLUTION_WIDTH,
} from './scroll-solution-state';

export type ScrollSolutionDataItem = LiveScrollSolutionItem;

const props = withDefaults(defineProps<{ containerMaxHeight?: number }>(), {
  containerMaxHeight: 0,
});

const ITEM_HEIGHT = 45;
const POP_LIMIT = 20;
const scrollSolutionWidth = `${SCROLL_SOLUTION_WIDTH}px`;
const scrollSolutionLeft = `${SCROLL_SOLUTION_LEFT_OFFSET}px`;

const popLimit = computed(() => {
  if (!props.containerMaxHeight) {
    return POP_LIMIT;
  }
  return Math.max(1, Math.floor(props.containerMaxHeight / ITEM_HEIGHT));
});

const state = createScrollSolutionState({
  getPopLimit: () => popLimit.value,
  scheduler: {
    setTimeout: (callback, delay) => window.setTimeout(callback, delay),
    clearTimeout: (timer) => window.clearTimeout(timer),
  },
});
const visibleItems = state.visibleItems;
const pushSolutions = state.pushSolutions;
const resetSolutions = state.resetSolutions;

function resultClass(result: LiveScrollSolutionItem['result']) {
  return [
    'result',
    result === 'FB' ? 'result-fb' : '',
    result === 'AC' ? 'result-ac' : '',
    result !== 'FB' && result !== 'AC' && result !== '?' ? 'result-rj' : '',
    result === '?' ? 'result-fz' : '',
  ];
}

function resolveDisplayText(text: srk.Text) {
  return resolveText(text);
}

onMounted(() => {
  state.start();
});

onBeforeUnmount(() => {
  state.stop();
});

defineExpose({
  pushSolutions,
  resetSolutions,
});
</script>

<style scoped>
.plugin_scroll-solution-container {
  --bg: #fff;
  --text: #333;
  --color-user-second-name: #828282;
  --color-ac-bg: #4fb24f;
  --color-rj-bg: #e23a36;
  --color-result-text: #fff;
  --color-item-border: hsl(var(--background));

  position: fixed;
  bottom: 0;
  left: v-bind(scrollSolutionLeft);
  z-index: 50;
  width: v-bind(scrollSolutionWidth);
  padding: 0;
  color: var(--text);
  pointer-events: none;
}

:global(html.dark .plugin_scroll-solution-container) {
  --bg: #272727;
  --text: rgb(223, 223, 233);
  --color-user-second-name: #a5a5a5;
  --color-ac-bg: #1f841f;
  --color-rj-bg: #a02a27;
  --color-result-text: var(--text);
}

.plugin_scroll-solution-toast {
  margin: 0;
  min-height: initial;
  padding: 0;
  border-radius: 0;
  font-family: "Helvetica Neue", Helvetica, "Microsoft Yahei", Arial, sans-serif;
}

.scroll-solution-row {
  display: flex;
  box-sizing: border-box;
  position: relative;
  width: 250px;
  align-items: center;
  height: 45px;
  background-color: var(--bg);
}

.scroll-solution-row-change {
  width: 320px;
}

.plugin_scroll-solution-toast + .plugin_scroll-solution-toast .scroll-solution-row::before {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 1px;
  background-color: var(--color-item-border);
  content: "";
  pointer-events: none;
}

.score {
  flex: 0 0 40px;
  width: 40px;
  text-align: center;
}

.user {
  min-width: 0;
  flex: 1 1 0;
  height: 45px;
  overflow: hidden;
}

.user span {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.user-name {
  font-size: 14px;
}

.user-second-name {
  color: var(--color-user-second-name);
  font-size: 11px;
}

.problem {
  flex: 0 0 40px;
  width: 40px;
  text-align: center;
}

.result {
  display: flex;
  flex: 0 0 45px;
  width: 45px;
  align-self: stretch;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.result-change {
  display: flex;
  flex: 0 0 25px;
  width: 25px;
  align-self: stretch;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.result-fb {
  color: #fff;
  background-color: #4fb24f;
  background-image: linear-gradient(-45deg, #4fb24f, #099209, #15d015, #14cc14);
  background-size: 400% 400%;
  animation: bg-gradient-animation 6s infinite linear;
}

.result-fb span {
  animation: blink 1.5s infinite linear;
}

.result-ac {
  color: var(--color-result-text);
  background-color: var(--color-ac-bg);
}

.result-rj {
  color: var(--color-result-text);
  background-color: var(--color-rj-bg);
}

.scroll-solution-enter-active,
.scroll-solution-leave-active {
  transition: all 0.2s ease;
}

.scroll-solution-enter-from,
.scroll-solution-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}

@keyframes bg-gradient-animation {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

@keyframes blink {
  0% {
    opacity: 1;
  }

  25% {
    opacity: 0.9;
  }

  50% {
    opacity: 0.3;
  }

  75% {
    opacity: 0.9;
  }

  100% {
    opacity: 1;
  }
}
</style>
