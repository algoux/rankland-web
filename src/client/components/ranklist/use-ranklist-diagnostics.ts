import { onBeforeUnmount, onMounted, shallowRef, toRaw, watch } from 'vue';
import { diagnoseRanklist } from '@algoux/standard-ranklist-utils';
import type * as srk from '@algoux/standard-ranklist';
import type { RanklistDiagnostics } from '@algoux/standard-ranklist-utils';
import type { RanklistDiagnosticsResponse } from '@/utils/ranklist-diagnostics.worker';
import { calculateRanklistQualityScore } from './ranklist-diagnostics-score';

type ReadyState = { status: 'ready'; diagnostics: RanklistDiagnostics; score: number };
type QualityState = { status: 'pending' } | { status: 'error' } | ReadyState;
// A weak key cannot keep a closed contest alive. Display changes and replay use
// the same source object and do not repeat diagnostics.
const cache = new WeakMap<srk.Ranklist, ReadyState>();

export function useRanklistDiagnostics(getData: () => srk.Ranklist) {
  const state = shallowRef<QualityState>({ status: 'pending' });
  let mounted = false;
  let generation = 0;
  let worker: Worker | null = null;
  let frame = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let idle: number | undefined;

  function cleanup() {
    worker?.terminate();
    worker = null;
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    if (idle !== undefined) window.cancelIdleCallback?.(idle);
    idle = undefined;
  }

  function update() {
    if (!mounted) return;
    cleanup();
    const request = ++generation;
    const data = toRaw(getData());
    const cached = cache.get(data);
    state.value = cached || { status: 'pending' };
    if (cached) return;
    const current = () => mounted && request === generation;
    const finish = (response: RanklistDiagnosticsResponse) => {
      if (!current()) return;
      cleanup();
      if ('error' in response) {
        state.value = { status: 'error' };
        console.warn('[RanklistQualityAction] failed to diagnose ranklist:', response.error);
        return;
      }
      const ready: ReadyState = {
        status: 'ready', diagnostics: response.diagnostics,
        score: calculateRanklistQualityScore(response.diagnostics),
      };
      cache.set(data, ready);
      state.value = ready;
    };
    const fallback = () => {
      if (!current()) return;
      worker?.terminate();
      worker = null;
      // Old/locked-down browsers keep the feature. This is scheduled outside
      // the navigation render, but the library's monolithic diagnostic remains
      // synchronous in this exceptional path.
      timer = setTimeout(() => {
        if (!current()) return;
        try { finish({ diagnostics: diagnoseRanklist(data) }); }
        catch (error) { finish({ error: String(error) }); }
      }, 0);
    };
    const run = () => {
      if (!current()) return;
      if (typeof Worker === 'undefined') { fallback(); return; }
      try {
        worker = new Worker(new URL('../../utils/ranklist-diagnostics.worker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = (event: MessageEvent<RanklistDiagnosticsResponse>) => finish(event.data);
        worker.onerror = fallback;
        try { worker.postMessage(data); }
        catch { worker.postMessage(JSON.parse(JSON.stringify(data))); }
      } catch { fallback(); }
    };
    // Protect the first table paint and allow urgent input to run before cloning
    // the source into a short-lived Worker. The timeout prevents starvation.
    frame = requestAnimationFrame(() => {
      if (window.requestIdleCallback) idle = window.requestIdleCallback(run, { timeout: 1000 });
      else timer = setTimeout(run, 0);
    });
  }

  watch(getData, update);
  onMounted(() => { mounted = true; update(); });
  onBeforeUnmount(() => { mounted = false; generation++; cleanup(); });
  return state;
}
