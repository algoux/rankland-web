/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */

// forked from vite-ssr `src/dev/server.ts`

import { Inject, Provide } from 'bwcx-core';
import type { RequestContext } from 'bwcx-ljsm';
import type { ViteDevServer, InlineConfig, ServerOptions } from 'vite';
import type { SsrOptions } from 'vite-ssr/dev';
import { getEntryPoint, getPluginOptions } from 'vite-ssr/config';
import type { ViteSsrPluginOptions } from 'vite-ssr/config';
import type { WriteResponse } from 'vite-ssr/utils/types';
import c2k from 'koa-connect';
import path from 'path';
import { promises as fs } from 'fs';
import chalk from 'chalk';
import { IPageRenderer, type PageRenderOptions } from './page-renderer.interface';
import {
  RedisSsrPageCache,
  getSsrPageCacheKey,
  logSsrPageCacheHit,
  sanitizeSsrPageCacheHeaders,
  shouldWriteSsrPageCache,
  toSsrPageCachePayload,
  type SsrPageCachePayload,
  type SsrPageRenderResult,
} from './ssr-page-cache';

@Provide({ id: IPageRenderer, when: 'development' })
export default class PageRendererDev implements IPageRenderer {
  private server: ViteDevServer;
  private pluginOptions: ViteSsrPluginOptions;
  private options: SsrOptions;

  public constructor(
    @Inject(RedisSsrPageCache)
    private readonly cache?: RedisSsrPageCache,
  ) {}

  public async init() {
    if (!this.server) {
      this.server = await this.createSsrServer({
        appType: 'custom',
        server: { middlewareMode: true },
        // @ts-ignore
        ssr: 'src/client/entry-server.ts',
      });
    }
    this.pluginOptions = getPluginOptions(this.server.config);
    // @ts-ignore
    this.options = {
      ...this.server.config.inlineConfig, // CLI flags
      ...this.pluginOptions,
    };
    return c2k(this.server.middlewares);
  }

  public async render(mode: 'ssr' | 'csr', ctx: RequestContext, options: PageRenderOptions = {}) {
    if (mode === 'ssr') {
      return this.handleSsrRequest(ctx, options);
    }
    return this.getIndexTemplate(ctx.originalUrl);
  }

  public async destory() {
    await this.server?.close();
  }

  private async createSsrServer(options: InlineConfig & { polyfills?: boolean } = {}) {
    const createViteServer = await import('vite').then((m) => m.createServer);
    const serverOptions = options.server || ({ ...options } as ServerOptions);
    const viteServer = await createViteServer({
      ...options,
      server: serverOptions,
    });

    if (options.polyfills !== false) {
      if (!globalThis.fetch) {
        const fetch = await import('node-fetch');
        // @ts-ignore
        globalThis.fetch = fetch.default || fetch;
      }
    }

    const isMiddlewareMode =
      // @ts-ignore
      options?.middlewareMode || options?.server?.middlewareMode;

    const printServerInfo = (server: ViteDevServer) => {
      const { info } = server.config.logger;

      let ssrReadyMessage = '\n -- SSR mode';

      // eslint-disable-next-line prefer-object-has-own
      if (Object.prototype.hasOwnProperty.call(server, 'printUrls')) {
        info(
          chalk.cyan(`\n  vite v${require('vite/package.json').version}`) + chalk.green(` dev server running at:\n`),
          {
            clear: !server.config.logger.hasWarned,
          },
        );

        // @ts-ignore
        server.printUrls();

        // @ts-ignore
        if (globalThis.__ssr_start_time) {
          ssrReadyMessage += chalk.cyan(
            ` ready in ${Math.round(
              // @ts-ignore
              performance.now() - globalThis.__ssr_start_time,
            )}ms.`,
          );
        }
      }

      info(`${ssrReadyMessage}\n`);
    };

    return new Proxy(viteServer, {
      get(target, prop, receiver) {
        if (prop === 'listen') {
          return async (port?: number) => {
            const server = await target.listen(port);

            if (!isMiddlewareMode) {
              printServerInfo(server);
            }

            return server;
          };
        }

        return Reflect.get(target, prop, receiver);
      },
    });
  }

  // This cannot be imported from utils due to ESM <> CJS issues
  private isRedirect({ status = 0 } = {}) {
    return status >= 300 && status < 400;
  }

  private fixEntryPoint() {
    // The plugin is redirecting to the entry-client for the SPA,
    // but we need to reach the entry-server here. This trick
    // replaces the plugin behavior in the config and seems
    // to keep the entry-client for the SPA.
    for (const alias of this.server.config.resolve.alias || []) {
      // @ts-ignore
      if (alias._viteSSR === true) {
        alias.replacement = alias.replacement.replace('client', 'server');
      }
    }
  }

  private resolve(p: string) {
    return path.resolve(this.server.config.root, p);
  }

  private async getIndexTemplate(url: string) {
    // Template should be fresh in every request
    const indexHtml = await fs.readFile(this.pluginOptions.input || this.resolve('index.html'), 'utf-8');
    return await this.server.transformIndexHtml(url, indexHtml);
  }

  private writeHead(ctx: RequestContext, params: WriteResponse = {}, capturedHeaders?: Record<string, string>) {
    let skipCache = false;
    if (params.status) {
      ctx.status = params.status;
    }

    if (params.statusText) {
      ctx.res.statusMessage = params.statusText;
    }

    if (params.headers) {
      const sanitized = sanitizeSsrPageCacheHeaders(params.headers as Record<string, string>);
      skipCache = sanitized.skipCache;
      const { headers } = sanitized;
      for (const [key, value] of Object.entries(headers)) {
        ctx.set(key, value);
        if (capturedHeaders) {
          capturedHeaders[key] = value;
        }
      }
    }
    return skipCache;
  }

  private async handleSsrRequest(ctx: RequestContext, options: PageRenderOptions = {}): Promise<string> {
    this.fixEntryPoint();
    const url = this.resolveRequestUrl(ctx);
    const cacheKey = getSsrPageCacheKey(url);
    const cached = cacheKey ? await this.cache?.get(cacheKey) : undefined;
    if (cached) {
      logSsrPageCacheHit(url);
      this.writeCachedPayload(ctx, cached);
      return cached.html;
    }

    let template: string;

    try {
      template = await this.getIndexTemplate(ctx.originalUrl);
    } catch (error) {
      this.server.ssrFixStacktrace(error as Error);
      throw error;
    }

    try {
      const entryPoint = this.options.ssr || (await getEntryPoint(this.server.config, template));

      let resolvedEntryPoint = await this.server.ssrLoadModule(this.resolve(entryPoint));
      resolvedEntryPoint = resolvedEntryPoint.default || resolvedEntryPoint;
      const render = resolvedEntryPoint.render || resolvedEntryPoint;

      // This context might contain initialState provided by other plugins
      const context =
        (this.options.getRenderContext &&
          (await this.options.getRenderContext({
            url,
            request: ctx.req,
            response: ctx.res,
            resolvedEntryPoint,
          }))) ||
        {};

      // This is used by Vitedge
      const headers: Record<string, string> = {};
      let skipCache = this.writeHead(ctx, context, headers);
      if (this.isRedirect(context)) {
        return;
      }

      const result = await render(url, {
        request: ctx.req,
        response: ctx.res,
        template,
        ...context,
      });

      const status = result.status ?? options.defaultStatus ?? 200;
      skipCache = this.writeHead(ctx, {
        ...result,
        status,
      }, headers) || skipCache;
      const rendered: SsrPageRenderResult = {
        html: result.html,
        status,
        headers,
        skipCache,
      };
      if (this.isRedirect(result)) {
        return;
      }
      if (cacheKey && shouldWriteSsrPageCache(rendered)) {
        await this.cache?.set(cacheKey, toSsrPageCachePayload(rendered));
      }

      return rendered.html;
    } catch (e) {
      ctx.error?.(`Render ${ctx.url} failed, retry with csr mode. Error:`, e);
      this.server.ssrFixStacktrace(e as Error);

      // Send back template HTML to inject ViteErrorOverlay
      return template;
    }
  }

  private resolveRequestUrl(ctx: RequestContext) {
    const protocol = ctx.protocol || (ctx.headers.referer || '').split(':')[0] || 'http';
    return `${protocol}://${ctx.headers.host}${ctx.originalUrl}`;
  }

  private writeCachedPayload(ctx: RequestContext, payload: SsrPageCachePayload) {
    ctx.status = payload.status;
    ctx.set(payload.headers);
  }
}
