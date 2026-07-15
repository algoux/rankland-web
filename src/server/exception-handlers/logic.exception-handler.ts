import { ExceptionHandler } from 'bwcx-ljsm';
import type { IBwcxExceptionHandler, RequestContext } from 'bwcx-ljsm';
import LogicException from '@server/exceptions/logic.exception';
import { errCodeConfigs } from '@server/err-code-configs';
import { writeErrorResponse } from '@server/http/rl-response';
import { ErrCode } from '@common/enums/err-code.enum';

@ExceptionHandler(LogicException)
export default class LogicExceptionHandler implements IBwcxExceptionHandler {
  public catch(e: LogicException, ctx: RequestContext) {
    const msg = `LogicException caught: ${e.code}\n
            url: ${ctx.url}\n
            err: ${e.message}\n
            stack: ${e.stack}`;
    ctx.warn(msg);
    if (!errCodeConfigs[e.code]) {
      ctx.warn(`No err code config for LogicException. url: ${ctx.url}, code: ${e.code}`);
    }
    const msgText = errCodeConfigs[e.code] || '系统异常，请稍后再试';
    let status = ctx.status !== 404 && ctx.status !== 200 ? ctx.status : undefined;
    if (!status) {
      switch (e.code) {
        case ErrCode.InvalidAuthInfo:
          status = 401;
          break;
        case ErrCode.ContestNotFound:
        case ErrCode.ContestUserNotFound:
        case ErrCode.FileNotFound:
        case ErrCode.CollectionNotFound:
          status = 404;
          break;
        default:
          status = 200;
      }
    }
    writeErrorResponse(ctx, {
      status,
      code: e.code,
      msg: msgText,
    });
  }
}
