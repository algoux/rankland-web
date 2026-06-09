import type { MiddlewareNext, RequestContext } from 'bwcx-ljsm';

export const CHROME_DEVTOOLS_APPSPECIFIC_CONFIG_PATH = '/.well-known/appspecific/com.chrome.devtools.json';

export async function chromeDevtoolsProbeMiddleware(ctx: RequestContext, next: MiddlewareNext) {
  const requestPath = ctx.path || (ctx.url || '').split('?')[0];
  if (requestPath === CHROME_DEVTOOLS_APPSPECIFIC_CONFIG_PATH) {
    ctx.status = 204;
    return;
  }
  return next();
}
