import 'reflect-metadata';
import '@server/err-code-configs/general.err-code';
import LogicExceptionHandler from '../logic.exception-handler';
import HttpExceptionHandler from '../http.exception-handler';
import ValidationExceptionHandler from '../validation.exception-handler';
import GlobalExceptionHandler from '../global.exception-handler';
import LogicException from '@server/exceptions/logic.exception';
import HttpException from '@server/exceptions/http.exception';
import { ValidationException } from 'bwcx-ljsm';
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

  it('LogicExceptionHandler writes numeric event business codes', () => {
    const ctx = createCtx({ respContentType: ResponseContentType.Json });
    new LogicExceptionHandler().catch(new LogicException(ErrCode.ContestEventProducerLocked, 'locked'), ctx);
    expect(ctx.body).toEqual({
      success: false,
      code: ErrCode.ContestEventProducerLocked,
      msg: '事件流已被其他生产者锁定',
    });
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

  it('GlobalExceptionHandler maps the multipart file-size limit to a file business error', async () => {
    const ctx = createCtx({ url: '/api/v2/files' });
    const error = Object.assign(new Error('File too large'), {
      name: 'MulterError',
      code: 'LIMIT_FILE_SIZE',
    });

    await new GlobalExceptionHandler().catch(error, ctx);

    expect(ctx.status).toBe(413);
    expect(ctx.body).toEqual({
      success: false,
      code: ErrCode.FileUploadTooLarge,
      msg: '上传文件过大',
    });
  });
});
