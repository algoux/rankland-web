import { computed, onBeforeUnmount, onMounted, ref, watch, type ComputedRef } from 'vue';
import type * as srk from '@algoux/standard-ranklist';
import { formatTimeDuration } from '@algoux/standard-ranklist-utils';
import { isCCPC26Ranklist, shouldEnableCCPC26 } from '@/utils/ccpc26.util';

/** Match ProgressBar's local clock without updating the table on every clock tick. */
export function useCCPC26Mode(
  getRanklist: () => srk.Ranklist,
  getIsLive: () => boolean,
  getTimeTravelTime: () => number | null,
): ComputedRef<boolean> {
  const now = ref(Date.now());
  const enabled = computed(() =>
    shouldEnableCCPC26(getRanklist(), {
      isLive: getIsLive(),
      timeTravelTime: getTimeTravelTime(),
      now: now.value,
    }),
  );
  const watchLiveBoundary = computed(
    () => getIsLive() && getTimeTravelTime() === null && isCCPC26Ranklist(getRanklist()),
  );
  const frozenAt = computed(() => {
    const { contest } = getRanklist();
    return (
      Date.parse(contest.startAt) +
      formatTimeDuration(contest.duration) -
      (contest.frozenDuration ? formatTimeDuration(contest.frozenDuration) : 0)
    );
  });
  let mounted = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let removeListeners: (() => void) | undefined;

  function refresh() {
    clearTimeout(timer);
    timer = undefined;
    now.value = Date.now();
    const remaining = frozenAt.value - now.value;
    if (watchLiveBoundary.value && Number.isFinite(remaining) && remaining > 0) {
      // Browser timeouts clamp delays above this limit; long contests recheck the clock.
      timer = setTimeout(refresh, Math.min(remaining, 2 ** 31 - 1));
    }
  }

  function synchronize() {
    clearTimeout(timer);
    timer = undefined;
    removeListeners?.();
    removeListeners = undefined;
    if (!mounted) return;
    now.value = Date.now();
    if (!watchLiveBoundary.value) return;
    refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    removeListeners = () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }

  watch([watchLiveBoundary, frozenAt], synchronize, { flush: 'sync' });
  onMounted(() => {
    mounted = true;
    // Re-read now in case the freeze boundary passed between setup and mounting.
    synchronize();
  });
  onBeforeUnmount(() => {
    mounted = false;
    clearTimeout(timer);
    removeListeners?.();
  });
  return enabled;
}
