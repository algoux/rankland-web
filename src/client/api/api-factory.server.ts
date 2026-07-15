import Axios from 'axios';
import type { ApiType } from '.';
import type { ICreateApiOpts } from './interfaces';

export class ApiFactory {
  static createInstance(opts: ICreateApiOpts = {}): ApiType {
    const origin = getServerLoopbackOrigin();
    return Axios.create({
      baseURL: `${origin}/api/`,
      timeout: 5000,
      headers: {
        Cookie: opts.cookie || '',
        referer: 'http://ssr_referrer',
        Accept: 'application/json',
        server_render_ip: opts.ip || '',
        'user-agent': opts.ua || 'BwcxServerRequest/0',
      },
    });
  }
}

export function getServerLoopbackOrigin(
  env: Record<string, string | undefined> = process.env,
): string {
  const parsedPort = Number(env.SERVER_PORT);
  const port = Number.isInteger(parsedPort) && parsedPort >= 1 && parsedPort <= 65_535 ? parsedPort : 3000;
  return `http://127.0.0.1:${port}`;
}
