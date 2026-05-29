import { ExceptionHandler, ValidationException } from 'bwcx-ljsm';
import type { IBwcxExceptionHandler, RequestContext } from 'bwcx-ljsm';
import { ErrCode } from '@common/enums/err-code.enum';
import { errCodeConfigs } from '@server/err-code-configs';
import { tryWriteContestEventBinaryErrorResponse } from '@server/modules/contest/contest-event-response';

@ExceptionHandler(ValidationException)
export default class ValidationExceptionHandler implements IBwcxExceptionHandler {
  public catch(error: ValidationException, ctx: RequestContext) {
    ctx.error(
      `ValidationException caught: ${error.message}\n
      ua: ${ctx.request.headers['user-agent']}\n
      errors:`,
      JSON.stringify(error.errors, null, 2),
    );
    ctx.status = 422;
    const msg = error.source === 'req' ? errCodeConfigs[ErrCode.IllegalParameters] : '响应数据校验失败';
    if (
      tryWriteContestEventBinaryErrorResponse(ctx, {
        status: ctx.status,
        code: ErrCode.IllegalParameters,
        msg,
      })
    ) {
      return;
    }
    ctx.body = {
      success: false,
      code: ErrCode.IllegalParameters,
      msg,
    };
  }
}
