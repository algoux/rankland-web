import type { IBwcxMiddleware, MiddlewareNext, RequestContext } from 'bwcx-ljsm';
import { Middleware } from 'bwcx-ljsm';
import { getSseContract } from '@server/decorators/sse.decorator';

const DEFAULT_RETRY = 1000;

/**
 * Generic Server-Sent Events plumbing, business-agnostic. Registered as a
 * global middleware; it only acts on routes that declare `@Sse()`. It sets the
 * event-stream headers, takes over the response (`ctx.respond = false`), flushes
 * the head and the `retry:` hint before handing off, then the controller (which
 * runs after, inside `next()`) performs the business hookup (e.g. registering
 * the connection with an SSE hub) using `ctx.res`.
 */
@Middleware()
export default class SseMiddleware implements IBwcxMiddleware {
  public async use(ctx: RequestContext, next: MiddlewareNext) {
    const meta = getSseContract(ctx.__bwcx__?.controller, ctx.__bwcx__?.route);
    if (!meta) {
      return next();
    }
    const retry = meta.retry ?? DEFAULT_RETRY;

    ctx.req.setTimeout(0);
    ctx.set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    ctx.status = 200;
    ctx.respond = false;
    ctx.res.writeHead(200);
    ctx.res.write(`retry: ${retry}\n\n`);

    return next();
  }
}
