import { ExceptionHandler, ValidationException } from 'bwcx-ljsm';
import type { IBwcxExceptionHandler, RequestContext } from 'bwcx-ljsm';
import { ErrCode } from '@common/enums/err-code.enum';
import { errCodeConfigs } from '@server/err-code-configs';
import { writeErrorResponse } from '@server/http/rl-response';

@ExceptionHandler(ValidationException)
export default class ValidationExceptionHandler implements IBwcxExceptionHandler {
  public catch(error: ValidationException, ctx: RequestContext) {
    ctx.error(
      `ValidationException caught: ${error.message}\n
      ua: ${ctx.request.headers['user-agent']}\n
      errors:`,
      JSON.stringify(error.errors, null, 2),
    );
    const msg = error.source === 'req' ? errCodeConfigs[ErrCode.IllegalParameters] : '响应数据校验失败';
    writeErrorResponse(ctx, {
      status: 422,
      code: ErrCode.IllegalParameters,
      msg,
    });
  }
}
