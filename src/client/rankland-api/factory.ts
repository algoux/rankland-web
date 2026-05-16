import Axios from 'axios';
import { RanklandApiService } from '@common/rankland-api';
import { AxiosRanklandApiAdapter } from './adapters';

interface CreateRanklandApiServiceOptions {
  isClient: boolean;
  requestHeaders?: Record<string, string | string[] | undefined>;
}

function readHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | string[] | undefined {
  return headers[name] ?? headers[name.toLowerCase()];
}

function getServerHeaders(requestHeaders: Record<string, string | string[] | undefined> = {}) {
  return {
    Cookie: readHeader(requestHeaders, 'Cookie') || '',
    'user-agent': readHeader(requestHeaders, 'user-agent') || '',
    server_render_ip: readHeader(requestHeaders, 'server_render_ip') || '',
  };
}

export function createRanklandApiService(opts: CreateRanklandApiServiceOptions): RanklandApiService {
  const apiBaseURL = opts.isClient
    ? process.env.RANKLAND_API_BASE_CLIENT || '/api'
    : process.env.RANKLAND_API_BASE_SERVER || 'http://127.0.0.1:3000/api';
  const cdnApiBaseURL = opts.isClient
    ? process.env.RANKLAND_CDN_API_BASE_CLIENT || '/api'
    : process.env.RANKLAND_CDN_API_BASE_SERVER || 'http://127.0.0.1:3000/api';
  const headers = opts.isClient ? {} : getServerHeaders(opts.requestHeaders);

  const api = Axios.create({
    baseURL: apiBaseURL,
    timeout: 30000,
    headers,
  });
  const cdnApi = Axios.create({
    baseURL: cdnApiBaseURL,
    timeout: 30000,
    headers,
  });

  return new RanklandApiService({
    api: new AxiosRanklandApiAdapter(api),
    cdnApi: new AxiosRanklandApiAdapter(cdnApi),
  });
}
