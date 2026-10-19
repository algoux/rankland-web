import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRenderer, createSSRApp, nextTick, ref, watchEffect, type ComputedRef } from 'vue';
import { renderToString } from '@vue/server-renderer';
import type * as srk from '@algoux/standard-ranklist';
import fixture from '../../../tests/fixtures/ccpc26.srk.json';
import { useCCPC26Mode } from './use-ccpc26-mode';

const START = Date.parse(fixture.contest.startAt);
const MINUTE = 60_000;
const FREEZE = 8 * MINUTE;
const cleanup: Array<() => void> = [];

// The composable only needs Vue's lifecycle; a null-rendering host avoids a DOM dependency.
const renderer = createRenderer<Record<string, unknown>, Record<string, unknown>>({
  createElement: () => ({}),
  createText: () => ({}),
  createComment: () => ({}),
  insert: () => {},
  remove: () => {},
  parentNode: () => null,
  nextSibling: () => null,
  patchProp: () => {},
  setText: () => {},
  setElementText: () => {},
});

function mountMode(options: { isLive?: boolean; timeTravelTime?: number | null; afterSetup?: () => void } = {}) {
  const ranklist = ref<srk.Ranklist>(JSON.parse(JSON.stringify(fixture)));
  const isLive = ref(options.isLive ?? true);
  const timeTravelTime = ref<number | null>(options.timeTravelTime ?? null);
  let enabled!: ComputedRef<boolean>;
  let beforeMount!: boolean;
  const app = renderer.createApp({
    setup() {
      enabled = useCCPC26Mode(
        () => ranklist.value,
        () => isLive.value,
        () => timeTravelTime.value,
      );
      beforeMount = enabled.value;
      options.afterSetup?.();
      return () => null;
    },
  });
  app.mount({});
  cleanup.push(() => app.unmount());
  return { ranklist, isLive, timeTravelTime, enabled, beforeMount };
}

describe('useCCPC26Mode', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
    vi.stubGlobal('window', new EventTarget());
    vi.stubGlobal('document', new EventTarget());
  });

  afterEach(() => {
    cleanup.splice(0).forEach((dispose) => dispose());
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('switches at the precise Live freeze boundary without a ranklist update', async () => {
    const mode = mountMode();
    expect(mode.enabled.value).toBe(true);
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(FREEZE - 1);
    expect(mode.enabled.value).toBe(true);
    await vi.advanceTimersByTimeAsync(1);
    expect(mode.enabled.value).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rechecks a freeze crossed between setup and mounted', () => {
    const mode = mountMode({ afterSetup: () => vi.setSystemTime(START + FREEZE) });
    expect(mode.beforeMount).toBe(true);
    expect(mode.enabled.value).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not install Live timers in static, ordinary ICPC, or replay modes', () => {
    const mode = mountMode({ isLive: false });
    expect(mode.enabled.value).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    mode.timeTravelTime.value = 0;
    expect(mode.enabled.value).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    mode.isLive.value = true;
    expect(vi.getTimerCount()).toBe(0);
    mode.timeTravelTime.value = null;
    expect(vi.getTimerCount()).toBe(1);
    mode.ranklist.value.sorter = { algorithm: 'ICPC', config: {} };
    expect(mode.enabled.value).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('gives reverse replay priority and reads the current clock when replay exits', () => {
    const mode = mountMode();
    mode.timeTravelTime.value = 0;
    vi.setSystemTime(START + FREEZE);
    expect(mode.enabled.value).toBe(true);
    mode.timeTravelTime.value = FREEZE;
    expect(mode.enabled.value).toBe(false);
    mode.timeTravelTime.value = MINUTE;
    expect(mode.enabled.value).toBe(true);
    mode.timeTravelTime.value = null;
    expect(mode.enabled.value).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rechecks the local clock on focus and visibility changes', () => {
    const mode = mountMode();
    vi.setSystemTime(START + FREEZE);
    window.dispatchEvent(new Event('focus'));
    expect(mode.enabled.value).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    vi.setSystemTime(START + MINUTE);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(mode.enabled.value).toBe(true);
    expect(vi.getTimerCount()).toBe(1);
  });

  it('keeps downstream computations stable when a clock refresh does not change the mode', async () => {
    const mode = mountMode();
    const consumeMode = vi.fn();
    cleanup.push(watchEffect(() => consumeMode(mode.enabled.value)));
    expect(consumeMode).toHaveBeenCalledTimes(1);
    vi.setSystemTime(START + MINUTE);
    window.dispatchEvent(new Event('focus'));
    await nextTick();
    expect(consumeMode).toHaveBeenCalledTimes(1);
    vi.setSystemTime(START + FREEZE);
    document.dispatchEvent(new Event('visibilitychange'));
    await nextTick();
    expect(consumeMode).toHaveBeenCalledTimes(2);
    expect(consumeMode).toHaveBeenLastCalledWith(false);
  });

  it('replaces the scheduled boundary when contest timing changes', async () => {
    const mode = mountMode();
    mode.ranklist.value.contest.frozenDuration = [3, 'min'];
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(7 * MINUTE);
    expect(mode.enabled.value).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('uses contest end for a Live ranklist without a freeze period', async () => {
    const mode = mountMode();
    delete mode.ranklist.value.contest.frozenDuration;
    await vi.advanceTimersByTimeAsync(10 * MINUTE - 1);
    expect(mode.enabled.value).toBe(true);
    await vi.advanceTimersByTimeAsync(1);
    expect(mode.enabled.value).toBe(false);
  });

  it('clamps a long timeout and then schedules the remaining interval', async () => {
    const mode = mountMode();
    const maxDelay = 2 ** 31 - 1;
    mode.ranklist.value.contest.duration = [maxDelay + 100, 'ms'];
    delete mode.ranklist.value.contest.frozenDuration;
    await vi.advanceTimersByTimeAsync(maxDelay);
    expect(mode.enabled.value).toBe(true);
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(100);
    expect(mode.enabled.value).toBe(false);
  });

  it('cleans up its timer and event listeners on unmount', () => {
    const mode = mountMode();
    cleanup.pop()!();
    expect(vi.getTimerCount()).toBe(0);
    vi.setSystemTime(START + FREEZE);
    window.dispatchEvent(new Event('focus'));
    document.dispatchEvent(new Event('visibilitychange'));
    expect(mode.enabled.value).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not install timers or browser listeners during SSR', async () => {
    vi.unstubAllGlobals();
    const ranklist: srk.Ranklist = JSON.parse(JSON.stringify(fixture));
    const app = createSSRApp({
      setup() {
        const enabled = useCCPC26Mode(
          () => ranklist,
          () => true,
          () => null,
        );
        return () => String(enabled.value);
      },
    });
    expect(await renderToString(app)).toBe('true');
    expect(vi.getTimerCount()).toBe(0);
  });
});
