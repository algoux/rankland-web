<template>
  <aside class="live-scroll-solution" data-id="live-scroll-solution">
    <div data-id="live-scroll-solution-status" class="live-scroll-solution-status">{{ status }}</div>
    <ul class="live-scroll-solution-list">
      <li
        v-for="solution in solutions"
        :key="solution.key"
        class="live-scroll-solution-item"
        data-id="live-scroll-solution-item"
      >
        <span class="live-scroll-solution-score">{{ solution.solved }}</span>
        <span class="live-scroll-solution-user">
          <span class="live-scroll-solution-user-name">{{ solution.user.name }}</span>
          <span v-if="solution.user.organization" class="live-scroll-solution-user-organization">
            {{ solution.user.organization }}
          </span>
        </span>
        <span class="live-scroll-solution-problem">{{ solution.problemAlias }}</span>
        <span class="live-scroll-solution-result" :class="getResultClass(solution.result)">
          <span>{{ getResultText(solution.result) }}</span>
        </span>
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
  z-index: 20;
  width: 250px;
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
  padding: 3px 6px;
  color: var(--color-user-second-name);
  font-size: 11px;
}

.live-scroll-solution-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.live-scroll-solution-item {
  display: flex;
  align-items: center;
  height: 45px;
  font-size: 14px;
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
