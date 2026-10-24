# Contest Event Notification Operations

Updated: 2026-07-23

本文档是比赛事件可用通知的生产部署与故障处理 runbook。协议说明见
[Contest v2 API](contest-api.md)，架构依据见
[Contest Event Architecture](contest-event-architecture.md) 与
[ADR 0001](adr/0001-distribute-contest-event-availability-with-redis-pubsub.md)。读缓存的启动配置、发布门禁与回滚见
[Contest Event Read Cache Operations](contest-event-read-cache-operations.md)。

## 保证与前提

- MySQL 是比赛事件和事件高水位的唯一事实源；SSE 与 Redis 只发送可合并提示。
- 写入实例在事务提交后先更新或 fail-close 本机读缓存，再通知本机 SSE Hub，最后 best-effort 发布 Redis Pub/Sub。
- 每个实例默认每 3 秒批量校准本机 SSE Hub 与驻留读缓存活跃集合的并集；周期校准始终开启，不只在 Redis 重连后运行，配置上限不得超过 5 秒。
- Redis 正常且目标实例已经确认 `SUBSCRIBE` ACK 时，跨实例通知目标为 commit 后 1 秒内到达。
- Redis 丢消息、subscriber 断线或写实例在 commit 后、publish 前退出时，只有在 MySQL 健康且一次
  权威批量查询在 1 秒内完成的前提下，才承诺 6 秒内收敛。
- Redis 故障 fail-open，不改变 `/api/checkHealth`，也不能把已提交的 append/reset 响应改成失败。
- MySQL 不健康时无法承诺 6 秒恢复窗口；新写本身也可能失败。

公开 SSE route、`events-available` event 和 `{uk, latestEventId, streamRevision}` payload 保持不变。
服务端约每 15 秒发送 `: heartbeat\n\n` comment；它只维持连接，不是业务事件。

## 拓扑与配置

同一部署的所有 RankLand 应用实例必须：

1. 连接同一个 MySQL write primary；
2. 连接同一个当前支持的 standalone Redis endpoint；
3. 使用完全相同且非空的 `REDIS_NAMESPACE`。

不同环境和独立部署必须使用不同 namespace。Redis Pub/Sub channel 是：

```text
<REDIS_NAMESPACE>:contest-event-availability:v1
<REDIS_NAMESPACE>:contest-event-read-cache-control:v1
```

第二个严格 channel 只传播 delete/visibility metadata invalidate，不扩展第一个 watermark envelope，也不携带事件正文。

Redis Pub/Sub 不按 logical database 隔离，`REDIS_DB` 不能替代 namespace。生产环境缺失或传入空白
`REDIS_NAMESPACE` 时应用拒绝启动；非生产默认 `rankland:local`。首期不支持 Sentinel/Cluster 配置。

每个 app service 使用同一组连接参数；以下片段与应用默认值一致，但多容器部署应显式把 Redis host
设为所有容器都可达的地址：

```yaml
environment:
  MYSQL_HOST: ${MYSQL_HOST:?MYSQL_HOST is required}
  MYSQL_PORT: ${MYSQL_PORT:-3306}
  MYSQL_DB: ${MYSQL_DB:?MYSQL_DB is required}
  MYSQL_USER: ${MYSQL_USER:?MYSQL_USER is required}
  MYSQL_PASS: ${MYSQL_PASS:?MYSQL_PASS is required}
  REDIS_HOST: ${REDIS_HOST:-127.0.0.1}
  REDIS_PORT: ${REDIS_PORT:-6379}
  REDIS_DB: ${REDIS_DB:-0}
  REDIS_PASS: ${REDIS_PASS:-}
  REDIS_NAMESPACE: ${REDIS_NAMESPACE:?REDIS_NAMESPACE is required}
```

复制 app-1 为 app-2/app-3 时只修改 service/container/host port，不修改上述共享数据库、Redis endpoint
或 namespace。容器内的 `127.0.0.1` 指向当前容器；外部 Redis 必须使用容器可达的 service name 或地址。
性能环境变量不在 Compose 部署模板中重复列举；完整默认值、约束和调优说明见
[服务端性能配置](server-performance-configuration.md)。

本功能没有数据库 migration 或 Redis 持久 key。仍需按正常发布流程确认仓库已有 migrations 已全部执行。

### 通知波调度

SSE availability hint 支持按比赛合并并分片发送，用来平滑同一 watermark 后的 HTTP catch-up
连接波。该能力不改变 MySQL 权威、Redis envelope、公开 SSE payload、heartbeat 或慢客户端
backpressure 语义。当前默认使用已通过本机 loadtest 的 `25ms / 32 shards / 200ms`；低并发低延迟
场景或紧急回滚可恢复 `0 / 1 / 0`。环境变量范围与逐项含义集中记录在
[服务端性能配置](server-performance-configuration.md)。

配置必须满足 `coalesceWindowMs + 2 * fanoutWindowMs <= 500ms`。两轮预算覆盖 active cycle
期间又到达更新 watermark 的最坏补发；它仍低于现有 Redis 正常路径 1 秒目标。首个 shard
在合并窗口结束后立即发送，其余 shard 在 fanout window 内均匀展开；每轮轮换 first shard，
避免固定 cohort 长期先发或后发。

active cycle 中到达更新 watermark 时，尚未发送的 shard 直接收到新值；已收到旧值的 client
在 follow-up cycle 补齐。per-client 单调门控会抑制新值重复写入。新连接的 initial authority
不等待调度窗口，但若本机已经接受更高 live watermark，initial 不能把 client 回退。close、delete、
drain 都会取消对应 timer/state；append HTTP 只等待本机 Hub 接受调度，不等待所有 shard 写出。

本机 4-worker follow-up 先验证 `25ms / 16 shards / 200ms` 在 5,000 viewers、10 分钟 steady
的三组固定 seed 全部通过；随后同镜像、同 seed 的 20,000-viewer 16→32→16 反序 A/B 三轮也全部
通过，32 shards 相对两个 16-shard 基线都降低 HTTP/ACK 尾部和 listener drops。当前本机
local-machine/smoke/practical profile 因此使用 `25ms / 32 shards / 200ms`，代码默认值现已与该
profile 对齐。该默认选择不等同于任意目标环境的容量承诺；紧急回滚只需恢复 `0 / 1 / 0` 并整批
重启实例，不需要清理数据库或 Redis。

## 自动化 smoke

production build 后可运行核心多进程验收：

```bash
RUN_NOTIFICATION_SMOKE=true \
REDIS_NAMESPACE=rankland-smoke \
AUTH_TOKEN=rankland-smoke \
pnpm run test:notification-smoke
```

脚本使用真实 MySQL、Redis 和多个 production Node 子进程，覆盖本机/跨进程通知、commit→publish
进程退出、namespace 分区、Redis TCP 黑洞、self echo 去重、heartbeat、软删除和 5 秒退出预算；临时
比赛、进程和连接均在 `finally` 清理。CI 在 build 后执行该核心模式。

在装有 nginx 的验收机上额外运行：

```bash
RUN_NOTIFICATION_SMOKE=true \
RUN_NGINX_NOTIFICATION_SMOKE=true \
REDIS_NAMESPACE=rankland-smoke \
AUTH_TOKEN=rankland-smoke \
pnpm run test:notification-smoke
```

可用 `NGINX_BIN` 指定二进制。该模式生成临时 upstream 配置并验证 response headers、关闭 buffering、
75 秒 read timeout 和 heartbeat。脚本不把同机多进程伪装成 A4：两台真实机器的网络路径以及浏览器
`EventSource` 断线自动重连仍必须在 green 发布环境完成。

## Nginx

不要求 sticky session。实际命中 SSE route 的 location 至少使用：

```nginx
upstream rankland_upstream {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

location /api/v2/public/contests/ {
    proxy_pass http://rankland_upstream;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 75s;
}
```

如果生产配置已有更宽的 `/api/` location，应把同等 SSE 配置放到真正匹配的 location，不要为了复制
示例而意外改变其他 contest API 的代理语义。应用同时发送 `X-Accel-Buffering: no`，但部署侧仍应
显式关闭 buffering。15 秒 heartbeat 应明显短于 75 秒 read timeout。

## 上线

首次上线先整批升级到 cache-aware `mode=off`，之后才允许同一 build 的 `off`/`on` 在 blue-green 切换期短暂共存；pre-cache binary 不得与 `on` 同时承载相关公网流量：

1. 确认 green 所有实例使用相同 MySQL、Redis endpoint 和 `REDIS_NAMESPACE`，并与其他环境隔离。
2. 对目标 build 运行普通测试、Redis/MySQL 集成测试和 build；确认没有新增 schema migration。
3. 启动 green，但暂不接收公网流量。
4. 从每个 green 实例日志确认 subscriber 已收到目标 channel 的 `SUBSCRIBE` ACK；Redis TCP ready
   本身不足以证明 1 秒路径已就绪。
5. 直连 green-B 建立 SSE，直连 green-A append，验证 B 在 1 秒内收到新的高水位。
6. 临时阻断 publish 或断开 B subscriber，更新共享权威状态，验证 B 在 6 秒内由 MySQL 校准恢复。
7. 通过 green nginx upstream 验证 headers、无缓冲、约 15 秒 heartbeat、断线重连和 initial 高水位。
8. 把“切换 nginx upstream”和“立即停止/drain old”作为一个发布动作。drain 会结束旧 SSE，使
   `EventSource` 重连到 green。
9. 确认 old 活跃 SSE 已归零后，才宣告新的多实例通知保证生效。
10. 至少观察一个完整校准周期，检查 Redis state、publish/reconcile failure 和 backpressure 日志。

若两实例 namespace 不同，Redis 快速路径会被分区，MySQL 校准仍可能在 6 秒内恢复，但该部署验收
必须判为失败，不得切流。

## 回滚

1. 把“切回 old upstream”和“立即 drain green”作为同一个回滚动作。
2. old 版本没有多实例通知保证。回滚后临时只运行一个 old 应用实例，或把所有相关 SSE 和写流量
   固定到同一个旧实例；不得继续宣称支持多实例 SSE。
3. 停止 green，使其 SSE client 自动重连 old。
4. 不需要删除 Redis key、消费游标或回滚数据库；Pub/Sub channel 没有持久状态。
5. 保留 green 的 Redis state、publish/reconcile、backpressure 和退出日志用于排查。

## 关闭与重启

优雅退出必须先让 notification coordinator 进入 draining，停止 heartbeat/reconcile 和 subscriber
listener，立即关闭全部 SSE response，再对专用 subscriber 执行不等待网络的 disconnect。之后才等待
HTTP server close，最后关闭 ID generator、TypeORM 和普通 Redis command client。

在 Redis 黑洞且有活跃 SSE 时也不等待 `UNSUBSCRIBE` 或 `QUIT`；进程应保持现有 5 秒退出预算。
新连接在 draining 后立即结束，由客户端重连其他实例。

## 日志、告警与容量

以下故障与恢复事件保持默认输出：

- `contest_event_notification.publish_failed`
- `contest_event_notification.invalid_message`
- `contest_event_notification.reconcile_failed`
- `contest_event_notification.backpressure_timeout`
- `contest_event_cache_control.publish_failed`
- `contest_event_cache_control.invalid_message`
- 对应的 `*.recovered` 事件。

设置 `CONTEST_EVENT_RUNTIME_DIAGNOSTICS_ENABLED=true` 后，额外输出：

- `contest_event_notification.redis_state`
- `contest_event_read_cache.summary`
- `contest_event_read_runtime.summary`
- `contest_event_notification_runtime.summary`

Redis state/publish failure 告警表示低延迟路径降级，不应自动摘除仍能服务本机通知和 MySQL 校准的
实例。持续 `reconcile_failed` 或 MySQL 不健康才意味着 6 秒保证不可用。日志不得包含 Redis 密码或
完整连接串。同类重复错误按 30 秒窗口限频，后续日志通过 `suppressedCount` 汇总；状态恢复时应能
看到对应 recovery 日志；仅在诊断开关开启时同时输出逐次 state 变化。

在预期最大 active contest 数量下记录批量权威查询时延；健康 MySQL 的 p99 应低于 1 秒。默认每个实例
最多约每 3 秒执行一次 active-contest 批量查询，空 active 集合不访问数据库。慢客户端最多保留一个
latest-wins pending watermark；持续 backpressure 约 10 秒后连接会被结束并重连。

诊断开关默认关闭；loadtest、canary 或临时故障分析必须显式开启。两个 runtime JSON marker 都携带
`interval.startEpochMs/endEpochMs`。压测 steady 聚合只接受完整
落入 steady 的新区间，丢弃跨越 ramp/steady 或 steady/drain 的部分区间；旧 marker 仍按
`capturedAt` 点样本读取。notification marker 的 `maximaScope=interval` 表示 timing maxima 已在
每个 summary 后重置，因此 steady `notifyToLastMaxMs` 不会混入 ramp 生命周期最大值。

专用 follow-up profile 额外启用三项严格门禁：events page 延迟 `>2000ms` 的请求占比必须
`<1%`；有该 route 请求的完整 steady 秒中，route p99 `>2000ms` 的占比必须 `<10%`；
steady notification notify-to-last 最大值必须 `<1000ms`。等于上限也失败。缺少任一 events
直方图、完整 active-second 分母、预期实例 notification sample、唯一 resolved config 或 interval
maxima 时判为 `INFRA_INVALID`，不能把缺证据显示成 0 或 PASS。普通 profile 未显式配置这两组
gate 时保持既有分类语义，但 summary/HTML 仍展示可计算的 tail 指标。

## 发布验收摘要

- 本机 append/reset 即时通知，Redis 故障不影响已提交 HTTP 成功。
- Redis 正常、subscriber 已 ACK：跨实例通知不超过 1 秒。
- Redis publish/subscriber 故障：满足 MySQL 前提时不超过 6 秒。
- reset 的高 revision/event id 0 不被旧 revision 高 event id 覆盖。
- heartbeat 穿过 nginx，named event/payload 保持原公开 contract。
- namespace、订阅 ACK、无缓冲和 old SSE 归零均有可复现证据。
