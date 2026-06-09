import 'bwcx-ljsm';
import 'koa';
import type { ResponseContentType } from '@server/http/content-type';

declare module 'bwcx-ljsm' {
  interface RequestContext {
    // add your extra ctx properties
    info: (...messages: any[]) => void;
    warn: (...messages: any[]) => void;
    error: (...messages: any[]) => void;
  }
}

declare module 'koa' {
  interface DefaultState {
    /**
     * The response content type resolved for the current request by
     * ContentNegotiationMiddleware. Read by the response handler and exception
     * handlers to decide how to wrap the response.
     */
    respContentType?: ResponseContentType;
  }
}
