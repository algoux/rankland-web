import { describe, expect, it } from 'vitest';
import { ranklandRoutes } from '@common/rankland-router';

describe('ranklandRoutes', () => {
  it('defines public route paths', () => {
    expect(ranklandRoutes.home.path).toBe('/');
    expect(ranklandRoutes.search.path).toBe('/search');
    expect(ranklandRoutes.ranklist.path).toBe('/ranklist/:id');
    expect(ranklandRoutes.collection.path).toBe('/collection/:id');
    expect(ranklandRoutes.live.path).toBe('/live/:id');
    expect(ranklandRoutes.playground.path).toBe('/playground');
  });

  it('builds static routes', () => {
    expect(ranklandRoutes.home.build()).toBe('/');
    expect(ranklandRoutes.playground.build()).toBe('/playground');
  });

  it('builds encoded search route and omits empty query', () => {
    expect(ranklandRoutes.search.build({ kw: 'hello world' })).toBe('/search?kw=hello%20world');
    expect(ranklandRoutes.search.build({ kw: '' })).toBe('/search');
    expect(ranklandRoutes.search.build({})).toBe('/search');
  });

  it('builds encoded ranklist route', () => {
    expect(ranklandRoutes.ranklist.build({ id: 'abc 123' })).toBe('/ranklist/abc%20123');
  });

  it('builds collection route with optional rankId', () => {
    expect(ranklandRoutes.collection.build({ id: 'official', rankId: 'test key' })).toBe(
      '/collection/official?rankId=test%20key',
    );
    expect(ranklandRoutes.collection.build({ id: 'official space' })).toBe('/collection/official%20space');
  });

  it('builds live route', () => {
    expect(ranklandRoutes.live.build({ id: 'live id' })).toBe('/live/live%20id');
  });

  it('marks SSR metadata for public routes', () => {
    expect(ranklandRoutes.home.ssr).toBe(true);
    expect(ranklandRoutes.search.ssr).toBe(true);
    expect(ranklandRoutes.ranklist.ssr).toBe(true);
    expect(ranklandRoutes.collection.ssr).toBe(true);
    expect(ranklandRoutes.live.ssr).toBe(false);
    expect(ranklandRoutes.playground.ssr).toBe(false);
  });
});
