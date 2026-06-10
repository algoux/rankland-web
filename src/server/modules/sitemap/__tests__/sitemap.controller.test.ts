import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import HttpException from '@server/exceptions/http.exception';
import SitemapController from '../sitemap.controller';

function createCtx(params: Record<string, string> = {}) {
  const headers: Record<string, string> = {};
  return {
    headers,
    params,
    set(nameOrHeaders: string | Record<string, string>, value?: string) {
      if (typeof nameOrHeaders === 'string') {
        headers[nameOrHeaders] = value || '';
        return;
      }
      Object.assign(headers, nameOrHeaders);
    },
  } as any;
}

describe('SitemapController', () => {
  it('returns sitemap index XML without the JSON response envelope', async () => {
    const ctx = createCtx();
    const service = {
      getSitemapIndexXml: vi.fn(async () => '<sitemapindex />\n'),
    };
    const controller = new SitemapController(ctx, service as any);

    await expect(controller.getSitemapIndex()).resolves.toBe('<sitemapindex />\n');

    expect(ctx.headers['Content-Type']).toBe('application/xml; charset=utf-8');
    expect(service.getSitemapIndexXml).toHaveBeenCalledTimes(1);
  });

  it('returns a ranklist text sitemap page without the JSON response envelope', async () => {
    const ctx = createCtx({ page: '1' });
    const service = {
      getRanklistSitemapText: vi.fn(async () => 'https://rl.algoux.cn/ranklist/a\n'),
    };
    const controller = new SitemapController(ctx, service as any);

    await expect(controller.getRanklistSitemapPage()).resolves.toBe('https://rl.algoux.cn/ranklist/a\n');

    expect(ctx.headers['Content-Type']).toBe('text/plain; charset=utf-8');
    expect(service.getRanklistSitemapText).toHaveBeenCalledWith(1);
  });

  it('throws 404 for malformed ranklist sitemap page params', async () => {
    const ctx = createCtx({ page: 'abc' });
    const controller = new SitemapController(ctx, {} as any);

    await expect(controller.getRanklistSitemapPage()).rejects.toMatchObject<HttpException>({ code: 404 });
  });
});
