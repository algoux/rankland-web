<template>
  <aside class="live-scroll-solution" data-id="live-scroll-solution">
    <div data-id="live-scroll-solution-status" class="live-scroll-solution-status">{{ status }}</div>
    <ul class="live-scroll-solution-list">
      <li
        v-for="(solution, index) in solutions"
        :key="`${solution.user.id}-${solution.problemAlias}-${index}`"
        class="live-scroll-solution-item"
      >
        <span class="live-scroll-solution-score">{{ solution.solved }}</span>
        <span class="live-scroll-solution-user">{{ solution.user.name }}</span>
        <span class="live-scroll-solution-problem">{{ solution.problemAlias }}</span>
        <span class="live-scroll-solution-result">{{ solution.result }}</span>
      </li>
    </ul>
  </aside>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';

export interface LiveScrollSolutionItem {
  problemAlias: string;
  result: string;
  solved: number;
  user: {
    id: string;
    name: string;
    organization?: string;
  };
}

export default defineComponent({
  name: 'LiveScrollSolution',
  props: {
    status: {
      type: String,
      required: true,
    },
    solutions: {
      type: Array as PropType<LiveScrollSolutionItem[]>,
      required: true,
    },
  },
});
</script>

<style lang="less" scoped>
.live-scroll-solution {
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: #f8fafc;
}

.live-scroll-solution-status {
  color: #475569;
  font-size: 13px;
}

.live-scroll-solution-list {
  display: grid;
  gap: 6px;
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}

.live-scroll-solution-item {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 48px 48px;
  gap: 8px;
  align-items: center;
  font-size: 13px;
}

.live-scroll-solution-score,
.live-scroll-solution-problem,
.live-scroll-solution-result {
  font-weight: 600;
}

.live-scroll-solution-user {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
