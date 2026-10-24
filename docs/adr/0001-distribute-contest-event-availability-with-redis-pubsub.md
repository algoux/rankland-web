---
status: accepted
---

# 使用 Redis Pub/Sub 分发比赛事件可用通知

比赛事件和事件高水位继续以 MySQL 为唯一事实源，SSE 只发送可合并的事件可用通知。跨实例分发采用“本机 Hub 即时通知 + Redis Pub/Sub 快速扇出 + 各实例针对本机活跃比赛周期校准 MySQL”，消费者仍通过 HTTP catch-up 获取真实事件；Redis 故障采用 fail-open，通知允许丢失、重复和乱序，但必须在约定窗口内收敛到权威高水位。

所有应用实例永久订阅一个带部署 namespace 和协议版本的全局频道；同一部署共享 namespace，不同环境必须不同，不能依赖 Redis logical database 隔离 Pub/Sub。实例只向本机当前有连接的比赛扇出，首期不做按比赛动态订阅。

首期不在 Redis 中维护比赛高水位快照，也不引入 Lua 或 Redis Function。subscriber 恢复后立即校准 MySQL，平时继续周期校准本机活跃比赛；只有实测该权威查询成为瓶颈时，才把 Redis 快照作为可丢弃的恢复加速器重新评估。

本轮多机支持指多个应用实例共享同一 MySQL 与当前单端点 Redis 接入，不扩展应用的 Sentinel/Cluster 连接配置。分发模块保留可替换边界，Redis 自身拓扑另行演进。

通知平面整体采用 fail-open：MySQL 已提交后，本机 Hub、序列化、日志或 Redis publisher/subscriber 的任何失败都不能改变业务成功响应。Redis 不可用时应用实例仍保持 ready，现有健康检查不因通知加速层降级而失败；实例继续提供本地通知与 MySQL 校准，并通过限频结构化日志暴露状态变化和失败。

内部连接路由与 Redis envelope 使用数据库 `contestId` 作为比赛身份，不直接用请求 `uk` 字符串作为跨实例/Hub key，避免 MySQL collation 与大小写变体产生不同连接桶。公开 payload 仍使用各 SSE client 建连时的请求 `uk`，不改变既有 wire 语义。

Redis 健康时以 MySQL commit 后 1 秒内跨实例通知为目标；故障路径每 5 秒批量校准本机活跃比赛，在 MySQL 健康且查询于 1 秒内完成时以 6 秒为验收上限。周期校准无条件运行，不能只在 Redis 重连后执行，因为写实例可能在 commit 后、publish 前退出。

首次发布采用协调式整批切换，优先 blue-green；新实例组先验证订阅 ACK、跨实例通知和校准，再把切换 nginx upstream 与立即停止/drain 旧实例作为一个发布动作。旧实例活跃 SSE 归零前不宣称新保证生效；新旧版本混部不作为受支持发布形态。

不选择 Redis Streams 或 transactional outbox，因为当前通知不承载不可恢复的业务数据，Streams 不能消除 MySQL commit 与 Redis 写入之间的双写间隙，共享 consumer group 也不符合向每个实例广播的需求。若未来通知变为不可合并的业务事件，或不能接受一个校准周期的故障延迟，再重新评估持久消息日志或 MySQL outbox。
