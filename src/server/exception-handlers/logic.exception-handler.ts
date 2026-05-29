import { ExceptionHandler } from 'bwcx-ljsm';
import type { IBwcxExceptionHandler, RequestContext } from 'bwcx-ljsm';
import LogicException from '@server/exceptions/logic.exception';
import { errCodeConfigs } from '@server/err-code-configs';
import { tryWriteContestEventBinaryErrorResponse } from '@server/modules/contest/contest-event-response';

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
    if (
      tryWriteContestEventBinaryErrorResponse(ctx, {
        status: ctx.status || 200,
        code: e.code,
        msg: msgText,
      })
    ) {
      return;
    }
    ctx.body = {
      success: false,
      code: e.code,
      msg: msgText,
    };
  }
}
