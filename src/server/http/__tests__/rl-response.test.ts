import {
  encodeHeaderValue,
  writeRlSuccessHeaders,
  writeRlErrorHeaders,
  writeErrorResponse,
} from '../rl-response';
import { ResponseContentType } from '../content-type';

function createCtx(state: Record<string, any> = {}) {
  const headers: Record<string, string> = {};
  return {
    headers,
    state,
    status: undefined as number | undefined,
    body: undefined as unknown,
    set(nameOrHeaders: string | Record<string, string>, value?: string) {
      if (typeof nameOrHeaders === 'string') {
        headers[nameOrHeaders] = value || '';
        return;
      }
      Object.assign(headers, nameOrHeaders);
    },
  } as any;
}

describe('encodeHeaderValue', () => {
  it('url-encodes non-ascii header values', () => {
    expect(encodeHeaderValue('成功')).toBe(encodeURIComponent('成功'));
  });
});

describe('writeRlSuccessHeaders', () => {
  it('writes success envelope headers without msg or meta', () => {
    const ctx = createCtx();
    writeRlSuccessHeaders(ctx, { contentType: 'application/protobuf' });
    expect(ctx.headers['Content-Type']).toBe('application/protobuf');
    expect(ctx.headers['X-RL-Resp-Success']).toBe('true');
    expect(ctx.headers['X-RL-Resp-Code']).toBe('0');
    expect(ctx.headers['X-RL-Resp-Msg']).toBeUndefined();
    expect(ctx.headers['X-RL-Resp-Meta']).toBeUndefined();
  });
});

describe('writeRlErrorHeaders', () => {
  it('writes failure envelope headers with encoded msg', () => {
    const ctx = createCtx();
    writeRlErrorHeaders(ctx, { contentType: 'application/protobuf', code: 100001, msg: '该比赛未找到' });
    expect(ctx.headers['Content-Type']).toBe('application/protobuf');
    expect(ctx.headers['X-RL-Resp-Success']).toBe('false');
    expect(ctx.headers['X-RL-Resp-Code']).toBe('100001');
    expect(ctx.headers['X-RL-Resp-Msg']).toBe(encodeURIComponent('该比赛未找到'));
  });

  it('writes optional meta header when provided', () => {
    const ctx = createCtx();
    writeRlErrorHeaders(ctx, {
      contentType: 'application/protobuf',
      code: 100004,
      msg: 'locked',
      meta: { producerId: 'p1' },
    });
    expect(ctx.headers['X-RL-Resp-Meta']).toBe(encodeURIComponent(JSON.stringify({ producerId: 'p1' })));
  });
});

describe('writeErrorResponse', () => {
  it('writes an empty body and X-RL headers for protobuf requests', () => {
    const ctx = createCtx({ respContentType: ResponseContentType.Protobuf });
    writeErrorResponse(ctx, { status: 404, code: 100001, msg: '该比赛未找到' });
    expect(ctx.status).toBe(404);
    expect(Buffer.isBuffer(ctx.body)).toBe(true);
    expect((ctx.body as Buffer).length).toBe(0);
    expect(ctx.headers['X-RL-Resp-Success']).toBe('false');
    expect(ctx.headers['X-RL-Resp-Code']).toBe('100001');
    expect(ctx.headers['X-RL-Resp-Msg']).toBe(encodeURIComponent('该比赛未找到'));
  });

  it('writes a json error body when content type is json', () => {
    const ctx = createCtx({ respContentType: ResponseContentType.Json });
    writeErrorResponse(ctx, { status: 422, code: -3, msg: '非法参数', meta: { field: 'uk' } });
    expect(ctx.status).toBe(422);
    expect(ctx.body).toEqual({ success: false, code: -3, msg: '非法参数', field: 'uk' });
    expect(ctx.headers['X-RL-Resp-Success']).toBeUndefined();
  });

  it('defaults to json when no content type has been resolved', () => {
    const ctx = createCtx();
    writeErrorResponse(ctx, { status: 500, code: -1, msg: 'oops' });
    expect(ctx.body).toEqual({ success: false, code: -1, msg: 'oops' });
  });
});
