import { ExceptionHandler } from 'bwcx-ljsm';
import type { IBwcxExceptionHandler, RequestContext } from 'bwcx-ljsm';
import {
  ContestEventError,
  contestEventErrorStatus,
} from '@server/modules/contest/contest-event-errors';
import { tryWriteContestEventBinaryErrorResponse } from '@server/modules/contest/contest-event-response';

@ExceptionHandler(ContestEventError)
export default class ContestEventExceptionHandler implements IBwcxExceptionHandler {
  public catch(e: ContestEventError, ctx: RequestContext) {
    ctx.warn(`ContestEventError caught: ${e.code}, url: ${ctx.url}, err: ${e.message}`);
    ctx.status = contestEventErrorStatus(e.code);
    if (
      tryWriteContestEventBinaryErrorResponse(ctx, {
        status: ctx.status,
        code: e.code,
        msg: e.message,
        metadata: e.metadata,
      })
    ) {
      return;
    }
    ctx.body = {
      success: false,
      code: e.code,
      msg: e.message,
      ...e.metadata,
    };
  }
}
