import { ExceptionHandler } from 'bwcx-ljsm';
import type { IBwcxExceptionHandler, RequestContext } from 'bwcx-ljsm';
import { ErrCode } from '@common/enums/err-code.enum';
import { errCodeConfigs } from '@server/err-code-configs';
import { writeErrorResponse } from '@server/http/rl-response';

@ExceptionHandler(Error)
export default class GlobalExceptionHandler implements IBwcxExceptionHandler {
  public async catch(e: Error, ctx: RequestContext) {
    if (e.name === 'MulterError') {
      const code = (e as Error & { code?: string }).code;
      const errCode = code === 'LIMIT_FILE_SIZE' ? ErrCode.FileUploadTooLarge : ErrCode.FileUploadUnknown;
      ctx.warn(`File upload parsing failed: ${code || e.message}`);
      writeErrorResponse(ctx, {
        status: errCode === ErrCode.FileUploadTooLarge ? 413 : 200,
        code: errCode,
        msg: errCodeConfigs[errCode],
      });
      return;
    }

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
