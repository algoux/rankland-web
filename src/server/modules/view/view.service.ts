import { Service, InjectCtx } from 'bwcx-ljsm';
import type { RequestContext } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import { RenderMethodKind } from 'bwcx-client-vue';
import { IPageRenderer, type PageRenderOptions } from '@server/lib/page-renderer.interface';
import { parseAcceptLanguageHeader } from '@common/request-language';

@Service()
export default class ViewService {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,

    @Inject(IPageRenderer)
    private readonly renderer: IPageRenderer,
  ) {}

  public async render(mode: RenderMethodKind, options: PageRenderOptions = {}) {
    const renderOptions = this.resolveRenderOptions(options);
    if (mode === RenderMethodKind.CSR || shouldForceCsr(this.ctx.query.ssr)) {
      return await this.renderer.render('csr', this.ctx, renderOptions);
    }
    if (mode === RenderMethodKind.SSR) {
      return await this.renderer.render('ssr', this.ctx, renderOptions);
    }
    throw new Error(`Unsupported render mode ${mode}`);
  }

  private resolveRenderOptions(options: PageRenderOptions) {
    const requestLanguages = parseAcceptLanguageHeader(this.ctx.headers?.['accept-language']);
    return requestLanguages ? { ...options, requestLanguages } : options;
  }
}

function shouldForceCsr(ssrQuery: unknown) {
  const value = Array.isArray(ssrQuery) ? ssrQuery[0] : ssrQuery;
  return value === '0' || value === 'false';
}
