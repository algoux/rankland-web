import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRenderer, h, nextTick, shallowRef } from 'vue';
import type * as srk from '@algoux/standard-ranklist';
import fixture from '../../../../tests/fixtures/ranklist.srk.json';
import { diagnoseInWorker } from '@/utils/ranklist-diagnostics.worker';
import { useRanklistDiagnostics } from './use-ranklist-diagnostics';

const renderer = createRenderer<any, any>({
  createElement: () => ({}), createText: () => ({}), createComment: () => ({}),
  insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {},
  parentNode: () => null, nextSibling: () => null,
});

describe('ranklist diagnostics lifecycle', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('discards stale replies, terminates finished workers, caches only the matching source and cleans up unmount', async () => {
    const jobs: (() => void)[] = [];
    const workers: any[] = [];
    vi.stubGlobal('requestAnimationFrame', (fn: () => void) => { jobs.push(fn); return 1; });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('window', {
      requestIdleCallback: (fn: () => void) => { jobs.push(fn); return 2; },
      cancelIdleCallback: vi.fn(),
    });
    vi.stubGlobal('Worker', class {
      onmessage: any;
      onerror: any;
      terminate = vi.fn();
      postMessage = vi.fn();
      constructor() { workers.push(this); }
    });
    const first = JSON.parse(JSON.stringify(fixture)) as srk.Ranklist;
    const second = { ...first, contest: { ...first.contest, title: 'Second' } };
    const data = shallowRef(first);
    let state!: ReturnType<typeof useRanklistDiagnostics>;
    const app = renderer.createApp({ setup() {
      state = useRanklistDiagnostics(() => data.value);
      return () => h('div');
    } });
    const flush = () => { while (jobs.length) jobs.shift()!(); };
    app.mount({});
    flush();
    expect(workers).toHaveLength(1);
    expect(state.value.status).toBe('pending');
    data.value = second;
    await nextTick();
    flush();
    expect(workers[0].terminate).toHaveBeenCalled();
    workers[0].onmessage({ data: diagnoseInWorker(first) });
    expect(state.value.status).toBe('pending');
    workers[1].onmessage({ data: diagnoseInWorker(second) });
    expect(state.value.status).toBe('ready');
    expect(workers[1].terminate).toHaveBeenCalled();
    data.value = first;
    await nextTick(); flush();
    expect(workers).toHaveLength(3);
    workers[2].onmessage({ data: diagnoseInWorker(first) });
    data.value = second;
    await nextTick(); flush();
    expect(state.value.status).toBe('ready');
    expect(workers).toHaveLength(3);
    data.value = { ...first };
    await nextTick(); flush();
    app.unmount();
    expect(workers[3].terminate).toHaveBeenCalled();
    const lastState = state.value;
    workers[3].onmessage({ data: diagnoseInWorker(first) });
    expect(state.value).toBe(lastState);
  });
});
