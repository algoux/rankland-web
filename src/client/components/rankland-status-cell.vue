<template>
  <td
    v-if="status.result === 'FB'"
    :class="[commonClassName, 'srk-prest-status-block-fb']"
    @click="handleCellClick"
  >
    <template v-if="hasNumericScore">
      <span class="srk-prest-status-block-score">{{ status.score }}</span>
      <span class="srk-prest-status-block-score-details">{{ acceptedStatusDetails }}</span>
    </template>
    <template v-else>{{ acceptedStatusDetails }}</template>
  </td>
  <td
    v-else-if="status.result === 'AC'"
    :class="[commonClassName, 'srk-prest-status-block-accepted']"
    @click="handleCellClick"
  >
    <template v-if="hasNumericScore">
      <span class="srk-prest-status-block-score">{{ status.score }}</span>
      <span class="srk-prest-status-block-score-details">{{ acceptedStatusDetails }}</span>
    </template>
    <template v-else>{{ acceptedStatusDetails }}</template>
  </td>
  <td
    v-else-if="status.result === '?'"
    :class="[commonClassName, 'srk-prest-status-block-frozen']"
    @click="handleCellClick"
  >
    {{ status.tries }}
  </td>
  <td
    v-else-if="status.result === 'RJ'"
    :class="[commonClassName, 'srk-prest-status-block-failed']"
    @click="handleCellClick"
  >
    {{ status.tries }}
  </td>
  <td v-else>{{ problemKey }}</td>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type * as srk from '@algoux/standard-ranklist';
import { getAcceptedStatusDetails } from '@algoux/standard-ranklist-renderer-component-core';
import { resolveText } from '@algoux/standard-ranklist-utils';

export default defineComponent({
  name: 'RanklandStatusCell',
  props: {
    status: {
      type: Object as PropType<srk.RankProblemStatus>,
      required: true,
    },
    problem: {
      type: Object as PropType<srk.Problem | undefined>,
      default: undefined,
    },
    problemIndex: {
      type: Number,
      required: true,
    },
    onCellClick: {
      type: Function as PropType<(event?: MouseEvent) => void>,
      default: undefined,
    },
  },
  computed: {
    solutions(): srk.Solution[] {
      return this.status.solutions || [];
    },
    isClickable(): boolean {
      return this.solutions.length > 0 && !!this.onCellClick;
    },
    commonClassName(): Array<string | Record<string, boolean>> {
      return [
        'srk-prest-status-block',
        'srk--text-center',
        'srk--nowrap',
        { 'srk--cursor-pointer': this.isClickable },
      ];
    },
    acceptedStatusDetails(): string {
      return getAcceptedStatusDetails(this.status);
    },
    hasNumericScore(): boolean {
      return typeof this.status.score === 'number';
    },
    problemKey(): string | number {
      return this.problem?.alias || resolveText(this.problem?.title) || this.problemIndex;
    },
  },
  methods: {
    handleCellClick(event: MouseEvent) {
      if (!this.isClickable) {
        return;
      }

      event.preventDefault();
      this.onCellClick?.(event);
    },
  },
});
</script>
