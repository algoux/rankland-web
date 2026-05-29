import { ResponseHandler } from 'bwcx-ljsm';
import type { IBwcxResponseHandler, RequestContext } from 'bwcx-ljsm';
import { isBinaryResponsePayload, writeRlRespHeaders } from './binary-response';

@ResponseHandler()
export default class DefaultResponseHandler implements IBwcxResponseHandler {
  public handle(response: any, ctx: RequestContext) {
    if (isBinaryResponsePayload(response)) {
      writeRlRespHeaders(ctx, response);
      return response.body;
    }
    return {
      success: true,
      code: 0,
      data: response,
    };
  }
}
