import { ResponseHandler } from 'bwcx-ljsm';
import type { IBwcxResponseHandler, RequestContext } from 'bwcx-ljsm';
import { ResponseContentType, contentTypeHeaderValue } from '@server/http/content-type';
import { writeRlSuccessHeaders } from '@server/http/rl-response';
import { getProtobufContract } from '@server/decorators/protobuf-contract.decorator';
import { normalizeJsonDatesForApi } from '@server/utils/datetime.util';
import { isTrustedResponse, TrustedPreNormalizedJsonResponse } from '@server/http/trusted-response';

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

    if (isTrustedResponse(response)) {
      if (response.kind === 'pre-encoded-protobuf') {
        if (ctx.state?.respContentType !== ResponseContentType.Protobuf) {
          response.release();
          throw new Error('trusted pre-encoded protobuf response used for a non-protobuf request');
        }
        const respMessage = getProtobufContract(ctx.__bwcx__?.controller, ctx.__bwcx__?.route)?.resp;
        if (!respMessage) {
          response.release();
          throw new Error('trusted pre-encoded protobuf response requires a protobuf response contract');
        }
        writeRlSuccessHeaders(ctx, { contentType: contentTypeHeaderValue(ResponseContentType.Protobuf) });
        response.release();
        return response.body;
      }
      if (ctx.state?.respContentType === ResponseContentType.Protobuf) {
        response.release();
        throw new Error('trusted pre-normalized JSON response used for a protobuf request');
      }
      releaseJsonAtResponseTerminal(response, ctx);
      return {
        success: true,
        code: 0,
        data: response.data,
      };
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
      data: normalizeJsonDatesForApi(response),
    };
  }
}

function releaseJsonAtResponseTerminal(response: TrustedPreNormalizedJsonResponse, ctx: RequestContext): void {
  const rawResponse = ctx.res as
    | {
        once?: (event: string, listener: () => void) => void;
        removeListener?: (event: string, listener: () => void) => void;
      }
    | undefined;
  if (!rawResponse?.once) {
    response.release();
    return;
  }
  const release = () => {
    rawResponse.removeListener?.('finish', release);
    rawResponse.removeListener?.('close', release);
    rawResponse.removeListener?.('error', release);
    response.release();
  };
  rawResponse.once('finish', release);
  rawResponse.once('close', release);
  rawResponse.once('error', release);
}
