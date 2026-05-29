import DefaultResponseHandler from '../default.response-handler';
import { createBinaryResponse } from '../binary-response';

function createCtx() {
  const headers: Record<string, string> = {};
  return {
    headers,
    set(nameOrHeaders: string | Record<string, string>, value?: string) {
      if (typeof nameOrHeaders === 'string') {
        headers[nameOrHeaders] = value || '';
        return;
      }
      Object.assign(headers, nameOrHeaders);
    },
  } as any;
}

describe('default response handler', () => {
  it('returns binary bodies directly and writes X-RL response envelope headers', () => {
    const ctx = createCtx();
    const body = Buffer.from([1, 2, 3]);
    const response = createBinaryResponse({
      body,
      contentType: 'application/protobuf',
      success: true,
      code: 0,
      msg: '成功',
      meta: { checkpointEventId: 12 },
    });

    const result = new DefaultResponseHandler().handle(response, ctx);

    expect(result).toBe(body);
    expect(ctx.headers['Content-Type']).toBe('application/protobuf');
    expect(ctx.headers['X-RL-Resp-Success']).toBe('true');
    expect(ctx.headers['X-RL-Resp-Code']).toBe('0');
    expect(ctx.headers['X-RL-Resp-Msg']).toBe(encodeURIComponent('成功'));
    expect(ctx.headers['X-RL-Resp-Meta']).toBe(encodeURIComponent(JSON.stringify({ checkpointEventId: 12 })));
  });
});
