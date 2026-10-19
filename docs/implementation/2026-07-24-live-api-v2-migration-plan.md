# `/live` API v2 + Protobuf 迁移实施计划

Updated: 2026-10-24

## 目标

将 `/live/:id` 从 legacy 静态榜单轮询和 WebSocket 切换到同源 API v2：

- 比赛配置与事件流状态使用 JSON API；
- 事件 payload 始终通过 `application/protobuf` catch-up 获取；
- SSE `events-available` 只作为事件高水位通知；
- compact 事件同时驱动 Ranklist 和可选的最终态 solutions pop；
- 除 CHANGE 结果条与 320px 滚动栏外，不改动现有 UI。

## 测试 seam

测试只通过以下 interface 观察行为：

1. `LiveContestTransport`：JSON 配置/stream state、PB event page、SSE subscription。
2. `ContestEventConsumer`：initial/live/reset/fatal 回调与生命周期。
3. `LiveRanklistProjector`：配置 + 事件批次到 Ranklist/rolling items。
4. `ScrollSolution`：`pushSolutions()`、`resetSolutions()` 和渲染输出。

## 阶段

- [x] Phase 0：确认现有 contract、工作区状态、测试 seam 和实施边界。
- [x] Phase 1：生成浏览器 decode-only PB 产物，实现 PB transport 及测试。
- [x] Phase 2：实现 revision/generation-safe event consumer 及测试。
- [x] Phase 3：实现 Ranklist projector、FB/freeze/CHANGE 语义及测试。
- [x] Phase 4：接入 `/live`，调整 ScrollSolution，移除 legacy live 路径。
- [x] Phase 5：更新设计与迁移文档，运行完整测试、构建、E2E 和双轴 review。
- [x] Phase 6：逻辑/边界/性能专项 review，修复确认问题并完成回归验证。
- [x] Phase 7：rebase 到最新 master，迁移 CCPC26 Live 测试并验证组合行为。

## Phase 6 review 修复

- initial catch-up 改为逐页摄入 projector、只在初始水位边界 finalize，移除 consumer 的无界历史事件数组和完成时复制。
- 同 revision SSE 水位使用单 runner + follow-up 标记合并，避免悬挂请求期间为每条通知保留 Promise continuation。
- stream-state 429/503 同样解析并服从 `Retry-After`。
- 冻结边界与服务端统一为 `max(0, duration - frozenDuration)`，并补齐边界前 1ns、恰好边界、超长冻结测试。
- 归一化后的 problem alias 强制唯一；PB decoder 对正 ID、0–100 progress、负时间和单位换算后的整数/小数安全边界做防御校验。
- FB AC 索引改为可删除最小堆，CHANGE 转移不再扫描整题 AC；滚动队列改为 head index，活跃 dismissal timer 受可见条数约束。
- 实时 Ranklist 的 Vue 发布按 animation frame 合并，比赛切换、reset、fatal 和卸载统一清理待发布数据与滚动状态。

## Phase 7 master 对齐

- 将功能提交从 `33d3fe3` rebase 到 `origin/master@9fd5dd9`，保留 master 的 Node 22、CCPC26 与 Ranklist 性能改动。
- 将 CCPC26 Live E2E 从 legacy `/ranking/*` 轮询 fixture 迁移为真实 API v2 contest、事件 reset/append、SSE 水位和 PB catch-up。
- FB 投影同时更新 status 汇总结果和对应 solution 明细结果，保证 CCPC26 匿名题目公开后，已打开的提交详情显示 First Blood。
- 刷新三个固定 PB 生成工具传递依赖的 npm integrity；版本保持不变，并重新验证 frozen/offline 安装。

## 验证记录

- `pnpm test`：112 个测试文件通过，777 项通过，21 项按环境跳过。
- 目标文件 ESLint、`pnpm install --frozen-lockfile --offline` 和 `git diff --check` 通过。
- `pnpm gen:proto` 前后四个生成物哈希一致；浏览器生成物不包含
  encode/verify/convert/delimited/producer 代码。
- `pnpm build`：client、SSR bundle 和 server TypeScript 构建通过。
- PB 分包：生成 contract gzip 为 5,908 B；生产 client 构建的独立
  `live-contest-protobuf` chunk 为 51.98 KiB（gzip 13.42 KiB），且只有该 chunk 含
  `GetContestEventsResponse`。
- `/live` Playwright E2E 在隔离的临时 MySQL、真实 API v2 protobuf 响应与 SSE 下通过，
  覆盖 initial replay、SETTLE、冻结 NEW、CHANGE、revision reset，以及无 legacy
  `/ranking/*`/WebSocket 请求。
- 完整 Playwright 套件为 70/75 通过，`/live` 用例通过。其余 5 项为本次未修改的既有
  collection/ranklist 用例：首次设置引导弹窗拦截、view count 未本地加一、dropdown
  宽度，以及两项 popover z-index 断言；在全新进程和数据库中单独复跑仍稳定失败。
- Standards 与 Spec 两轮 review 的发现均已修复，复核无剩余问题。
- Phase 6 使用隔离临时 MySQL 复跑 `/live` Playwright E2E，通过 1/1；测试后实例和数据目录均已清理。
- Phase 6 合成性能 guardrail：10,000 用户下最坏 FB 根节点反复转移的单批投影
  p95 为 1.97 ms；100,000 用户下 p95 为 25.57 ms。1,000,000 事件分页初始回放
  总耗时 540 ms、进程 heap 约 213 MiB。以上是 Node projector 的算法退化检查，
  不等同于浏览器渲染或生产容量结论。
- Phase 7 的 13 个 CCPC26 场景与 `/live` API v2 场景全部通过；完整 Playwright 为
  83/88，通过项包含所有 Live/CCPC26 用例。其余 5 项仍是既有 collection/ranklist
  基线失败：首次设置弹窗拦截、view count、dropdown 宽度及两项 popover z-index。
- `pnpm install --frozen-lockfile --offline`、`pnpm check:proto`、目标 ESLint、E2E 构建与
  `git diff --check` 通过。

## 固定决策

- `/events` 固定 `compactProgress=true`、`limit=1000`，不允许 JSON fallback。
- checkpoint 只取 `checkpointEventId`；SSE 不承载事件 payload。
- 初始 catch-up 不产生 solutions pop；实时 SETTLE、冻结 NEW 和 CHANGE 才产生最终态 pop。
- CHANGE 显示 `previousResult → currentResult`；CONFIG_CHANGE 记录 warning 后忽略。
- cursor 只保存在页面会话内；刷新后从事件 `0` 重建。
- 不升级 protobuf runtime 主版本；不新建分支，本次仅改写既有功能提交且不推送。
