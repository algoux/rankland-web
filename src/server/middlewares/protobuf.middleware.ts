import type { IBwcxMiddleware, MiddlewareNext, RequestContext } from 'bwcx-ljsm';
import { Middleware } from 'bwcx-ljsm';
import HttpException from '@server/exceptions/http.exception';
import { MEDIA_TYPE } from '@server/http/content-type';
import { getProtobufContract } from '@server/decorators/protobuf-contract.decorator';

const RAW_PROTOBUF_BODY_LIMIT = 5 * 1024 * 1024;
const PROTOBUF_CONTENT_TYPES = new Set<string>([MEDIA_TYPE.protobuf, MEDIA_TYPE.xProtobuf]);

/**
 * Generic protobuf request decoding. Runs before validation (registered as a
 * global middleware) so the decoded body is available to bwcx's DTO validation.
 *
 * Only acts on routes that declare a protobuf request message via
 * `@ProtobufContract(req, ...)`. For such routes:
 * - protobuf content type → read raw body (size-limited) and decode via the
 *   declared message into `ctx.request.body`;
 * - json content type / no body → pass through to the body parser & validation;
 * - any other explicit content type (e.g. octet-stream) → 415.
 *
 * Business-level batch validation stays in the service layer.
 */
@Middleware()
export default class ProtobufMiddleware implements IBwcxMiddleware {
  public async use(ctx: RequestContext, next: MiddlewareNext) {
    const controller = ctx.__bwcx__?.controller;
    const route = ctx.__bwcx__?.route;
    const contract = controller && route ? getProtobufContract(controller, route) : undefined;
    if (!contract?.req) {
      return next();
    }

    const contentType = normalizeContentType(ctx.headers['content-type']);
    if (!contentType || contentType === MEDIA_TYPE.json) {
      return next();
    }
    if (!PROTOBUF_CONTENT_TYPES.has(contentType)) {
      throw new HttpException(415);
    }

    if (isContentLengthTooLarge(ctx.headers['content-length'], RAW_PROTOBUF_BODY_LIMIT)) {
      throw new HttpException(413);
    }

    let bytes: Buffer;
    try {
      bytes = await readRawBody(ctx.req, RAW_PROTOBUF_BODY_LIMIT);
    } catch (e) {
      if (e instanceof RawBodyTooLargeError) {
        throw new HttpException(413);
      }
      throw e;
    }

    try {
      const message = contract.req.decode(bytes);
      ctx.request.body = contract.req.toObject(message, { longs: String, enums: String });
    } catch (e) {
      throw new HttpException(400);
    }

    return next();
  }
}

function normalizeContentType(header: string | string[] | undefined): string {
  if (Array.isArray(header) || header === undefined) {
    return '';
  }
  return header.split(';')[0].trim().toLowerCase();
}

function isContentLengthTooLarge(header: string | string[] | undefined, maxBytes: number): boolean {
  if (Array.isArray(header) || header === undefined) {
    return false;
  }
  const contentLength = Number(header);
  return Number.isFinite(contentLength) && contentLength > maxBytes;
}

function readRawBody(req: NodeJS.ReadableStream | undefined, maxBytes: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    if (!req) {
      resolve(Buffer.alloc(0));
      return;
    }
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    let settled = false;
    const fail = (error: Error) => {
      if (settled) {
        return;
      }
      settled = true;
      reject(error);
    };
    req.on('data', (chunk) => {
      if (settled) {
        return;
      }
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += buffer.length;
      if (totalBytes > maxBytes) {
        fail(new RawBodyTooLargeError(`raw protobuf payload exceeds ${maxBytes} bytes`));
        return;
      }
      chunks.push(buffer);
    });
    req.on('end', () => {
      if (!settled) {
        settled = true;
        resolve(Buffer.concat(chunks));
      }
    });
    req.on('error', fail);
  });
}

class RawBodyTooLargeError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'RawBodyTooLargeError';
  }
}
