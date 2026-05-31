import { ExceptionHandler } from 'bwcx-ljsm';
import type { IBwcxExceptionHandler, RequestContext } from 'bwcx-ljsm';
import { ErrCode } from '@common/enums/err-code.enum';
import { writeErrorResponse } from '@server/http/rl-response';

@ExceptionHandler(Error)
export default class GlobalExceptionHandler implements IBwcxExceptionHandler {
  public async catch(e: Error, ctx: RequestContext) {
    const msg = `GlobalException caught:\n
            err: ${e.message}\n
            stack: ${e.stack}`;
    ctx.error(msg);
    writeErrorResponse(ctx, {
      status: 500,
      code: ErrCode.SystemError,
      msg: '系统异常，请稍候再试',
    });
  }
}
