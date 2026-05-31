import { ResponseHandler } from 'bwcx-ljsm';
import type { IBwcxResponseHandler, RequestContext } from 'bwcx-ljsm';
import { ResponseContentType, contentTypeHeaderValue } from '@server/http/content-type';
import { writeRlSuccessHeaders } from '@server/http/rl-response';
import { getProtobufContract } from '@server/decorators/protobuf-contract.decorator';

/**
 * Generic, business-agnostic success response handler. It wraps the route
 * return value according to the content type negotiated for the request
 * (`ctx.state.respContentType`):
 *
 * - protobuf → serialize the return value with the protobuf response message
 *   declared via `@ProtobufContract(..., RespMessage)` and write `X-RL-*`
 *   success headers; an empty return becomes an empty body;
 * - json (default) → `{ success: true, code: 0, data }`.
 *
 * Hijacked responses (SSE, `ctx.respond === false`) are left untouched.
 */
@ResponseHandler()
export default class DefaultResponseHandler implements IBwcxResponseHandler {
  public handle(response: any, ctx: RequestContext) {
    if (ctx.respond === false || ctx.state?.respContentType === ResponseContentType.EventStream) {
      return undefined;
    }

    if (ctx.state?.respContentType === ResponseContentType.Protobuf) {
      const respMessage = getProtobufContract(ctx.__bwcx__?.controller, ctx.__bwcx__?.route)?.resp;
      if (respMessage) {
        writeRlSuccessHeaders(ctx, { contentType: contentTypeHeaderValue(ResponseContentType.Protobuf) });
        if (response === undefined || response === null) {
          return Buffer.alloc(0);
        }
        return Buffer.from(respMessage.encode(respMessage.fromObject(response)).finish());
      }
    }

    return {
      success: true,
      code: 0,
      data: response,
    };
  }
}
