import { Guard, IBwcxGuard, RequestContext } from 'bwcx-ljsm';

@Guard()
export default class AuthGuard implements IBwcxGuard {
  public async canPass(ctx: RequestContext) {
    return hasManagementToken(ctx);
  }
}

export function hasManagementToken(ctx: Pick<RequestContext, 'headers'>): boolean {
  const token = ctx.headers['x-token'];
  return typeof token === 'string' && token.length > 0 && token === process.env.AUTH_TOKEN;
}
