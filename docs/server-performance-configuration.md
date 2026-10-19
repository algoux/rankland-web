# 服务端性能配置

Updated: 2026-07-25

本文档是 RankLand 业务服务性能环境变量的唯一集中清单。`compose-template.yml` 只展示完成部署所需的
拓扑、凭据与存储配置；下列变量在未设置时直接使用代码默认值，只有进行容量规划、故障回滚或针对
特定环境做深度调优时才应覆盖。

所有配置均在进程启动时读取，修改后需要整批重启应用实例。同一部署的不同实例应使用相同值，并在
变更记录或压测 manifest 中保存完整配置指纹。

## 默认性能基线

当前默认值以“单个 RankLand 部署无需性能环境变量覆盖即可获得较好吞吐与尾延迟”为目标。选值依据是
2026-07-19 ～ 2026-07-22 的本机四进程 loadtest；它们是合理的开箱应用默认起点，但不是单个 Node
进程或任意生产硬件上的容量承诺。最新 practical-capacity run `20260722t151230z-44b9d9` 得到
21,200 viewers 的稳定容量结论。该 run 的 env file 显式设置 cache mode、四项通知配置和线上语义
对照采样率，local profile 额外设置 pool/backlog；本表其余参数直接使用代码默认值。生产默认关闭
线上语义对照和比赛事件运行时诊断，因此不会承担 loadtest 的额外比较读取、周期采样或逐秒日志成本。

| 参数组       | 优化前代码默认 | 当前默认        | 证据与取舍                                                                                                              |
| ------------ | -------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 读缓存模式   | `off`          | `on`            | cache-on 已覆盖高并发正确性、冷启动和容量运行；`off` 保留为不清理 MySQL/Redis 的即时回滚值。                            |
| 通知波调度   | `0 / 1 / 0`    | `25 / 32 / 200` | 16→32→16 反序 A/B 中，32 shards 同时改善 HTTP/ACK 尾部、listener drops 和 event-loop；最坏两轮预算为 425 ms。           |
| HTTP backlog | Node 约 `511`  | `4096`          | 6,300-viewer A/B 中消除 listen overflow、SYN retransmit 和秒级 connect 波；实际值仍受宿主机 `somaxconn` 限制。          |
| MySQL 进程池 | `10`           | `20`            | practical profile 用 20 移除已观察到的 pool=10 admission ceiling；它不是严格单变量收益，副本较多时必须核算 fleet 总量。 |
| 线上语义对照 | `0.001`        | `0`             | 稳定生产关闭额外 legacy MySQL 比较读取；loadtest/canary 通过环境变量显式恢复 0.1% 抽样。                                |
| 运行时诊断   | 始终开启       | `false`         | 默认不输出周期 summary 和 Redis state；loadtest/临时诊断通过单一环境变量显式开启，故障与恢复日志不受影响。              |

以下两类看起来与 loadtest 配置不同，但不应改成压测值：

- 诊断 loadtest 会显式开启运行时诊断，并把 summary interval 设为 `1000` ms 获取密集证据；最新 practical-capacity run
  显式使用通知 summary `1000` ms，读缓存 summary 使用默认 `60000` ms。生产默认两者均为 `60000` ms，
  但因为诊断开关默认关闭，不会启动这些周期定时器或输出 summary。
- eager tail fill 曾以 `true` 做实验，但没有改善 events p99，且 producer ACK 尾部重复回退；默认应继续
  保持 `false`。

Nginx `upstream keepalive=64` 也是当前本机 profile 的较优值，但它属于反向代理配置，不是业务 Node
进程环境变量，因此不列入下表或 Compose 模板。

## 数据库与传输

| 环境变量                 | 默认值 | 允许值/约束     | 作用与调优说明                                                                                                                                                      |
| ------------------------ | -----: | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MYSQL_CONNECTION_LIMIT` |   `20` | 整数 `1..65535` | 每个应用进程的 mysql2 连接池上限。总预算为该值乘以应用进程数，并需为 migration、监控和管理连接预留余量；只有 pool high-water/acquire failure 证明饱和时才继续提高。 |
| `SERVER_LISTEN_BACKLOG`  | `4096` | 整数 `1..65535` | 传给 Node `listen()` 的 accept backlog。它吸收通知后短时连接波，但不能修复持续 CPU/DB 过载；部署后应通过 `ss -lnt`、`ListenDrops` 和 `somaxconn` 验证实际生效值。   |

## 比赛事件运行时诊断

| 环境变量                                    | 默认值  | 允许值/约束      | 作用与调优说明                                                                                                                                                                                                                                         |
| ------------------------------------------- | ------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `CONTEST_EVENT_RUNTIME_DIAGNOSTICS_ENABLED` | `false` | `true` / `false` | 控制 `contest_event_read_cache.summary`、`contest_event_read_runtime.summary`、`contest_event_notification_runtime.summary` 和 `contest_event_notification.redis_state`。仅 loadtest、canary 或临时诊断应开启；故障 warning 与 recovery 日志始终保留。 |

## 比赛事件可用通知

| 环境变量                                         |  默认值 | 允许值/约束                                            | 作用与调优说明                                                                                        |
| ------------------------------------------------ | ------: | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `CONTEST_EVENT_NOTIFICATION_COALESCE_WINDOW_MS`  |    `25` | 整数 `0..250` ms                                       | 同一比赛 latest-wins 合并窗口。增大可合并密集 watermark，代价是增加首批通知等待。                     |
| `CONTEST_EVENT_NOTIFICATION_FANOUT_SHARDS`       |    `32` | 整数 `1..64`                                           | 每进程客户端的确定性分片数。增大可减小同步 SSE 写出块和后续 GET cohort；过大时会增加 timer/调度开销。 |
| `CONTEST_EVENT_NOTIFICATION_FANOUT_WINDOW_MS`    |   `200` | 整数 `0..250` ms                                       | 一轮从首 shard 到末 shard 的计划展开窗口。与 coalesce 共同平滑 catch-up 波。                          |
| `CONTEST_EVENT_NOTIFICATION_SUMMARY_INTERVAL_MS` | `60000` | 整数 `1..3600000` ms；`coalesce + 2 × fanout <= 500ms` | 通知 runtime summary 周期；仅在运行时诊断开关为 `true` 时生效。问题诊断时可临时降到 `1000`。          |

低并发、极端追求首通知延迟或需要紧急排除通知调度时，可显式恢复
`CONTEST_EVENT_NOTIFICATION_COALESCE_WINDOW_MS=0`、
`CONTEST_EVENT_NOTIFICATION_FANOUT_SHARDS=1`、
`CONTEST_EVENT_NOTIFICATION_FANOUT_WINDOW_MS=0`；该回滚不改变 MySQL 权威或公开协议。

## 比赛事件读缓存

| 环境变量                                                          |      默认值 | 允许值/约束                    | 作用与调优说明                                                                                                                |
| ----------------------------------------------------------------- | ----------: | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `CONTEST_EVENT_READ_CACHE_MODE`                                   |        `on` | `off`、`shadow`、`on`          | `on` 提供进程内物化视图；`off` 是无状态回滚/B1 基线；`shadow` 会双读，仅适合低流量验证。                                      |
| `CONTEST_EVENT_READ_CACHE_MAX_BYTES`                              | `268435456` | 正整数                         | 每进程逻辑缓存总预算（256 MiB）。按活跃比赛数量、事件体积和进程 RSS 调整；不是 V8 heap 的硬上限。                             |
| `CONTEST_EVENT_READ_CACHE_MAX_ENTRY_BYTES`                        | `134217728` | 正整数且不超过总预算           | 单比赛逻辑预算（128 MiB）。超限比赛走有界 legacy fallback；调大前应确认单比赛 corpus 与内存余量。                             |
| `CONTEST_EVENT_READ_CACHE_IDLE_TTL_MS`                            |    `900000` | 正整数 ms                      | 无访问快照的空闲保留时间。缩短可减少冷比赛驻留，代价是更多重复 hydration。                                                    |
| `CONTEST_EVENT_READ_CACHE_AUTHORITY_LEASE_MS`                     |      `6000` | 正整数 ms                      | 完整 MySQL authority 结果的最大可服务年龄。不得为掩盖 MySQL 故障而盲目加大。                                                  |
| `CONTEST_EVENT_READ_CACHE_HOT_AUTHORITY_REFRESH_MS`               |      `3000` | 正整数且小于 authority lease   | 活跃比赛权威校准目标周期。缩短会提高 MySQL 读频率，增大会压缩故障收敛余量。                                                   |
| `CONTEST_EVENT_READ_CACHE_RECONCILIATION_MAX_MS`                  |      `5000` | 正整数且不超过 authority lease | 丢失 Redis 通知时的安全扫描上限，决定故障路径收敛速度。                                                                       |
| `CONTEST_EVENT_READ_CACHE_CHUNK_EVENT_COUNT`                      |       `512` | 整数 `1..65535`                | 不可变原始事件 chunk 大小。较大值减少结构开销但放大更新和回收粒度。                                                           |
| `CONTEST_EVENT_READ_CACHE_MAX_SYNCHRONOUS_PROJECTION_CHUNKS`      |        `32` | 正整数                         | commit 路径允许同步更新的最大 chunk 数；超出后让后续读路径重建，避免写路径长时间阻塞。                                        |
| `CONTEST_EVENT_READ_CACHE_HYDRATION_CONCURRENCY`                  |         `2` | 正整数                         | 每进程同时进行的冷 hydration 数量。只有 DB 与 pool 有余量且冷 miss 排队明显时才提高。                                         |
| `CONTEST_EVENT_READ_CACHE_HYDRATION_PAGE_SIZE`                    |      `2000` | 正整数                         | hydration 的 MySQL 最小列分页大小。增大减少 round trip，但提高单查询内存与执行时间。                                          |
| `CONTEST_EVENT_READ_CACHE_FALLBACK_CONCURRENCY`                   |         `4` | 正整数                         | 每进程 legacy fallback 并发槽位。它保护 DB，不能仅为减少 503 而无限放大。                                                     |
| `CONTEST_EVENT_READ_CACHE_FALLBACK_QUEUE_SIZE`                    |        `32` | 非负整数                       | fallback 有界等待队列长度；`0` 表示没有排队。                                                                                 |
| `CONTEST_EVENT_READ_CACHE_FALLBACK_QUEUE_TIMEOUT_MS`              |      `1000` | 正整数 ms                      | fallback waiter 的最大排队时间。应与端到端请求预算一起调整。                                                                  |
| `CONTEST_EVENT_READ_CACHE_QUERY_TIMEOUT_MS`                       |      `1000` | 正整数 ms                      | 从 pool acquisition 到事务/查询结束的绝对 deadline，SELECT 同时携带 `MAX_EXECUTION_TIME`。                                    |
| `CONTEST_EVENT_READ_CACHE_FAILURE_COOLDOWN_MS`                    |      `1000` | 正整数 ms                      | 同 generation authority/hydration 失败后的重试冷却，防止大量请求重复冲击 DB。                                                 |
| `CONTEST_EVENT_READ_CACHE_POOL_ACQUIRE_RETRY_ATTEMPTS`            |        `16` | 正整数                         | 仅针对 mysql2 pool 容量耗尽，在同一 query deadline 内使用新 QueryRunner 重试；不是任意 SQL 错误重试。                         |
| `CONTEST_EVENT_READ_CACHE_POOL_ACQUIRE_RETRY_MIN_DELAY_MS`        |         `5` | 正整数 ms                      | pool acquire full-jitter 的初始延迟。                                                                                         |
| `CONTEST_EVENT_READ_CACHE_POOL_ACQUIRE_RETRY_MAX_DELAY_MS`        |        `50` | 正整数且不小于最小延迟         | pool acquire full-jitter 的最大延迟；仍受 query deadline 限制。                                                               |
| `CONTEST_EVENT_READ_CACHE_BOOTSTRAP_AUTHORITY_COALESCING_ENABLED` |      `true` | `true` / `false`               | 合并 bootstrap identity 读取，并批量查询 contest id。默认开启；`false` 仅用于同镜像诊断回滚。                                 |
| `CONTEST_EVENT_READ_CACHE_EAGER_TAIL_FILL_ENABLED`                |     `false` | `true` / `false`               | 在通知 fanout 前尝试物化 resident active contest。实验没有端到端收益且 producer 尾部回退，除非新 A/B 反转结论，否则不要开启。 |
| `CONTEST_EVENT_READ_CACHE_EAGER_NOTIFY_WAIT_MS`                   |       `250` | 非负整数 ms                    | eager 开启时 fanout 最多等待多久；超时仍 fail-open 继续通知。eager 关闭时基本不影响热路径。                                   |
| `CONTEST_EVENT_READ_CACHE_RETRY_AFTER_SECONDS`                    |         `1` | 正整数秒                       | cache authority 暂时不可用时 HTTP 503 的 `Retry-After` 提示，不是服务端重试间隔。                                             |
| `CONTEST_EVENT_READ_CACHE_SUMMARY_INTERVAL_MS`                    |     `60000` | 正整数 ms                      | 读缓存结构化汇总周期；仅在运行时诊断开关为 `true` 时生效。诊断时可降到 `1000`。                                               |
| `CONTEST_EVENT_READ_CACHE_ON_COMPARE_SAMPLE_RATE`                 |         `0` | 数值 `0..0.001`                | `on` 模式抽样执行 legacy 语义对照的最大比例。稳定生产默认不做额外 MySQL 读取；loadtest/canary 可显式设为 `0.001`。            |

## 覆盖方式与调优顺序

只覆盖需要调整的变量，不要复制整张表到 Compose。例如：

```yaml
services:
  app:
    environment:
      MYSQL_CONNECTION_LIMIT: '12'
      CONTEST_EVENT_READ_CACHE_MAX_BYTES: '134217728'
```

建议按以下顺序定位瓶颈：

1. 先确认 correctness、HTTP/SSE 生命周期、最终 cursor 和发压机有效性；
2. 再检查 listener `Recv-Q`/drops、Node event-loop、MySQL pool high-water/acquire failure；
3. 只有对应资源已经成为瓶颈时，才调整 backlog、连接池或 cache 并发；
4. 内存预算使用至少 60 分钟、跨多轮 major GC 的 RSS/old-space 低水位判断；
5. 每次只改一个参数组，并保留同镜像、同 seed 的反序 A/B 和可恢复回滚值。

完整压测证据与限制见
[Contest Event Read Cache Loadtest Report](contest-event-read-cache-loadtest-report.md)，通知故障处理见
[Contest Event Notification Operations](contest-event-notification-operations.md)，读缓存发布与回滚见
[Contest Event Read Cache Operations](contest-event-read-cache-operations.md)。
