import 'reflect-metadata';
import '@server/err-code-configs/general.err-code';
import LogicExceptionHandler from '../logic.exception-handler';
import HttpExceptionHandler from '../http.exception-handler';
import ValidationExceptionHandler from '../validation.exception-handler';
import ContestEventExceptionHandler from '../contest-event.exception-handler';
import LogicException from '@server/exceptions/logic.exception';
import HttpException from '@server/exceptions/http.exception';
import { ValidationException } from 'bwcx-ljsm';
import { ContestEventError, ContestEventErrorCode } from '@server/modules/contest/contest-event-errors';
import { ResponseContentType } from '@server/http/content-type';
import { ErrCode } from '@common/enums/err-code.enum';

function createCtx(options: { respContentType?: ResponseContentType; url?: string } = {}) {
  const headers: Record<string, string> = {};
  return {
    headers,
    request: { headers: {} },
    state: { respContentType: options.respContentType },
    url: options.url ?? '/api/v2/contests/x/events',
    status: undefined as number | undefined,
    body: undefined as unknown,
    set(nameOrHeaders: string | Record<string, string>, value?: string) {
      if (typeof nameOrHeaders === 'string') {
        headers[nameOrHeaders] = value || '';
      } else {
        Object.assign(headers, nameOrHeaders);
      }
    },
    warn() {},
    error() {},
  } as any;
}

describe('exception handlers (content-negotiated)', () => {
  it('LogicExceptionHandler writes a json error body for json requests', () => {
    const ctx = createCtx({ respContentType: ResponseContentType.Json });
    new LogicExceptionHandler().catch(new LogicException(ErrCode.ContestNotFound), ctx);
    expect(ctx.body).toEqual({ success: false, code: ErrCode.ContestNotFound, msg: '该比赛未找到' });
    expect(ctx.headers['X-RL-Resp-Success']).toBeUndefined();
  });

  it('LogicExceptionHandler writes an empty protobuf body with X-RL headers', () => {
    const ctx = createCtx({ respContentType: ResponseContentType.Protobuf });
    new LogicExceptionHandler().catch(new LogicException(ErrCode.ContestNotFound), ctx);
    expect(Buffer.isBuffer(ctx.body)).toBe(true);
    expect((ctx.body as Buffer).length).toBe(0);
    expect(ctx.headers['X-RL-Resp-Success']).toBe('false');
    expect(ctx.headers['X-RL-Resp-Code']).toBe(String(ErrCode.ContestNotFound));
    expect(ctx.headers['X-RL-Resp-Msg']).toBe(encodeURIComponent('该比赛未找到'));
  });

  it('ContestEventExceptionHandler maps status and carries error metadata in protobuf headers', () => {
    const ctx = createCtx({ respContentType: ResponseContentType.Protobuf });
    const err = new ContestEventError(ContestEventErrorCode.ProducerLocked, 'locked', { producerId: 'p1' });
    new ContestEventExceptionHandler().catch(err, ctx);
    expect(ctx.status).toBe(409);
    expect(ctx.headers['X-RL-Resp-Meta']).toBe(encodeURIComponent(JSON.stringify({ producerId: 'p1' })));
  });

  it('ContestEventExceptionHandler spreads metadata into the json body', () => {
    const ctx = createCtx({ respContentType: ResponseContentType.Json });
    const err = new ContestEventError(ContestEventErrorCode.ProducerLocked, 'locked', { producerId: 'p1' });
    new ContestEventExceptionHandler().catch(err, ctx);
    expect(ctx.body).toEqual({ success: false, code: 'PRODUCER_LOCKED', msg: 'locked', producerId: 'p1' });
  });

  it('HttpExceptionHandler writes a json error for api routes', () => {
    const ctx = createCtx({ url: '/api/v2/contests/x/events' });
    new HttpExceptionHandler().catch(new HttpException(406), ctx);
    expect(ctx.status).toBe(406);
    expect(ctx.body).toMatchObject({ success: false, code: 406 });
  });

  it('HttpExceptionHandler only sets status for non-api routes', () => {
    const ctx = createCtx({ url: '/some/page' });
    new HttpExceptionHandler().catch(new HttpException(404), ctx);
    expect(ctx.status).toBe(404);
    expect(ctx.body).toBeUndefined();
  });

  it('ValidationExceptionHandler responds 422 with illegal-parameter code', () => {
    const ctx = createCtx({ respContentType: ResponseContentType.Json });
    new ValidationExceptionHandler().catch(new ValidationException('req', []), ctx);
    expect(ctx.status).toBe(422);
    expect(ctx.body).toMatchObject({ success: false, code: ErrCode.IllegalParameters });
  });
});
