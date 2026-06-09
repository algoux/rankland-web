import type { IBwcxMiddleware, MiddlewareNext, RequestContext } from 'bwcx-ljsm';
import { Middleware } from 'bwcx-ljsm';
import HttpException from '@server/exceptions/http.exception';
import { ResponseContentType, negotiateResponseContentType } from '@server/http/content-type';
import { resolveSupportedResponseTypes } from '@server/http/route-content-type';

/**
 * Generic, business-agnostic content negotiation. For every matched controller
 * route it resolves the response content type from the `Accept` header and the
 * types the route declares it can produce, and stores it on
 * `ctx.state.respContentType` for the response handler and exception handlers.
 *
 * Strict routes (those that declare protobuf/SSE capabilities) respond 406 when
 * the client accepts none of the supported types. Plain routes are lenient and
 * fall back to JSON so unusual `Accept` headers never break them.
 */
@Middleware()
export default class ContentNegotiationMiddleware implements IBwcxMiddleware {
  public async use(ctx: RequestContext, next: MiddlewareNext) {
    const controller = ctx.__bwcx__?.controller;
    const route = ctx.__bwcx__?.route;
    if (!controller || !route) {
      return next();
    }

    const { supported, strict } = resolveSupportedResponseTypes(controller, route);
    const resolved = negotiateResponseContentType(ctx.headers.accept, supported);

    if (resolved === null) {
      if (strict) {
        throw new HttpException(406);
      }
      ctx.state.respContentType = ResponseContentType.Json;
      return next();
    }

    ctx.state.respContentType = resolved;
    return next();
  }
}
