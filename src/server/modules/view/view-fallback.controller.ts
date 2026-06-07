import { Controller, Get, InjectCtx } from 'bwcx-ljsm';
import type { RequestContext } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import { RenderMethodKind } from 'bwcx-client-vue';
import ViewService from './view.service';
import { HtmlResponse } from '@server/response-handlers/html.response-handler';

@Controller('', { priority: -999 })
@HtmlResponse()
export default class ViewFallbackController {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,

    @Inject()
    private readonly service: ViewService,
  ) {}

  @Get('*')
  public async fallbackNotFoundView() {
    const html = await this.service.render(RenderMethodKind.CSR);
    this.ctx.status = 404;
    return html;
  }
}
