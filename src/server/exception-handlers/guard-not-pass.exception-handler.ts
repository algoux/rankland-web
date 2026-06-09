import { ExceptionHandler, GuardNotPassException } from 'bwcx-ljsm';
import type { IBwcxExceptionHandler, RequestContext } from 'bwcx-ljsm';
import { ErrCode } from '@common/enums/err-code.enum';
import { errCodeConfigs } from '@server/err-code-configs';
import { writeErrorResponse } from '@server/http/rl-response';

@ExceptionHandler(GuardNotPassException)
export default class GuardNotPassExceptionHandler implements IBwcxExceptionHandler {
  public catch(e: GuardNotPassException, ctx: RequestContext) {
    ctx.error(`GuardNotPassException caught: url: ${ctx.url}, ua: ${ctx.request.headers['user-agent']}, err:`, e);
    writeErrorResponse(ctx, {
      status: ctx.status || 200,
      code: ErrCode.Unauthorized,
      msg: errCodeConfigs[ErrCode.Unauthorized],
    });
  }
}
