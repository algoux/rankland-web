import { describe, expect, it } from 'vitest';
import type { RequestContext } from 'bwcx-ljsm';
import MiscUtils from '../misc.util';

function makeCtx(opts: {
  remoteAddress?: string;
  headers?: Record<string, string | undefined>;
  ip?: string;
}): RequestContext {
  return {
    req: { socket: { remoteAddress: opts.remoteAddress } },
    request: { headers: opts.headers ?? {} },
    ip: opts.ip,
  } as unknown as RequestContext;
}

describe('MiscUtils.getIp', () => {
  const utils = new MiscUtils();

  it('strips the ::ffff: IPv4-mapped prefix', () => {
    expect(utils.getIp(makeCtx({ remoteAddress: '1.2.3.4', ip: '::ffff:1.2.3.4' }))).toBe('1.2.3.4');
  });

  it('prefers server_render_ip for local requests', () => {
    const ctx = makeCtx({
      remoteAddress: '127.0.0.1',
      headers: { server_render_ip: '9.9.9.9' },
      ip: '127.0.0.1',
    });
    expect(utils.getIp(ctx)).toBe('9.9.9.9');
  });

  it('falls back to x-forwarded-for', () => {
    const ctx = makeCtx({
      remoteAddress: '10.0.0.1',
      headers: { 'x-forwarded-for': '8.8.8.8' },
      ip: '10.0.0.1',
    });
    expect(utils.getIp(ctx)).toBe('8.8.8.8');
  });

  it('returns an empty string when no address is resolvable (closed socket)', () => {
    // A destroyed socket has remoteAddress undefined and koa may expose no ip.
    expect(utils.getIp(makeCtx({ remoteAddress: undefined, ip: undefined }))).toBe('');
  });
});
