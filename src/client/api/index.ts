import Axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { IBwcxApiRequestAdaptorArgs } from 'bwcx-api-client';
import { inject } from 'vue';
import { ApiClient } from '@common/api/api-client';
import { ResponseParser } from '@common/api/response-parser';

export interface IRequestExtraOpts {
  signal?: AbortSignal;
}

export class ApiClientFactory {
  public static createInstance(requestAdaptor: AxiosInstance) {
    const request = (opts: IBwcxApiRequestAdaptorArgs<IRequestExtraOpts>) => {
      const { extraOpts = {} } = opts;
      const config: Omit<typeof opts, 'metadata' | 'extraOpts'> = { ...opts };
      // @ts-ignore
      delete config.metadata;
      // @ts-ignore
      delete config.extraOpts;
      config.url = config.url.replace(/^\/api/, '');
      config.signal = extraOpts.signal;
      return requestAdaptor
        .request(config)
        .then((response) => response.data)
        .catch((err) => {
          if (Axios.isCancel(err)) {
            console.log('[ApiClient] request cancelled');
            return;
          }
          console.error('[ApiClient] request error', err, config);
          throw err;
        });
    };
    return new ApiClient({ request }, new ResponseParser());
  }
}

export type ApiType = AxiosInstance;
export type ApiClientType = ApiClient<IRequestExtraOpts>;
export { ApiRequestException } from '@common/api/api-request.exception';

export const API_REQUEST_TOKEN = Symbol('ApiRequest');
export const API_CLIENT_TOKEN = Symbol('ApiClient');

export function useApiRequest() {
  return inject<AxiosInstance>(API_REQUEST_TOKEN);
}

export function useApiClient() {
  return inject<ApiClient<IRequestExtraOpts>>(API_CLIENT_TOKEN);
}
