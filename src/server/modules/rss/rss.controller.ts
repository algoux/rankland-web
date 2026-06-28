import { Controller, Get, InjectCtx, RequestContext } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import { CustomResponse } from '@server/response-handlers/custom.response-handler';
import RssService from './rss.service';

@Controller('', { priority: 100 })
@CustomResponse()
export default class RssController {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,

    @Inject(RssService)
    private readonly service: RssService,
  ) {}

  @Get('/rss.xml')
  public async getRanklistRss() {
    this.ctx.set('Content-Type', 'application/rss+xml; charset=utf-8');
    return this.service.getRanklistRssXml();
  }
}
