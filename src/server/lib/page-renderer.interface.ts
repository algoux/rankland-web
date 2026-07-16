import type { RequestContext, ApplicationMiddleware } from 'bwcx-ljsm';

export const IPageRenderer = Symbol('IPageRenderer');
export interface PageRenderOptions {
  defaultStatus?: number;
  requestLanguages?: readonly string[];
  onSuccessfulSsrRender?: () => void;
}

export function triggerSuccessfulSsrRender(
  rendered: { status: number; skipCache?: boolean },
  callback?: () => void,
  onError?: (error: unknown) => void,
) {
  if (
    !callback
    || rendered.skipCache
    || rendered.status < 200
    || rendered.status >= 300
  ) {
    return;
  }
  try {
    callback();
  } catch (error) {
    onError?.(error);
  }
}

export interface IPageRenderer {
  render: (mode: 'ssr' | 'csr', ctx: RequestContext, options?: PageRenderOptions) => string | Promise<string>;
  init?: () => Promise<ApplicationMiddleware | void>;
  destory?: () => Promise<void>;
}
