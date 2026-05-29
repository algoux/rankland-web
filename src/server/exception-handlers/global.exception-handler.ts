import { ExceptionHandler } from 'bwcx-ljsm';
import type { IBwcxExceptionHandler, RequestContext } from 'bwcx-ljsm';
import { tryWriteContestEventBinaryErrorResponse } from '@server/modules/contest/contest-event-response';

@ExceptionHandler(Error)
export default class GlobalExceptionHandler implements IBwcxExceptionHandler {
  public async catch(e: Error, ctx: RequestContext) {
    const msg = `GlobalException caught:\n
            err: ${e.message}\n
            stack: ${e.stack}`;
    ctx.error(msg);
    ctx.status = 500;
    if (
      tryWriteContestEventBinaryErrorResponse(ctx, {
        status: ctx.status,
        code: -1,
        msg: '系统异常，请稍候再试',
      })
    ) {
      return;
    }
    ctx.body = {
      success: false,
      code: -1,
      msg: '系统异常，请稍候再试',
    };
  }
}
