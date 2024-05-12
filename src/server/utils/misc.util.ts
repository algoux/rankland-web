import type { RequestContext } from 'bwcx-ljsm';
import { Provide } from 'bwcx-core';
import Long from 'long';
import * as srk from '@algoux/standard-ranklist';
import { rankland_live_contest_common } from '@common/proto/rankland_live_contest';

@Provide()
export default class MiscUtils {
  public getIp(ctx: RequestContext): string {
    const ssrIp = ctx.req.socket.remoteAddress === '127.0.0.1' ? (ctx.request.headers.server_render_ip as string) : '';
    let ip = ssrIp || (ctx.request.headers['x-forwarded-for'] as string) || ctx.ip;
    if (ip.substr(0, 7) === '::ffff:') {
      ip = ip.substr(7);
    }
    return ip;
  }

  public formatTimeDuration(
    time: srk.TimeDuration,
    targetUnit: srk.TimeUnit = 'ms',
    fmt: (num: number) => number = (num) => num,
  ) {
    let ms = -1;
    switch (time[1]) {
      case 'ms':
        ms = time[0];
        break;
      case 's':
        ms = time[0] * 1000;
        break;
      case 'min':
        ms = time[0] * 1000 * 60;
        break;
      case 'h':
        ms = time[0] * 1000 * 60 * 60;
        break;
      case 'd':
        ms = time[0] * 1000 * 60 * 60 * 24;
        break;
      default:
        throw new Error(`Invalid source time unit ${time[1]}`);
    }
    switch (targetUnit) {
      case 'ms':
        return ms;
      case 's':
        return fmt(ms / 1000);
      case 'min':
        return fmt(ms / 1000 / 60);
      case 'h':
        return fmt(ms / 1000 / 60 / 60);
      case 'd':
        return fmt(ms / 1000 / 60 / 60 / 24);
      default:
        throw new Error(`Invalid target time unit ${targetUnit}`);
    }
  }

  public convertRLTimeDurationToSrk(
    timeValue: number | Long,
    timeUnit: rankland_live_contest_common.TimeUnit,
  ): srk.TimeDuration {
    switch (timeUnit) {
      case rankland_live_contest_common.TimeUnit.S:
        return [Long.isLong(timeValue) ? timeValue.toNumber() : timeValue, 's'];
      case rankland_live_contest_common.TimeUnit.MS:
        return [Long.isLong(timeValue) ? timeValue.toNumber() : timeValue, 'ms'];
      case rankland_live_contest_common.TimeUnit.US:
        return [Long.isLong(timeValue) ? timeValue.divide(1000).toNumber() : timeValue, 'ms'];
      case rankland_live_contest_common.TimeUnit.NS:
        return [Long.isLong(timeValue) ? timeValue.divide(1000000).toNumber() : timeValue, 'ms'];
      default:
        throw new Error('Unsupported TimeUnit');
    }
  }
}
