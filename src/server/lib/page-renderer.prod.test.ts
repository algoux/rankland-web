import { describe, expect, it, vi } from 'vitest';
import { SSR_SKIP_CACHE_HEADER } from '@common/ssr-cache';
import { SSR_REQUEST_LANGUAGES_STATE_KEY } from '@common/request-language';
import { getSsrPageCacheKey } from './ssr-page-cache';
import { renderProdSsrPage, resolveRenderedStatus } from './page-renderer.prod';

describe('PageRendererProd', () => {
  it('uses explicit default statuses only when vite-ssr did not write one', () => {
    expect(resolveRenderedStatus(undefined, 404)).toBe(404);
    expect(resolveRenderedStatus(301, 404)).toBe(301);
    expect(resolveRenderedStatus(undefined, undefined)).toBe(200);
  });

  it('returns cached SSR HTML without invoking vite-ssr', async () => {
    const renderPage = vi.fn();
    const onSuccessfulSsrRender = vi.fn();
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const cache = {
      get: vi.fn(async () => ({ html: '<main>cached</main>', status: 200, headers: { 'x-head': 'cached' } })),
      set: vi.fn(),
    };

    try {
      await expect(renderProdSsrPage({
        mode: 'ssr',
        url: 'https://rl.algoux.org/ranklist/icpc',
        renderPage,
        manifest: {},
        request: {} as any,
        response: {} as any,
        cache,
        onSuccessfulSsrRender,
      })).resolves.toEqual({
        html: '<main>cached</main>',
        status: 200,
        headers: { 'x-head': 'cached' },
      });
      expect(info).toHaveBeenCalledWith('[SSR cache] hit: https://rl.algoux.org/ranklist/icpc');
      expect(renderPage).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
      expect(onSuccessfulSsrRender).toHaveBeenCalledTimes(1);
    } finally {
      info.mockRestore();
    }
  });

  it('writes successful SSR output to cache after rendering', async () => {
    const renderPage = vi.fn(async () => ({ html: '<main>fresh</main>', headers: { 'x-head': 'fresh' } }));
    const onSuccessfulSsrRender = vi.fn();
    const cache = {
      get: vi.fn(async () => undefined),
      set: vi.fn(),
    };

    await expect(renderProdSsrPage({
      mode: 'ssr',
      url: 'https://rl.algoux.org/search?kw=icpc',
      renderPage,
      manifest: {},
      request: {} as any,
      response: {} as any,
      cache,
      onSuccessfulSsrRender,
    })).resolves.toMatchObject({
      html: '<main>fresh</main>',
      status: 200,
      headers: { 'x-head': 'fresh' },
    });
    expect(cache.set).toHaveBeenCalledWith(expect.stringMatching(/^rankland:ssr:page:/), {
      html: '<main>fresh</main>',
      status: 200,
      headers: { 'x-head': 'fresh' },
    });
    expect(onSuccessfulSsrRender).toHaveBeenCalledTimes(1);
  });

  it('uses request languages for SSR cache scope and vite-ssr initial state', async () => {
    const renderPage = vi.fn(async () => ({ html: '<main>中文</main>', headers: { 'x-head': 'fresh' } }));
    const cache = {
      get: vi.fn(async () => undefined),
      set: vi.fn(),
    };
    const url = 'https://rl.algoux.org/ranklist/icpc';
    const requestLanguages = ['zh-CN', 'zh'];

    await expect(renderProdSsrPage({
      mode: 'ssr',
      url,
      requestLanguages,
      renderPage,
      manifest: {},
      request: {} as any,
      response: {} as any,
      cache,
    })).resolves.toMatchObject({
      html: '<main>中文</main>',
      status: 200,
    });

    const cacheKey = getSsrPageCacheKey(url, { languages: requestLanguages });
    expect(cache.get).toHaveBeenCalledWith(cacheKey);
    expect(cache.set).toHaveBeenCalledWith(cacheKey, {
      html: '<main>中文</main>',
      status: 200,
      headers: { 'x-head': 'fresh' },
    });
    expect(renderPage).toHaveBeenCalledWith(url, expect.objectContaining({
      initialState: {
        [SSR_REQUEST_LANGUAGES_STATE_KEY]: requestLanguages,
      },
    }));
  });

  it('does not read or write the SSR page cache in CSR mode', async () => {
    const renderPage = vi.fn(async () => ({ html: '<main>csr</main>' }));
    const onSuccessfulSsrRender = vi.fn();
    const cache = {
      get: vi.fn(async () => ({ html: '<main>cached</main>', status: 200, headers: {} })),
      set: vi.fn(),
    };

    await expect(renderProdSsrPage({
      mode: 'csr',
      url: 'https://rl.algoux.org/ranklist/icpc?ssr=0',
      renderPage,
      manifest: {},
      request: {} as any,
      response: {} as any,
      cache,
      onSuccessfulSsrRender,
    })).resolves.toMatchObject({
      html: '<main>csr</main>',
      status: 200,
    });

    expect(cache.get).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
    expect(renderPage).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ skip: true }));
    expect(onSuccessfulSsrRender).not.toHaveBeenCalled();
  });

  it('falls back to CSR and avoids cache writes when SSR render throws', async () => {
    const renderPage = vi.fn(async (_url: string, options: { skip?: boolean }) => {
      if (!options.skip) {
        throw new Error('ssr failed');
      }
      return { html: '<main>csr</main>' };
    });
    const cache = {
      get: vi.fn(async () => undefined),
      set: vi.fn(),
    };
    const onSuccessfulSsrRender = vi.fn();

    await expect(renderProdSsrPage({
      mode: 'ssr',
      url: 'https://rl.algoux.org/ranklist/icpc',
      renderPage,
      manifest: {},
      request: {} as any,
      response: {} as any,
      cache,
      onSuccessfulSsrRender,
    })).resolves.toMatchObject({
      html: '<main>csr</main>',
      status: 200,
    });
    expect(cache.set).not.toHaveBeenCalled();
    expect(onSuccessfulSsrRender).not.toHaveBeenCalled();
  });

  it('does not cache transient load-failed SSR output and strips the internal header', async () => {
    const renderPage = vi.fn(async () => ({
      html: '<main>load failed</main>',
      headers: {
        [SSR_SKIP_CACHE_HEADER.toLowerCase()]: '1',
        'x-head': 'fresh',
      },
    }));
    const cache = {
      get: vi.fn(async () => undefined),
      set: vi.fn(),
    };
    const onSuccessfulSsrRender = vi.fn();

    await expect(renderProdSsrPage({
      mode: 'ssr',
      url: 'https://rl.algoux.org/ranklist/icpc',
      renderPage,
      manifest: {},
      request: {} as any,
      response: {} as any,
      cache,
      onSuccessfulSsrRender,
    })).resolves.toEqual({
      html: '<main>load failed</main>',
      status: 200,
      headers: { 'x-head': 'fresh' },
    });
    expect(cache.set).not.toHaveBeenCalled();
    expect(onSuccessfulSsrRender).not.toHaveBeenCalled();
  });

  it('does not write non-cacheable SSR statuses', async () => {
    const renderPage = vi.fn(async () => ({
      html: '<main>server error</main>',
      status: 500,
      headers: { 'x-head': 'fresh' },
    }));
    const cache = {
      get: vi.fn(async () => undefined),
      set: vi.fn(),
    };
    const onSuccessfulSsrRender = vi.fn();

    await expect(renderProdSsrPage({
      mode: 'ssr',
      url: 'https://rl.algoux.org/ranklist/icpc',
      renderPage,
      manifest: {},
      request: {} as any,
      response: {} as any,
      cache,
      onSuccessfulSsrRender,
    })).resolves.toEqual({
      html: '<main>server error</main>',
      status: 500,
      headers: { 'x-head': 'fresh' },
    });
    expect(cache.set).not.toHaveBeenCalled();
    expect(onSuccessfulSsrRender).not.toHaveBeenCalled();
  });
});
