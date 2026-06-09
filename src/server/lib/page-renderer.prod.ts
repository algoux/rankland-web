/* eslint-disable @typescript-eslint/no-require-imports */

import { Inject, Provide } from 'bwcx-core';
import type { RequestContext } from 'bwcx-ljsm';
import type { Renderer, Rendered } from 'vite-ssr/utils/types';
import { IPageRenderer, type PageRenderOptions } from './page-renderer.interface';
import {
  RedisSsrPageCache,
  getSsrPageCacheKey,
  logSsrPageCacheHit,
  sanitizeSsrPageCacheHeaders,
  shouldWriteSsrPageCache,
  type SsrPageCachePayload,
  type SsrPageRenderResult,
  toSsrPageCachePayload,
} from './ssr-page-cache';

interface RenderProdSsrPageOptions {
  mode: 'ssr' | 'csr';
  url: string;
  request: RequestContext['req'];
  response: RequestContext['res'];
  renderPage: Renderer;
  manifest: Record<string, string[]>;
  cache?: Pick<RedisSsrPageCache, 'get' | 'set'>;
  defaultStatus?: number;
  onSsrError?: (error: unknown) => void;
}

@Provide({ id: IPageRenderer, when: 'production' })
export default class PageRendererProd implements IPageRenderer {
  private manifest: Record<string, string[]>;
  private renderPage: Renderer;

  public constructor(
    @Inject(RedisSsrPageCache)
    private readonly cache?: RedisSsrPageCache,
  ) {}

  public async init() {
    const dist = `${process.cwd()}/dist`;

    // The manifest is required for preloading assets
    this.manifest = require(`${dist}/client/ssr-manifest.json`);

    // This is the server renderer we just built
    const { default: renderPage } = require(`${dist}/server`);
    this.renderPage = renderPage;
  }

  public async render(mode: 'ssr' | 'csr', ctx: RequestContext, options: PageRenderOptions = {}) {
    ctx.info(`${mode} ${ctx.url}`);
    const url = `${ctx.protocol}://${ctx.host}${ctx.originalUrl}`;

    const res = await renderProdSsrPage({
      mode,
      url,
      request: ctx.req,
      response: ctx.res,
      renderPage: this.renderPage,
      manifest: this.manifest,
      cache: this.cache,
      defaultStatus: options.defaultStatus,
      onSsrError: (error) => {
        ctx.error?.(`Render ${ctx.url} failed, retry with csr mode. Error:`, error);
      },
    });
    ctx.status = res.status;
    ctx.set(res.headers);
    return res.html;
  }
}

export function resolveRenderedStatus(renderedStatus?: number, defaultStatus?: number) {
  return renderedStatus ?? defaultStatus ?? 200;
}

export async function renderProdSsrPage(options: RenderProdSsrPageOptions): Promise<SsrPageCachePayload> {
  const cacheKey = options.mode === 'ssr' ? getSsrPageCacheKey(options.url) : undefined;
  const cached = cacheKey ? await options.cache?.get(cacheKey) : undefined;
  if (cached) {
    logSsrPageCacheHit(options.url);
    return cached;
  }

  try {
    const rendered = await renderWithMode(options, options.mode);
    if (cacheKey && shouldWriteSsrPageCache(rendered)) {
      await options.cache?.set(cacheKey, toSsrPageCachePayload(rendered));
    }
    return toSsrPageCachePayload(rendered);
  } catch (error) {
    if (options.mode !== 'ssr') {
      throw error;
    }
    options.onSsrError?.(error);
    return toSsrPageCachePayload(await renderWithMode(options, 'csr'));
  }
}

async function renderWithMode(options: RenderProdSsrPageOptions, mode: 'ssr' | 'csr'): Promise<SsrPageRenderResult> {
  const rendered = (await options.renderPage(options.url, {
    skip: mode !== 'ssr',
    manifest: options.manifest,
    preload: true,
    request: options.request,
    response: options.response,
  })) as Rendered;
  if (!rendered) {
    throw new Error(`Render failed for ${options.url}`);
  }
  const { headers, skipCache } = sanitizeSsrPageCacheHeaders(rendered.headers || {});
  return {
    html: rendered.html,
    status: resolveRenderedStatus(rendered.status, options.defaultStatus),
    headers,
    skipCache,
  };
}
