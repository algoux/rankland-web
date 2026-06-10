import { Controller, Get, InjectCtx, RequestContext } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import HttpException from '@server/exceptions/http.exception';
import { CustomResponse } from '@server/response-handlers/custom.response-handler';
import SitemapService from './sitemap.service';

@Controller('', { priority: 100 })
@CustomResponse()
export default class SitemapController {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,

    @Inject(SitemapService)
    private readonly service: SitemapService,
  ) {}

  @Get('/sitemap.xml')
  public async getSitemapIndex() {
    this.ctx.set('Content-Type', 'application/xml; charset=utf-8');
    return this.service.getSitemapIndexXml();
  }

  @Get('/sitemap_ranklist_vol_:page.txt')
  public async getRanklistSitemapPage() {
    const page = Number((this.ctx as any).params?.page);
    if (!Number.isInteger(page) || page < 1) {
      throw new HttpException(404);
    }
    this.ctx.set('Content-Type', 'text/plain; charset=utf-8');
    return this.service.getRanklistSitemapText(page);
  }
}
