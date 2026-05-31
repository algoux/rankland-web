/**
 * Generic `X-RL-*` response envelope writers, business-agnostic.
 *
 * Convention (see docs/contest-event-architecture.md):
 * - Success responses carry only `X-RL-Resp-Success: true` and `X-RL-Resp-Code: 0`.
 * - Failure responses carry `X-RL-Resp-Success: false`, `X-RL-Resp-Code`,
 *   `X-RL-Resp-Msg`, and an optional `X-RL-Resp-Meta` (error metadata only).
 * Header values are URL-encoded so non-ascii content is transport-safe.
 */
import type { RequestContext } from 'bwcx-ljsm';
import { ResponseContentType, contentTypeHeaderValue } from './content-type';

export function encodeHeaderValue(value: string): string {
  return encodeURIComponent(value);
}

export function writeRlSuccessHeaders(
  ctx: RequestContext,
  options: { contentType: string; code?: string | number },
): void {
  ctx.set({
    'Content-Type': options.contentType,
    'X-RL-Resp-Success': 'true',
    'X-RL-Resp-Code': String(options.code ?? 0),
  });
}

export function writeRlErrorHeaders(
  ctx: RequestContext,
  options: {
    contentType: string;
    code: string | number;
    msg: string;
    meta?: Record<string, unknown>;
  },
): void {
  ctx.set({
    'Content-Type': options.contentType,
    'X-RL-Resp-Success': 'false',
    'X-RL-Resp-Code': String(options.code),
    'X-RL-Resp-Msg': encodeHeaderValue(options.msg || ''),
  });
  if (options.meta && Object.keys(options.meta).length > 0) {
    ctx.set('X-RL-Resp-Meta', encodeHeaderValue(JSON.stringify(options.meta)));
  }
}

/**
 * Write a failure response respecting the content type resolved for the
 * current request (`ctx.state.respContentType`). For protobuf the body is left
 * empty and the error is conveyed through `X-RL-*` headers; otherwise a JSON
 * error envelope is written. Shared by every exception handler.
 */
export function writeErrorResponse(
  ctx: RequestContext,
  options: {
    status: number;
    code: string | number;
    msg: string;
    meta?: Record<string, unknown>;
  },
): void {
  ctx.status = options.status;
  if (ctx.state?.respContentType === ResponseContentType.Protobuf) {
    writeRlErrorHeaders(ctx, {
      contentType: contentTypeHeaderValue(ResponseContentType.Protobuf),
      code: options.code,
      msg: options.msg,
      meta: options.meta,
    });
    ctx.body = Buffer.alloc(0);
    return;
  }
  ctx.body = {
    success: false,
    code: options.code,
    msg: options.msg,
    ...(options.meta || {}),
  };
}
