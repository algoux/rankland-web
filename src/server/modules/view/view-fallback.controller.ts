import { Controller, Get, InjectCtx, type RequestContext } from 'bwcx-ljsm';
import { HtmlResponse } from '@server/response-handlers/html.response-handler';

// Keep unknown URLs independent of the Vue renderer and its caches/dependencies.
const NOT_FOUND_HTML = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Not Found | RankLand</title>
  <style>
    :root { color-scheme: light dark; }
    body { margin: 0; padding: 24px; font-family: system-ui, sans-serif; text-align: center; }
    main { margin: 15vh auto; max-width: 40rem; }
    h1 { font-size: 1.5rem; }
    a { color: inherit; }
  </style>
</head>
<body>
  <main data-id="not-found-page">
    <h1>404 Not Found · 你来到了榜单荒地</h1>
    <p><a href="/">返回首页</a></p>
  </main>
</body>
</html>`;

@Controller('', { priority: -999 })
@HtmlResponse()
export default class ViewFallbackController {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
  ) {}

  @Get('*')
  public fallbackNotFoundView() {
    this.ctx.status = 404;
    return NOT_FOUND_HTML;
  }
}
