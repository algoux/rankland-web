import { Controller, InjectCtx, Param, Query, type RequestContext } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import { OverrideView, UseClientRoutes, PrimaryRenderMethod } from 'bwcx-client-vue/server';
import { RenderMethodKind } from 'bwcx-client-vue';
import ContestService from '@server/modules/contest/contest.service';
import ViewService from './view.service';
import { HtmlResponse } from '@server/response-handlers/html.response-handler';

@Controller('', { priority: -100 })
@HtmlResponse()
export default class ViewController {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,

    @Inject()
    private readonly service: ViewService,

    @Inject()
    private readonly contestService: ContestService,
  ) {}

  @OverrideView('Ranklist')
  public ranklistView(
    @PrimaryRenderMethod() renderMethod: RenderMethodKind,
    @Param('id') id: string,
  ) {
    return this.renderContestView(renderMethod, id);
  }

  @OverrideView('Collection')
  public collectionView(
    @PrimaryRenderMethod() renderMethod: RenderMethodKind,
    @Query('rankId') rankId?: string | string[],
  ) {
    return this.renderContestView(renderMethod, firstString(rankId));
  }

  @UseClientRoutes()
  public autoWiredView(@PrimaryRenderMethod() renderMethod: RenderMethodKind) {
    return this.service.render(renderMethod || RenderMethodKind.CSR);
  }

  private async renderContestView(renderMethod: RenderMethodKind, uk?: string) {
    const mode = renderMethod || RenderMethodKind.CSR;
    if (!uk) {
      return this.service.render(mode);
    }
    return this.service.render(mode, {
      onSuccessfulSsrRender: () => this.reportSsrView(uk),
    });
  }

  private reportSsrView(uk: string) {
    this.contestService.reportView(uk).catch((error) => {
      this.ctx.error(`[view] failed to report SSR view for ${uk}`, error);
    });
  }
}

function firstString(value?: string | string[]) {
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === 'string' && first ? first : undefined;
}
