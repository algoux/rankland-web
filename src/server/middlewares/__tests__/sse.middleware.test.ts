import 'reflect-metadata';
import SseMiddleware, { openSseResponse } from '../sse.middleware';
import { Sse } from '@server/decorators/sse.decorator';

function decorate(decorator: MethodDecorator, target: any, key: string) {
  decorator(target.prototype, key, Object.getOwnPropertyDescriptor(target.prototype, key)!);
}

class StreamController {
  stream() {}
}
decorate(Sse({ retry: 2000 }), StreamController, 'stream');

class PlainController {
  plain() {}
}

function createCtx() {
  const headers: Record<string, string> = {};
  const writes: string[] = [];
  return {
    headers,
    writes,
    status: undefined as number | undefined,
    respond: undefined as boolean | undefined,
    set(nameOrHeaders: string | Record<string, string>, value?: string) {
      if (typeof nameOrHeaders === 'string') {
        headers[nameOrHeaders] = value || '';
      } else {
        Object.assign(headers, nameOrHeaders);
      }
    },
    req: { setTimeout(_ms: number) {} },
    res: {
      headStatus: undefined as number | undefined,
      writeHead(status: number) {
        this.headStatus = status;
      },
      write(chunk: string) {
        writes.push(chunk);
        return true;
      },
    },
    __bwcx__: { controller: StreamController, route: 'stream' },
  } as any;
}

describe('SseMiddleware', () => {
  const mw = new SseMiddleware();

  it('defers committing the event-stream response until the controller explicitly opens it', async () => {
    const ctx = createCtx();
    let called = false;
    await mw.use(ctx, async () => {
      called = true;
    });

    expect(called).toBe(true);
    expect(ctx.respond).toBeUndefined();
    expect(ctx.res.headStatus).toBeUndefined();
    expect(ctx.writes).toHaveLength(0);

    openSseResponse(ctx);
    expect(ctx.headers['Content-Type']).toBe('text/event-stream; charset=utf-8');
    expect(ctx.headers['Cache-Control']).toBe('no-cache, no-transform');
    expect(ctx.headers['Connection']).toBe('keep-alive');
    expect(ctx.status).toBe(200);
    expect(ctx.respond).toBe(false);
    expect(ctx.res.headStatus).toBe(200);
    expect(ctx.writes).toContain('retry: 2000\n\n');
  });

  it('keeps the HTTP response uncommitted when controller bootstrap fails', async () => {
    const ctx = createCtx();
    await expect(
      mw.use(ctx, async () => {
        throw new Error('bootstrap unavailable');
      }),
    ).rejects.toThrow('bootstrap unavailable');
    expect(ctx.respond).toBeUndefined();
    expect(ctx.res.headStatus).toBeUndefined();
    expect(ctx.writes).toHaveLength(0);
  });

  it('skips routes that are not SSE endpoints', async () => {
    const ctx = createCtx();
    ctx.__bwcx__ = { controller: PlainController, route: 'plain' };
    let called = false;
    await mw.use(ctx, async () => {
      called = true;
    });
    expect(called).toBe(true);
    expect(ctx.respond).toBeUndefined();
    expect(ctx.res.headStatus).toBeUndefined();
    expect(ctx.writes).toHaveLength(0);
  });
});
