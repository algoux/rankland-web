# Legacy API 收敛与关联项目迁移

Updated: 2026-07-24

本文档记录 RankLand 将已重构能力从 `rl-api.algoux.cn` 收敛到部署域名同源 `/api/v2` 的边界、运行时设计与关联项目契约。它不表示所有旧 API 已下线；未列入迁移范围的调用仍然属于 legacy。

## 调用边界

rankland-web 客户端的 Rankland service 同时持有两个依赖：

- typed `apiClient`：contest 详情与列表、collection、file metadata、statistics；浏览量使用同一客户端的独立上报方法。
- 单一 legacy adapter：仅用于 `/rank/search`。

现有 `GET /api/v2/public/contests` 和生成方法 `getPublicContests()` 保持名称及 DTO 不变。新增接口只有 `GET /api/v2/public/statistics`，生成方法为 `getPublicStatistics()`。

页面沿用原有 `IApiRanklistInfo` 模型，并在 service 边界映射：

| v2 字段     | 页面字段    |
| ----------- | ----------- |
| `_id`       | `id`        |
| `uk`        | `uniqueKey` |
| `srkFileID` | `fileID`    |
| `viewCount` | `viewCnt`   |

详情响应没有 `createdAt`、`updatedAt` 和旧 `content` 的新来源，因此这些页面模型字段为可选；列表响应仍会映射时间字段。

## 静态榜单文件加载

静态页按以下顺序加载：

1. `getPublicContest({ uk })`；
2. 从 contest 取得非空 `srkFileID`；
3. `getPublicFile({ id })`；
4. 请求 file metadata 的 `url` 并解析 SRK JSON。

contest/file 不存在、contest 未关联 SRK 文件，或原始文件返回 404，统一进入页面已有的 Not Found 分支。`IApiRanklist.srkUrl` 保存 metadata 原始 URL 并直接传给 renderer，不再拼接 `/file/download`。

浏览器直接使用相对 `/file/...` URL。SSR 只允许用 `http://127.0.0.1:${SERVER_PORT || 3000}` 解析相对文件 URL；typed API 的 SSR Axios 实例也从同一 loopback origin 构造。该逻辑不读取请求 Host，避免把不可信 Host 变成服务端请求目标，也不需要新的 API base 环境变量。

现有 contest 详情、collection 和 SRK 内容缓存继续保留。文件内容缓存命中时仍读取 file metadata，以便把当前 URL 传给 renderer。

## 列表、统计与浏览量

服务端 RanklistService 直接调用 ContestService，只保留未删除且 `srkFileID != null` 的 contest，并按 `createdAt DESC, id DESC` 返回，不再外呼 `/rank/listall`，也不再维护额外 Redis 列表缓存。搜索页最近列表和 RSS 保持该新到旧顺序；Sitemap 在分页前整体反转，`sitemap_ranklist_vol_*.txt` 按旧到新递增输出并分页。

`GET /api/v2/public/statistics` 使用同一静态榜单条件，返回数量以及 `view_count` 总和。

详情 GET 保持无副作用。Ranklist 页和带 `rankId` 的 Collection 页按实际渲染来源拆分上报：

- SSR：ViewController 使用 bwcx `@OverrideView` 接管这两个页面；未被 `ssr=0`/`ssr=false` 强制转为 CSR 且渲染结果为 2xx 时，在 HTML 渲染完成后 fire-and-forget 调用 `ContestService.reportView()`。上报 Promise 不参与 SSR 返回等待；Redis 页面缓存命中也会对本次页面请求独立触发一次。
- 浏览器：页面 `asyncData` 把 `isClient` 写入 `reportViewOnClient` prop。SSR 初始状态及其 hydration 为 `false`，不重复上报；CSR 首屏和后续前端路由/Collection 榜单切换为 `true`，继续调用公开 view-report 接口。

浏览器 reporter 保留以下规则：

- 路由 UK 必须与已加载数据 UK 一致；
- 发送前记录最后一次尝试 UK，避免 `updated` 重复；
- A→B→A 视为三次访问；
- 失败只记录日志，不重试或阻断页面；
- 成功后当前页面展示的 `viewCnt` 本地加一；SSR 的异步上报发生在 HTML 生成后，不回写本次 HTML 中的计数。

Not Found SSR（非 2xx）、transient load-failed（skip-cache）、SSR 失败后的 CSR fallback、无 `rankId` 的 Collection 页和强制 CSR 的服务端入口不触发服务端上报。

## 配置与部署

仅剩以下两个旧 API 配置，且不兼容读取旧变量名：

```text
legacyApiBaseClient <- LEGACY_API_BASE_CLIENT
legacyApiBaseServer <- LEGACY_API_BASE_SERVER
```

默认值均为 `https://rl-api.algoux.cn`。`cdnApiBaseClient/Server`、`CDN_API_BASE_CLIENT/SERVER`、`LIVE_POLLING_INTERVAL` 与 `WS_BASE` 已移除；`CDN_BASE`、`SRK_STORAGE_BASE` 和 `FILE_BASE_URL` 继续保留。部署仓库变量与实际运行环境必须同步改名为 `LEGACY_API_BASE_*`。

Playwright E2E 固定使用 `rankland_e2e` schema，并在每次启动前重建该 schema；账号必须预先拥有 `rankland_e2e.*` 权限。SRK 文件写入系统临时目录，旧 mock server 只提供 search 与 playground 外部 URL fixture；live 用例直接使用 API v2 服务端。默认 fixture 会拦截浏览上报，专门用例单独验证请求次数。

## 关联项目

- `srk-live-crawler-oj3`：开发继续加载 `rl-v2.dev`；生产 API host 强制为 `https://rl.algoux.cn/api/v2`，`x-token` 仍来自现有生产配置。`/ranking/record/:id` 保持 legacy host。
- `Kessoku-the-Overlay`：默认 API base 为 `https://rl.algoux.cn/api/v2`。持久化配置只迁移旧官方域名的 bare、`/api`、`/api/v2` 与尾斜杠等价形式；自定义地址不变。
- `srk-collection`：通过共享 helper 统一 v2 host、response envelope、错误码和 `x-token`。同步顺序为 contest 查询/创建、SHA metadata 复用或 `RankMain` 上传、PATCH contest metadata/`srkFileID`；创建时提供空 users，更新时不发送 users，以免清空已有 contest users。collection content 直接传 JSON。filename 修复使用 contest/file metadata，apply 时上传新文件并 PATCH，不主动删除旧文件。所有 dry-run 路径禁止远端写入。

## 保留的 legacy 范围

目前仅 `/rank/search` 继续使用 `LEGACY_API_BASE_CLIENT/SERVER`。live 静态榜单接口和 WebSocket 已由 API v2 protobuf 事件补拉与 SSE 水位通知替代，详见 [`live-api-v2-design.md`](./live-api-v2-design.md)。
