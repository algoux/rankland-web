import type { RequestContext } from 'bwcx-ljsm';
import { createBinaryResponse, writeRlRespHeaders } from '@server/response-handlers/binary-response';

const protobufContentTypes = new Set(['application/protobuf', 'application/x-protobuf']);

export enum ContestEventResponseFormat {
  Protobuf = 'protobuf',
  Json = 'json',
  Unsupported = 'unsupported',
}

export function isContestEventProtobufContentType(header: string | string[] | undefined): boolean {
  return protobufContentTypes.has(normalizeContentType(header));
}

export function isContestEventOctetStreamContentType(header: string | string[] | undefined): boolean {
  return normalizeContentType(header) === 'application/octet-stream';
}

export function negotiateContestEventResponseFormat(
  acceptHeader: string | string[] | undefined,
): ContestEventResponseFormat {
  if (Array.isArray(acceptHeader)) {
    return negotiateContestEventResponseFormat(acceptHeader.join(','));
  }
  if (!acceptHeader || !acceptHeader.trim()) {
    return ContestEventResponseFormat.Protobuf;
  }

  const accepted = parseAcceptHeader(acceptHeader);
  if (accepted.length === 0) {
    return ContestEventResponseFormat.Protobuf;
  }

  const protobufQuality = bestQualityFor(accepted, (type) => protobufContentTypes.has(type) || type === '*/*' || type === 'application/*');
  const jsonQuality = bestQualityFor(accepted, (type) => type === 'application/json' || type === '*/*' || type === 'application/*');
  if (protobufQuality <= 0 && jsonQuality <= 0) {
    return ContestEventResponseFormat.Unsupported;
  }
  if (protobufQuality >= jsonQuality) {
    return ContestEventResponseFormat.Protobuf;
  }
  return ContestEventResponseFormat.Json;
}

export function createContestEventBinaryResponse(body: Buffer) {
  return createBinaryResponse({
    body,
    contentType: 'application/protobuf',
    success: true,
    code: 0,
    msg: 'OK',
  });
}

export function tryWriteContestEventBinaryErrorResponse(
  ctx: RequestContext,
  options: {
    status: number;
    code: string | number;
    msg: string;
    metadata?: Record<string, unknown>;
  },
): boolean {
  if (!isContestEventsPath(ctx) || negotiateContestEventResponseFormat(ctx.headers.accept) !== ContestEventResponseFormat.Protobuf) {
    return false;
  }
  ctx.status = options.status;
  writeRlRespHeaders(ctx, {
    body: Buffer.alloc(0),
    contentType: 'application/protobuf',
    success: false,
    code: options.code,
    msg: options.msg,
    meta: options.metadata,
  });
  ctx.body = Buffer.alloc(0);
  return true;
}

function isContestEventsPath(ctx: RequestContext): boolean {
  return ctx.method === 'GET' && /^\/api\/v2\/contests\/[^/]+\/events$/.test(ctx.path);
}

function normalizeContentType(header: string | string[] | undefined): string {
  if (Array.isArray(header)) {
    return '';
  }
  return (header || '').split(';')[0].trim().toLowerCase();
}

function parseAcceptHeader(header: string): Array<{ type: string; q: number; order: number }> {
  return header
    .split(',')
    .map((part, order) => {
      const [rawType, ...rawParams] = part.split(';');
      const type = rawType.trim().toLowerCase();
      let q = 1;
      for (const rawParam of rawParams) {
        const [name, value] = rawParam.split('=').map((item) => item.trim());
        if (name.toLowerCase() === 'q') {
          const parsed = Number(value);
          q = Number.isFinite(parsed) ? parsed : 0;
        }
      }
      return { type, q, order };
    })
    .filter((item) => item.type && item.q > 0)
    .sort((a, b) => b.q - a.q || a.order - b.order);
}

function bestQualityFor(
  accepted: Array<{ type: string; q: number }>,
  predicate: (type: string) => boolean,
): number {
  let best = 0;
  for (const item of accepted) {
    if (predicate(item.type)) {
      best = Math.max(best, item.q);
    }
  }
  return best;
}
