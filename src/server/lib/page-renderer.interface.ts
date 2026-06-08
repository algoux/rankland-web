import type { RequestContext, ApplicationMiddleware } from 'bwcx-ljsm';

export const IPageRenderer = Symbol('IPageRenderer');
export interface PageRenderOptions {
  defaultStatus?: number;
}

export interface IPageRenderer {
  render: (mode: 'ssr' | 'csr', ctx: RequestContext, options?: PageRenderOptions) => string | Promise<string>;
  init?: () => Promise<ApplicationMiddleware>;
  destory?: () => Promise<void>;
}
