import 'reflect-metadata';
import DefaultResponseHandler from '../default.response-handler';
import { ResponseContentType } from '@server/http/content-type';
import { ProtobufContract } from '@server/decorators/protobuf-contract.decorator';
import { rankland_live_contest_client } from '@common/proto/rankland_live_contest';
import { formatDateTimeForApi } from '@server/utils/datetime.util';

function decorate(decorator: MethodDecorator, target: any, key: string) {
  decorator(target.prototype, key, Object.getOwnPropertyDescriptor(target.prototype, key)!);
}

class EventsController {
  get() {}
}
decorate(ProtobufContract(null, rankland_live_contest_client.GetContestEventsResponse), EventsController, 'get');

class JsonController {
  get() {}
}

function createCtx(options: {
  respContentType?: ResponseContentType;
  controller?: any;
  route?: string;
  respond?: boolean;
}) {
  const headers: Record<string, string> = {};
  return {
    headers,
    state: { respContentType: options.respContentType },
    respond: options.respond,
    __bwcx__: { controller: options.controller ?? JsonController, route: options.route ?? 'get' },
    set(nameOrHeaders: string | Record<string, string>, value?: string) {
      if (typeof nameOrHeaders === 'string') {
        headers[nameOrHeaders] = value || '';
      } else {
        Object.assign(headers, nameOrHeaders);
      }
    },
  } as any;
}

describe('DefaultResponseHandler', () => {
  const handler = new DefaultResponseHandler();

  it('wraps json responses in the success envelope', () => {
    const ctx = createCtx({ respContentType: ResponseContentType.Json });
    const result = handler.handle({ value: 42 }, ctx);
    expect(result).toEqual({ success: true, code: 0, data: { value: 42 } });
  });

  it('defaults to json when no content type was resolved', () => {
    const ctx = createCtx({});
    const result = handler.handle({ value: 1 }, ctx);
    expect(result).toEqual({ success: true, code: 0, data: { value: 1 } });
  });

  it('formats only real Dates in json response graphs using the server timezone', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const nestedAt = new Date('2026-01-01T00:00:00.123Z');
    const buffer = Buffer.from([1, 2]);
    const custom = {
      date: new Date('2026-01-01T00:00:00.000Z'),
      toJSON() {
        return { custom: true };
      },
    };
    const ctx = createCtx({ respContentType: ResponseContentType.Json });
    const result = handler.handle(
      {
        createdAt,
        nested: [nestedAt],
        text: '2026-01-01T00:00:00.000Z',
        buffer,
        custom,
      },
      ctx,
    ) as any;

    expect(result.data).toEqual({
      createdAt: formatDateTimeForApi(createdAt),
      nested: [formatDateTimeForApi(nestedAt)],
      text: '2026-01-01T00:00:00.000Z',
      buffer,
      custom,
    });
    expect(result.data.buffer).toBe(buffer);
    expect(result.data.custom).toBe(custom);
  });

  it('keeps string json response values unchanged', () => {
    const ctx = createCtx({ respContentType: ResponseContentType.Json });
    expect(handler.handle('already serialized by the route', ctx)).toEqual({
      success: true,
      code: 0,
      data: 'already serialized by the route',
    });
  });

  it('serializes protobuf responses to binary using the declared message', () => {
    const ctx = createCtx({
      respContentType: ResponseContentType.Protobuf,
      controller: EventsController,
      route: 'get',
    });
    const data = {
      uk: 'contest-a',
      checkpointEventId: 5,
      latestEventId: 5,
      streamRevision: 1,
      hasMore: false,
      resetRequired: false,
      events: [],
    };

    const result = handler.handle(data, ctx);

    expect(Buffer.isBuffer(result)).toBe(true);
    const decoded = rankland_live_contest_client.GetContestEventsResponse.decode(result as Buffer);
    expect(decoded.uk).toBe('contest-a');
    expect(decoded.checkpointEventId).toBe(5);
    expect(ctx.headers['Content-Type']).toBe('application/protobuf');
    expect(ctx.headers['X-RL-Resp-Success']).toBe('true');
    expect(ctx.headers['X-RL-Resp-Code']).toBe('0');
    expect(ctx.headers['X-RL-Resp-Msg']).toBeUndefined();
  });

  it('returns an empty protobuf body for void responses', () => {
    const ctx = createCtx({
      respContentType: ResponseContentType.Protobuf,
      controller: EventsController,
      route: 'get',
    });
    const result = handler.handle(undefined, ctx);
    expect(Buffer.isBuffer(result)).toBe(true);
    expect((result as Buffer).length).toBe(0);
    expect(ctx.headers['X-RL-Resp-Success']).toBe('true');
  });

  it('does not touch hijacked (SSE) responses', () => {
    const ctx = createCtx({ respContentType: ResponseContentType.EventStream, respond: false });
    expect(handler.handle(undefined, ctx)).toBeUndefined();
    expect(ctx.headers['Content-Type']).toBeUndefined();
  });
});
