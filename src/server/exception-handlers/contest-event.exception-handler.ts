import { ExceptionHandler } from 'bwcx-ljsm';
import type { IBwcxExceptionHandler, RequestContext } from 'bwcx-ljsm';
import {
  ContestEventError,
  contestEventErrorStatus,
} from '@server/modules/contest/contest-event-errors';
import { writeErrorResponse } from '@server/http/rl-response';

@ExceptionHandler(ContestEventError)
export default class ContestEventExceptionHandler implements IBwcxExceptionHandler {
  public catch(e: ContestEventError, ctx: RequestContext) {
    ctx.warn(`ContestEventError caught: ${e.code}, url: ${ctx.url}, err: ${e.message}`);
    writeErrorResponse(ctx, {
      status: contestEventErrorStatus(e.code),
      code: e.code,
      msg: e.message,
      meta: e.metadata,
    });
  }
}
