import { ExceptionHandler } from 'bwcx-ljsm';
import type { IBwcxExceptionHandler, RequestContext } from 'bwcx-ljsm';
import statuses from 'statuses';
import HttpException from '@server/exceptions/http.exception';
import { writeErrorResponse } from '@server/http/rl-response';

@ExceptionHandler(HttpException)
export default class HttpExceptionHandler implements IBwcxExceptionHandler {
  public catch(e: HttpException, ctx: RequestContext) {
    ctx.error(`HTTP exception ${e.code}:\n
          url: ${ctx.url}\n
          err: ${e.message}`);

    const msg = e.code === 404 ? '请求地址不存在' : statuses[e.code] || 'Unknown Error';
    if (ctx.url.indexOf('/api/') !== -1) {
      writeErrorResponse(ctx, {
        status: e.code,
        code: e.code,
        msg,
      });
      return;
    }
    // Non-API routes (e.g. SSR pages) keep their default rendering; only the status is set.
    ctx.status = e.code;
  }
}
