import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import RssController from '../rss.controller';

function createCtx() {
  const headers: Record<string, string> = {};
  return {
    headers,
    set(nameOrHeaders: string | Record<string, string>, value?: string) {
      if (typeof nameOrHeaders === 'string') {
        headers[nameOrHeaders] = value || '';
        return;
      }
      Object.assign(headers, nameOrHeaders);
    },
  } as any;
}

describe('RssController', () => {
  it('returns RSS XML without the JSON response envelope', async () => {
    const ctx = createCtx();
    const service = {
      getRanklistRssXml: vi.fn(async () => '<rss />\n'),
    };
    const controller = new RssController(ctx, service as any);

    await expect(controller.getRanklistRss()).resolves.toBe('<rss />\n');

    expect(ctx.headers['Content-Type']).toBe('application/rss+xml; charset=utf-8');
    expect(service.getRanklistRssXml).toHaveBeenCalledTimes(1);
  });
});
