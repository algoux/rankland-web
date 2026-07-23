import type { IBwcxMiddleware, MiddlewareNext, RequestContext } from 'bwcx-ljsm';
import { Middleware } from 'bwcx-ljsm';
import { getSseContract } from '@server/decorators/sse.decorator';

const DEFAULT_RETRY = 1000;
const SSE_RESPONSE_OPENED = Symbol('rankland.sseResponseOpened');

export function openSseResponse(ctx: RequestContext): void {
  const meta = getSseContract(ctx.__bwcx__?.controller, ctx.__bwcx__?.route);
  if (!meta) {
    throw new Error('cannot open an SSE response for a route without an @Sse contract');
  }
  const state = ctx as RequestContext & { [SSE_RESPONSE_OPENED]?: boolean };
  if (state[SSE_RESPONSE_OPENED]) {
    return;
  }
  state[SSE_RESPONSE_OPENED] = true;
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
}

/**
 * Generic Server-Sent Events plumbing, business-agnostic. Registered as a
 * global middleware; it only acts on routes that declare `@Sse()`. It sets the
 * request timeout policy before handing off. The controller explicitly calls
 * `openSseResponse()` only after its business bootstrap succeeds, so an
 * admission failure can still be rendered as an ordinary HTTP error.
 */
@Middleware()
export default class SseMiddleware implements IBwcxMiddleware {
  public async use(ctx: RequestContext, next: MiddlewareNext) {
    const meta = getSseContract(ctx.__bwcx__?.controller, ctx.__bwcx__?.route);
    if (!meta) {
      return next();
    }
    ctx.req.setTimeout(0);
    return next();
  }
}
