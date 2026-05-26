<template>
  <aside
    class="live-scroll-solution plugin_scroll-solution-container Toastify__toast-container Toastify__toast-container--bottom-left"
    data-id="live-scroll-solution"
  >
    <div data-id="live-scroll-solution-status" class="live-scroll-solution-status">{{ status }}</div>
    <ul class="live-scroll-solution-list">
      <li
        v-for="solution in solutions"
        :key="solution.key"
        class="live-scroll-solution-item Toastify__toast Toastify__toast--default Toastify__zoom-enter"
        data-id="live-scroll-solution-item"
      >
        <div class="Toastify__toast-body">
          <div class="container">
            <div class="score live-scroll-solution-score">{{ solution.solved }}</div>
            <div class="user live-scroll-solution-user">
              <span class="user-name live-scroll-solution-user-name">{{ solution.user.name }}</span>
              <span v-if="solution.user.organization" class="user-second-name live-scroll-solution-user-organization">
                {{ solution.user.organization }}
              </span>
            </div>
            <div class="problem live-scroll-solution-problem">{{ solution.problemAlias }}</div>
            <div class="result live-scroll-solution-result" :class="getResultClass(solution.result)">
              <span>{{ getResultText(solution.result) }}</span>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </aside>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import {
  getScrollSolutionResultClass,
  getScrollSolutionResultText,
  type DisplayedScrollSolutionItem,
} from './live-scroll-solution-state';

export default defineComponent({
  name: 'LiveScrollSolution',
  props: {
    status: {
      type: String,
      required: true,
    },
    solutions: {
      type: Array as PropType<DisplayedScrollSolutionItem[]>,
      required: true,
    },
  },
  methods: {
    getResultClass(result: string): string {
      return getScrollSolutionResultClass(result);
    },
    getResultText(result: string): string {
      return getScrollSolutionResultText(result);
    },
  },
});
</script>

<style lang="less" scoped>
.live-scroll-solution {
  --bg: #fff;
  --text: #333;
  --color-user-second-name: #828282;
  --color-ac-bg: #4fb24f;
  --color-rj-bg: #e23a36;
  --color-result-text: #fff;

  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 9999;
  width: 250px;
  padding: 0;
  box-sizing: border-box;
  color: var(--text);
  background: var(--bg);
  font-family: 'Helvetica Neue', Helvetica, 'Microsoft Yahei', Arial, sans-serif;
  user-select: none;

  @media screen and (prefers-color-scheme: dark) {
    --bg: #272727;
    --text: rgb(223, 223, 233);
    --color-user-second-name: #a5a5a5;
    --color-ac-bg: #1f841f;
    --color-rj-bg: #a02a27;
    --color-result-text: var(--text);
  }
}

.live-scroll-solution-status {
  display: none;
}

.live-scroll-solution-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.live-scroll-solution-item {
  position: relative;
  display: flex;
  height: 45px;
  min-height: initial;
  max-height: 800px;
  margin-bottom: 0;
  padding: 0;
  overflow: hidden;
  border-radius: 0;
  box-sizing: border-box;
  color: var(--text);
  background: var(--bg);
  cursor: default;
  direction: ltr;
  font-size: 14px;
}

.Toastify__toast-body,
.container {
  width: 100%;
}

.Toastify__toast-body {
  flex: 1 1 auto;
  margin: auto 0;
}

.container {
  display: flex;
  align-items: center;
  height: 45px;
}

.live-scroll-solution-score {
  width: 40px;
  text-align: center;
}

.live-scroll-solution-user {
  width: 125px;
  height: 45px;
  overflow: hidden;
}

.live-scroll-solution-user-name,
.live-scroll-solution-user-organization {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.live-scroll-solution-user-organization {
  color: var(--color-user-second-name);
  font-size: 11px;
}

.live-scroll-solution-problem {
  width: 40px;
  text-align: center;
}

.live-scroll-solution-result {
  display: flex;
  align-self: stretch;
  align-items: center;
  justify-content: center;
  width: 45px;
  text-align: center;
}

.result-fb {
  color: #fff;
  background-color: #4fb24f;
  background-image: linear-gradient(-45deg, #4fb24f, #099209, #15d015, #14cc14);
  background-size: 400% 400%;
  animation: live-scroll-solution-bg-gradient 6s infinite linear;
}

.result-fb span {
  animation: live-scroll-solution-blink 1.5s infinite linear;
}

.result-ac {
  color: var(--color-result-text);
  background-color: var(--color-ac-bg);
}

.result-rj {
  color: var(--color-result-text);
  background-color: var(--color-rj-bg);
}

@keyframes live-scroll-solution-bg-gradient {
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

@keyframes live-scroll-solution-blink {
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

@media (max-width: 767px) {
  .live-scroll-solution {
    position: static;
    width: 100%;
    margin-bottom: 16px;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
  }
}
</style>

<style lang="less">
@keyframes Toastify__zoomIn {
  from {
    opacity: 0;
    transform: scale3d(0.3, 0.3, 0.3);
  }

  50% {
    opacity: 1;
  }
}

@keyframes Toastify__zoomOut {
  from {
    opacity: 1;
  }

  50% {
    opacity: 0;
    transform: scale3d(0.3, 0.3, 0.3);
  }

  to {
    opacity: 0;
  }
}

.live-scroll-solution-item.Toastify__zoom-enter {
  animation-name: Toastify__zoomIn;
  animation-duration: 750ms;
  animation-fill-mode: forwards;
}
</style>
