import { Guard, IBwcxGuard, RequestContext } from 'bwcx-ljsm';

@Guard()
export default class AuthGuard implements IBwcxGuard {
  public async canPass(ctx: RequestContext) {
    return ctx.headers['x-token'] && ctx.headers['x-token'] === process.env.AUTH_TOKEN;
  }
}
