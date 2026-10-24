import { ref } from 'vue';
import type { LiveScrollSolutionItem } from '@/services/ranklist-api/live-contest-types';

export const SCROLL_SOLUTION_WIDTH = 320;
export const SCROLL_SOLUTION_LEFT_OFFSET = 50;

const POP_INTERVAL = 200;
const MIN_DELAY = 1000;
const RJ_DELAY = 10_000;
const DELAY_MAP: Record<string, number> = {
  FB: 180_000,
  AC: 20_000,
  RJ: RJ_DELAY,
  '?': 10_000,
  WA: RJ_DELAY,
  PE: RJ_DELAY,
  TLE: RJ_DELAY,
  MLE: RJ_DELAY,
  OLE: RJ_DELAY,
  RTE: RJ_DELAY,
  CE: RJ_DELAY,
  UKE: RJ_DELAY,
};

export interface VisibleScrollSolutionItem {
  key: number;
  data: LiveScrollSolutionItem;
}

interface TimerScheduler {
  setTimeout: (callback: () => void, delay: number) => number;
  clearTimeout: (timer: number) => void;
}

export function createScrollSolutionState(options: {
  getPopLimit: () => number;
  scheduler: TimerScheduler;
}) {
  const visibleItems = ref<VisibleScrollSolutionItem[]>([]);
  const queue: LiveScrollSolutionItem[] = [];
  const dismissalTimerByKey = new Map<number, number>();
  let queueHead = 0;
  let nextKey = 1;
  let popInterval = POP_INTERVAL;
  let queueTimer: number | undefined;
  let running = false;

  function pushSolutions(rows: LiveScrollSolutionItem[]) {
    for (const row of rows) {
      if (row.result === 'FB') {
        pop(row, DELAY_MAP.FB);
      } else {
        if (queueHead === queue.length) {
          queue.length = 0;
          queueHead = 0;
        }
        queue.push(row);
      }
    }
    scheduleQueue();
  }

  function pop(
    data: LiveScrollSolutionItem,
    delay = DELAY_MAP[data.result] || RJ_DELAY,
  ) {
    const key = nextKey;
    nextKey += 1;
    const popLimit = Math.max(1, options.getPopLimit());
    const nextVisibleItems = [...visibleItems.value, { key, data }].slice(-popLimit);
    const nextVisibleKeys = new Set(nextVisibleItems.map((item) => item.key));
    for (const item of visibleItems.value) {
      if (!nextVisibleKeys.has(item.key)) {
        clearDismissalTimer(item.key);
      }
    }
    visibleItems.value = nextVisibleItems;
    const timer = options.scheduler.setTimeout(() => {
      if (dismissalTimerByKey.get(key) === timer) {
        dismissalTimerByKey.delete(key);
      }
      visibleItems.value = visibleItems.value.filter((item) => item.key !== key);
    }, delay);
    dismissalTimerByKey.set(key, timer);
  }

  function popFromQueue() {
    queueTimer = undefined;
    if (!running) {
      return;
    }
    const pendingCount = queue.length - queueHead;
    if (pendingCount > 0) {
      const maxPopInterval = 100;
      const popLimit = Math.max(1, options.getPopLimit());
      const next = queue[queueHead];
      let delay = DELAY_MAP[next.result] || RJ_DELAY;

      if (pendingCount <= popLimit) {
        popInterval = maxPopInterval;
      } else {
        const scale = Math.max(1 / (pendingCount / popLimit) - 0.5, 0.01);
        delay = MIN_DELAY + delay * scale;
        popInterval = maxPopInterval * scale;
      }

      pop(next, delay);
      queueHead += 1;
      compactQueue();
    }
    scheduleQueue();
  }

  function scheduleQueue() {
    if (
      running
      && queueTimer === undefined
      && queue.length - queueHead > 0
    ) {
      queueTimer = options.scheduler.setTimeout(popFromQueue, popInterval);
    }
  }

  function clearTimers() {
    if (queueTimer !== undefined) {
      options.scheduler.clearTimeout(queueTimer);
      queueTimer = undefined;
    }
    for (const timer of dismissalTimerByKey.values()) {
      options.scheduler.clearTimeout(timer);
    }
    dismissalTimerByKey.clear();
  }

  function clearDismissalTimer(key: number) {
    const timer = dismissalTimerByKey.get(key);
    if (timer !== undefined) {
      options.scheduler.clearTimeout(timer);
      dismissalTimerByKey.delete(key);
    }
  }

  function compactQueue() {
    if (queueHead === queue.length) {
      queue.length = 0;
      queueHead = 0;
    } else if (queueHead >= 1024 && queueHead * 2 >= queue.length) {
      queue.splice(0, queueHead);
      queueHead = 0;
    }
  }

  function resetSolutions() {
    clearTimers();
    queue.length = 0;
    queueHead = 0;
    visibleItems.value = [];
    popInterval = POP_INTERVAL;
    scheduleQueue();
  }

  function start() {
    if (running) {
      return;
    }
    running = true;
    scheduleQueue();
  }

  function stop() {
    running = false;
    clearTimers();
    queue.length = 0;
    queueHead = 0;
    visibleItems.value = [];
    popInterval = POP_INTERVAL;
  }

  return {
    visibleItems,
    pushSolutions,
    resetSolutions,
    start,
    stop,
  };
}
