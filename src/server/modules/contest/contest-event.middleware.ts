import { Inject, Provide } from 'bwcx-core';
import type { RequestContext } from 'bwcx-ljsm';
import ContestEventStreamService from './contest-event-stream.service';
import ContestSseHub from './contest-sse-hub';
import {
  ContestEventError,
  contestEventErrorStatus,
} from './contest-event-errors';
import { parseProducerBatch, producerBatchToJson } from './contest-event-codec';
import {
  isContestEventOctetStreamContentType,
  isContestEventProtobufContentType,
} from './contest-event-response';

const rawEventPathPattern = /^\/api\/v2\/contests\/([^/]+)\/events$/;
const ssePathPattern = /^\/api\/v2\/contests\/([^/]+)\/events\/stream$/;
const rawEventBodyLimit = 5 * 1024 * 1024;

@Provide()
export default class ContestEventMiddleware {
  public constructor(
    @Inject(ContestEventStreamService)
    private readonly eventStreamService: ContestEventStreamService,

    @Inject(ContestSseHub)
    private readonly sseHub: ContestSseHub,
  ) {}

  public getMiddleware() {
    return async (ctx: RequestContext, next: () => Promise<void>) => {
      const rawEventMatch = ctx.path.match(rawEventPathPattern);
      if (ctx.method === 'POST' && rawEventMatch && isContestEventOctetStreamContentType(ctx.headers['content-type'])) {
        this.writeUnsupportedMediaType(ctx);
        return;
      }
      if (ctx.method === 'POST' && rawEventMatch && isContestEventProtobufContentType(ctx.headers['content-type'])) {
        try {
          const decoded = await this.decodeProtobufAppendBody(ctx);
          if (!decoded) {
            return;
          }
        } catch (e) {
          this.handleMiddlewareError(ctx, e);
          return;
        }
        await next();
        return;
      }

      const sseMatch = ctx.path.match(ssePathPattern);
      if (ctx.method === 'GET' && sseMatch) {
        try {
          await this.handleSse(ctx, decodeURIComponent(sseMatch[1]));
        } catch (e) {
          this.handleMiddlewareError(ctx, e);
        }
        return;
      }

      await next();
    };
  }

  private async decodeProtobufAppendBody(ctx: RequestContext): Promise<boolean> {
    if (isContentLengthTooLarge(ctx.headers['content-length'], rawEventBodyLimit)) {
      this.writePayloadTooLarge(ctx);
      return false;
    }
    const bytes = await readRawBody(ctx.req, rawEventBodyLimit);
    ctx.request.body = producerBatchToJson(parseProducerBatch(bytes));
    return true;
  }

  private async handleSse(ctx: RequestContext, uk: string): Promise<void> {
    const stream = await this.eventStreamService.getStreamState(uk);
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
    this.sseHub.addClient(uk, ctx.res, {
      uk,
      latestEventId: stream.lastEventId,
      streamRevision: stream.streamRevision,
    });
  }

  private handleMiddlewareError(ctx: RequestContext, e: unknown): void {
    if (e instanceof RawBodyTooLargeError) {
      this.writePayloadTooLarge(ctx, e.message);
      return;
    }
    if (e instanceof ContestEventError) {
      ctx.status = contestEventErrorStatus(e.code);
      ctx.body = {
        success: false,
        code: e.code,
        msg: e.message,
        ...e.metadata,
      };
      return;
    }
    throw e;
  }

  private writePayloadTooLarge(ctx: RequestContext, msg = `raw protobuf payload exceeds ${rawEventBodyLimit} bytes`): void {
    ctx.status = 413;
    ctx.body = {
      success: false,
      code: 'PAYLOAD_TOO_LARGE',
      msg,
    };
  }

  private writeUnsupportedMediaType(ctx: RequestContext): void {
    ctx.status = 415;
    ctx.body = {
      success: false,
      code: 'UNSUPPORTED_MEDIA_TYPE',
      msg: 'application/octet-stream is not supported for contest events; use application/protobuf or application/x-protobuf',
    };
  }
}

function readRawBody(req: NodeJS.ReadableStream, maxBytes: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
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

function isContentLengthTooLarge(header: string | string[] | undefined, maxBytes: number): boolean {
  if (Array.isArray(header) || header === undefined) {
    return false;
  }
  const contentLength = Number(header);
  return Number.isFinite(contentLength) && contentLength > maxBytes;
}

class RawBodyTooLargeError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'RawBodyTooLargeError';
  }
}
