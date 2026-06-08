import { describe, expect, it } from 'vitest';
import Home from './home/home.view.vue';
import Search from './search/search.view.vue';
import Ranklist from './ranklist/ranklist.view.vue';
import Collection from './collection/collection.view.vue';
import Live from './live/live.view.vue';
import Playground from './playground/playground.view.vue';
import NotFound from './fallback/not-found.view.vue';

describe('rankland migrated pages', () => {
  it('keeps the SSR page SFCs importable before route generation wires them in', () => {
    expect(Home).toBeTruthy();
    expect(Search).toBeTruthy();
    expect(Ranklist).toBeTruthy();
    expect(Collection).toBeTruthy();
    expect(Live).toBeTruthy();
    expect(Playground).toBeTruthy();
    expect(NotFound).toBeTruthy();
  });
});
