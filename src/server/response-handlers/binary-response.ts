import type { RequestContext } from 'bwcx-ljsm';

export interface BinaryResponseOptions {
  body: Buffer;
  contentType: string;
  success?: boolean;
  code?: string | number;
  msg?: string;
  meta?: Record<string, unknown>;
}

export interface BinaryResponsePayload extends BinaryResponseOptions {
  __rlBinaryResponse: true;
}

export function createBinaryResponse(options: BinaryResponseOptions): BinaryResponsePayload {
  return {
    __rlBinaryResponse: true,
    success: true,
    code: 0,
    msg: 'OK',
    ...options,
  };
}

export function isBinaryResponsePayload(response: unknown): response is BinaryResponsePayload {
  return Boolean(response && typeof response === 'object' && (response as any).__rlBinaryResponse === true);
}

export function writeRlRespHeaders(ctx: RequestContext, response: BinaryResponseOptions): void {
  ctx.set({
    'Content-Type': response.contentType,
    'X-RL-Resp-Success': response.success === false ? 'false' : 'true',
    'X-RL-Resp-Code': String(response.code ?? 0),
    'X-RL-Resp-Msg': encodeHeaderValue(response.msg || ''),
  });
  if (response.meta) {
    ctx.set('X-RL-Resp-Meta', encodeHeaderValue(JSON.stringify(response.meta)));
  }
}

export function encodeHeaderValue(value: string): string {
  return encodeURIComponent(value);
}
