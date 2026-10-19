# `/live` API v2 事件榜单设计

Updated: 2026-10-24

## 范围

`/live/:id` 是 CSR 页面。页面不再读取 legacy `/ranking/config/:uk`、`/ranking/:id`，也不再轮询静态 SRK 或连接榜单 WebSocket。比赛元数据来自 API v2，榜单状态完全由比赛事件重放得到。

页面只保留一个行为开关：

- `scrollSolution=1`：除更新榜单外，同时显示实时提交结果；
- 历史 `token` query 可以继续出现在 URL 中，但不参与请求、缓存 key、会话签名或其他业务逻辑。

## 数据流

数据链路分成三个边界：

1. `HttpLiveContestTransport`
   - 获取 JSON 比赛元数据和事件流状态；
   - 以 protobuf 拉取事件页；
   - 订阅只包含高水位的 SSE `events-available`。
2. `ContestEventConsumer`
   - 管理 checkpoint、stream revision、generation、重试和会话取消；
   - 对外逐页发布带完成标记的 initial events，并发布 live events、reset 和 fatal error。
3. `LiveRanklistProjector`
   - 只接收已规范化的 `LiveContestEvent`；
   - 不依赖 Axios、protobuf numeric enum 或 Long；
   - 输出新的 SRK Ranklist，以及可选的滚动项。

因此 SSE 不承担正确性：它只唤醒 catch-up；实际事件始终由可补拉的 HTTP `/events` 提供。

## Protobuf 传输

浏览器 decoder 从 `src/common/shared/proto/rankland_live_contest/client.proto` 生成并纳入版本管理：

- `src/client/proto/rankland_live_contest_client.js`
- `src/client/proto/rankland_live_contest_client.d.ts`

`pnpm gen:proto` 同时生成服务端完整 CommonJS contract 和浏览器静态 ESM、decode-only contract。生成工具固定在 `package.json`，由 `scripts/protobufjs-cli.cjs` 加载，不在生成期间临时安装依赖。`pnpm check:proto` 用于 CI 中检查生成结果是否与 contract 同步。

事件请求固定为：

```text
GET /api/v2/public/contests/:uk/events
Accept: application/protobuf
responseType: arraybuffer
compactProgress=true
limit=1000
afterEventId=<checkpoint>
streamRevision=<revision>
```

每个请求携带当前 generation 的 `AbortSignal`，并保留原始 HTTP response。只有同时满足以下条件才解码：

- HTTP 响应不是失败状态；
- `X-RL-Resp-Success: true`；
- `Content-Type` 为 `application/protobuf` 或 `application/x-protobuf`。

失败响应不解析 body，而从 `X-RL-Resp-Code`、`X-RL-Resp-Msg`、`X-RL-Resp-Meta` 和 `Retry-After` 构造错误。JSON 成功响应、缺少成功头或 PB 解码失败均属于不可重试协议错误，checkpoint 不前进。

decoder 初始化 `protobufjs/minimal` 的 Long 支持。`TimeDuration.value` 在单位换算前始终保持 Long；NEW 事件还保留规范化的十进制纳秒字符串，用于冻结边界和 FB 顺序比较。只有换算为 SRK 秒值后才进行安全 Number 转换。

PB 代码由 Live 路由子树动态引用。生产构建中 decoder 和 protobuf runtime 位于独立的 `live-contest-protobuf` 懒加载 chunk，不进入首页或公共首屏 chunk。

## Catch-up 状态机

一次页面会话由 `{uk, generation, streamRevision}` 标识。

启动流程：

1. 读取 JSON `/event-stream` 状态；
2. 固定当时的 `lastEventId` 为 initial target；
3. 从 checkpoint `0` 串行拉取 PB 页；
4. initial target 以内的事件逐页送入投影器，只维护紧凑索引，不保留完整历史事件数组；
5. 到达 initial target 后一次性完成行计算并发布历史榜单；
6. 若响应已经越过 initial target，从该边界重新请求，越界部分作为实时批次发布；
7. 初始化完成后订阅 SSE。

游标只按响应的 `checkpointEventId` 前进，不能用最后一个可见 event ID 推断。compact 页即使不含事件也必须推进 checkpoint。任意时刻最多存在一个 `/events` 请求。

SSE 只监听具名 `events-available`：

- 低于当前 revision 的通知丢弃；
- 同 revision 只抬高 target watermark；
- 更高 revision 从 `0` 创建新 generation；
- `resetRequired` 同样创建新 generation，并保留同 revision 下已知的更高 target。

同 revision 的重复/高频 SSE 水位由单一 catch-up runner 和一个 follow-up 标记合并。运行中的请求只抬高 target，不为每条通知创建 Promise waiter；请求返回与 runner 清理之间的竞争窗口由 follow-up 标记补一次检查。

stream state 与事件页请求都携带当前 generation 的 `AbortSignal`。比赛切换、页面卸载或 reset 会中止当前请求；迟到响应必须同时匹配 uk、generation 和 revision，否则整体丢弃。transport 会把底层 Axios/API 错误统一为带 `aborted`、`transient` 和可选 `retryAfterMs` 的失败，consumer 不探测具体 HTTP 客户端错误结构。

429、503、其他 5xx 和网络错误保留现有 Ranklist/revision/checkpoint 后重试，退避最多 30 秒，并服从更长的 `Retry-After`。404 或 `ContestNotFound` 映射 Not Found；422、其他业务错误和 PB 协议错误映射 Load Failed。

## Ranklist 投影

投影器从 metadata 的 contest、users、problems、sorter、markers 和 series 创建 SRK `0.3.13` 空榜，并原样保留 score 或缺省 sorter。事件 contract 只提供判题结果、不提供题目分值，因此非 ICPC/缺省 sorter 的行重建使用内部 ICPC-compatible 结果聚合来生成 statuses 与已通过题数，但不会篡改输出 Ranklist 的 sorter 元数据。

内部索引包括：

- solution ID 到规范化 solution；
- user ID 到其 solution ID 列表；
- problem 到原始 AC solution 的可删除最小堆；
- problem 到当前 FB solution。

事件规则：

- `NEW`：登记 solution；提交时间落在冻结区间时立即投影为 `?`。
- `PROGRESS`：不改变榜单。
- `SETTLE`：PD/JG/CNL 不视为已结算；其他结果更新 solution 并重建受影响用户。
- `CHANGE`：用事件给出的 previous result 构建滚动项，用新结果完整重建用户。
- `CONFIG_CHANGE`：记录 warning，本页面会话不热更新配置。

服务端历史 FB 统一按原始 AC 处理。FB 在客户端按提交纳秒时间、再按 NEW event ID 稳定计算；投影时同时标记 status 汇总结果和对应 solution 明细，避免匿名题目公开后详情弹窗丢失 First Blood 语义。可删除最小堆让 AC 新增和 CHANGE 撤销保持 `O(log AC)`，不会因普通 WA 或新增 AC 扫描整题 AC 集合。每批事件结束后先发布新的 Ranklist 和 rows 顶层引用，再构造滚动项。滚动草稿会保留同批内每个 SETTLE/CHANGE 当时的结果，避免后续同 solution 事件覆盖前一项；分数和 FB 则以完整批次应用后的榜单为准。

冻结起点采用服务端相同的 `max(0, duration - frozenDuration)`，并以纳秒十进制字符串做包含边界比较。问题 alias 在补全默认字母后必须唯一，避免空 alias 与显式 alias 碰撞后把事件投影到错误题目。

历史批次不产生滚动项。实时规则为：

- 非冻结 NEW：不显示；
- 冻结 NEW：显示 `?`；
- SETTLE：显示该事件的最终结果；
- CHANGE：显示 `previousResult → currentResult`。

## 页面与滚动栏

`asyncData` 只读取 API v2 比赛元数据。mounted 后创建 projector 和 consumer；路由 ID 变化或卸载时停止旧会话。

`ScrollSolution` 保持原视觉组件，只扩展为 320px：

- 原有 score、user、problem 区域合计 205px；
- 结果区域固定为 `45px + 25px + 45px`；
- CHANGE 显示前结果、箭头、后结果；
- 普通项隐藏左侧前结果和箭头占位，当前结果固定在右侧 45px；
- `resetSolutions()` 清除可见项、待显示队列和所有计时器。

reset 时页面清空滚动队列，并用空投影继续从事件 `0` 重建。

实时 HTTP 页仍逐页、同步应用到投影器，以保留每页滚动项的分数与 FB 语义；Vue Ranklist 顶层赋值按 animation frame 合并，只发布该帧内最新榜单，避免 backlog catch-up 对 `StyledRanklist` 反复触发全量派生。滚动队列使用 head index 做均摊 `O(1)` 出队，空队列不保留轮询 timer，被可见上限淘汰的项目会同步取消 dismissal timer。比赛切换、fatal、reset 和卸载都会清空待发布榜单、滚动项与计时器。

## 验证边界

单元测试分别覆盖 transport、PB decoder、consumer、projector、滚动状态和页面 metadata。E2E fixture 在真实 API v2 数据库中写入完整 event stream，浏览器通过真实 protobuf `/events` 和 SSE catch-up 更新页面；测试还断言不存在 `/ranking/*` 和 WebSocket 请求。

E2E server 将 `CONTEST_EVENT_READ_CACHE_MODE` 固定为 `off`：fixture 是在 server 启动前直接
写库，不模拟生产环境的缓存写穿生命周期。此设置只绕开服务端读缓存层，controller、
content negotiation、protobuf 编码、事件 append/reset、Redis 通知与 SSE 都仍走真实 API v2
实现。

CCPC26 Live fixture 同样使用真实 v2 contest 和 event stream。每个动态用例先 reset revision，
再追加确定性的初始事件，并通过 SSE + PB catch-up 验证题目公开、CHANGE 纠正、回放优先级
和提交详情隐私；不再保留 legacy `/ranking/*` 或 WebSocket test stub。
