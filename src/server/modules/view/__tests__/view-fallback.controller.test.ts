import 'reflect-metadata';
import http from 'http';
import { mkdtemp, mkdir, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { App, Controller, Get, type RequestContext } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import BWCX_CONTAINER_KEY from 'bwcx-ljsm/container-key';
import { RenderMethodKind } from 'bwcx-client-vue';
import mount from 'koa-mount';
import koaStatic from 'koa-static';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { listenHttpServer } from '@server/application-http-listener';
import { IPageRenderer } from '@server/lib/page-renderer.interface';
import { HtmlResponse } from '@server/response-handlers/html.response-handler';
import ApiFallbackController from '@server/modules/fallback/api-fallback.controller';
import '@server/exception-handlers/http.exception-handler';
import ViewFallbackController from '../view-fallback.controller';
import ViewService from '../view.service';

// A real SSR route proves the renderer spy is connected, and wins over the fallback.
@Controller('', { priority: -100 })
@HtmlResponse()
class KnownViewController {
  public constructor(@Inject(ViewService) private readonly service: ViewService) {}

  @Get('/')
  public home() {
    return this.service.render(RenderMethodKind.SSR);
  }
}

describe('ViewFallbackController HTTP boundary', () => {
  let app: App;
  let server: http.Server;
  let port: number;
  let staticRoot: string;
  const render = vi.fn(async (_mode: string, ctx: RequestContext, options: { defaultStatus?: number } = {}) => {
    ctx.status = options.defaultStatus ?? 200;
    return '<html><body>rendered page</body></html>';
  });

  beforeAll(async () => {
    staticRoot = await mkdtemp(path.join(tmpdir(), 'rankland-static-404-'));
    for (const directory of ['public', 'dist', 'file']) {
      await mkdir(path.join(staticRoot, directory));
      await writeFile(path.join(staticRoot, directory, 'present.txt'), `${directory} asset`);
    }

    // Use bwcx's actual route wiring/DI and the same static mounts as OurApp,
    // without starting databases, Redis or Vite.
    class FallbackTestApp extends App {
      protected async beforeWire() {
        const options = { index: false, extensions: false };
        this.instance.use(koaStatic(path.join(staticRoot, 'public'), options));
        this.instance.use(mount('/file', koaStatic(path.join(staticRoot, 'file'), options)));
        this.instance.use(mount('/dist', koaStatic(path.join(staticRoot, 'dist'), options)));
        this.instance.use((ctx, next) => {
          ctx.error = vi.fn();
          return next();
        });
      }
    }
    app = new FallbackTestApp();
    app.container.snapshot();
    app.container.unbind(BWCX_CONTAINER_KEY.Controllers);
    for (const controller of [KnownViewController, ApiFallbackController, ViewFallbackController]) {
      app.container.bind(BWCX_CONTAINER_KEY.Controllers).toConstructor(controller);
    }
    if (app.container.isBound(IPageRenderer)) app.container.unbind(IPageRenderer);
    app.container.bind(IPageRenderer).toConstantValue({ render });
    await app.bootstrap();
    server = http.createServer(app.instance.callback());
    await listenHttpServer(server, 0, '127.0.0.1');
    port = (server.address() as { port: number }).port;
  });

  beforeEach(() => {
    render.mockClear();
  });

  afterAll(async () => {
    if (server?.listening) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
        server.closeAllConnections();
      });
    }
    if (app) {
      app.clear();
      app.container.restore();
    }
    if (staticRoot) await rm(staticRoot, { recursive: true, force: true });
  });

  const unknownPaths = [
    '/1ib36s466xndgh4wik',
    '/nested/unknown?ssr=0',
    '/missing-public.txt',
    '/dist/missing.js',
    '/dist/missing.css',
    '/file/missing.bin',
  ];

  it.each(unknownPaths)('returns static HTML with 404 for GET %s without invoking the renderer', async (url) => {
    const response = await request('GET', url);

    expect(render).not.toHaveBeenCalled();
    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toMatch(/^text\/html(?:;|$)/);
    expect(response.body).toContain('<meta charset="utf-8">');
    expect(response.body).toContain('404 Not Found');
    expect(response.body).toContain('<title>Not Found | RankLand</title>');
    expect(response.body).toContain('data-id="not-found-page"');
    expect(response.body).toContain('href="/"');
    expect(response.body).not.toMatch(/<script\b|<link\b|__INITIAL_STATE__/i);
  });

  it.each(unknownPaths)('returns 404 with an empty body for HEAD %s without invoking the renderer', async (url) => {
    const response = await request('HEAD', url);

    expect(render).not.toHaveBeenCalled();
    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toMatch(/^text\/html(?:;|$)/);
    expect(response.body).toBe('');
  });

  it('returns the same static document regardless of the path or query', async () => {
    const first = await request('GET', '/unknown');
    const second = await request('GET', '/different?ssr=false&input=%3Cscript%3E');

    expect(first.status).toBe(404);
    expect(second.status).toBe(404);
    expect(second.body).toBe(first.body);
    expect(render).not.toHaveBeenCalled();
  });

  it.each([
    ['/present.txt', 'public asset'],
    ['/dist/present.txt', 'dist asset'],
    ['/file/present.txt', 'file asset'],
  ])('preserves existing static file %s', async (url, expectedBody) => {
    const response = await request('GET', url);

    expect(response.status).toBe(200);
    expect(response.body).toBe(expectedBody);
    expect(render).not.toHaveBeenCalled();
  });

  it.each(['GET', 'HEAD'])('preserves the API fallback for %s', async (method) => {
    const response = await request(method, '/api/unknown');

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toMatch(/^application\/json/);
    if (method === 'HEAD') expect(response.body).toBe('');
    else expect(JSON.parse(response.body)).toMatchObject({ success: false, code: 404 });
    expect(render).not.toHaveBeenCalled();
  });

  it('preserves SSR for a known page route before the fallback', async () => {
    const response = await request('GET', '/');

    expect(response.status).toBe(200);
    expect(response.body).toContain('rendered page');
    expect(render).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledWith('ssr', expect.any(Object), {});
  });

  function request(method: string, url: string): Promise<{
    status: number;
    headers: http.IncomingHttpHeaders;
    body: string;
  }> {
    return new Promise((resolve, reject) => {
      const req = http.request({ hostname: '127.0.0.1', port, method, path: url, agent: false }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        res.on('error', reject);
        res.on('end', () => resolve({ status: res.statusCode!, headers: res.headers, body: Buffer.concat(chunks).toString() }));
      });
      req.on('error', reject);
      req.setTimeout(2_000, () => req.destroy(new Error('Static 404 request timed out')));
      req.end();
    });
  }
});
