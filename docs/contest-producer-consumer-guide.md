# Contest Producer / Consumer Guide

Updated: 2026-05-28

本文档面向事件生产脚本和事件消费者应用。核心原则：

- 生产者只通过 HTTP append 写入事件。
- 消费者只通过 HTTP catch-up 读取事件 payload。
- SSE 只通知“事件流高水位变化”，不携带事件 payload。
- 消费者和生产者都需要持久化自己的 cursor。

## 术语

- `uk`：contest 的唯一业务标识。
- `eventId`：生产者分配的连续递增事件 id，从 1 开始。
- `latestEventId` / `lastEventId`：服务端当前事件流最高已落库 event id。
- `checkpointEventId`：消费者处理完一次 catch-up 响应后可安全保存的 cursor。
- `streamRevision`：事件流版本。reset/dropEvents 会递增它，并把 event id 从 0 重新开始。
- `producerId`：生产者身份，来自 `x-producer-id`。同一事件流同时只允许一个 producer。

## 消费者实现

### 数据通道

消费者使用两个通道：

1. HTTP catch-up：

```text
GET /api/v2/public/contests/:uk/events?afterEventId=<local>&streamRevision=<revision>
```

这个接口返回实际事件 payload。默认或优先接受 protobuf 时，响应 body 是 `GetContestEventsResponse` protobuf bytes；接受 JSON 时，`data.events` 是 `ClientEvent[]` 等价 JSON。

2. SSE 通知：

```text
GET /api/v2/public/contests/:uk/event-stream/notifications
```

SSE 只发送：

```json
{
  "uk": "contest-a",
  "latestEventId": 123,
  "streamRevision": 1
}
```

SSE 帧只包含 `event: events-available` 和 `data`，当前不发送 SSE `id:` 字段，也不携带事件 payload。通知丢失、重复或重连都不影响正确性，因为最终事件恢复依赖 HTTP catch-up。

### 首次打开页面

推荐流程：

1. 从本地缓存读取 `lastEventId`、`streamRevision` 和已缓存事件。
2. 如果没有本地 `streamRevision`，先调用 `GET /api/v2/public/contests/:uk/event-stream` 获取当前 `streamRevision`，并使用 `lastEventId=0`。
3. 建立 SSE 连接。
4. 立即执行一次 HTTP catch-up。
5. 如果返回 `hasMore=true`，继续分页拉取。
6. 处理完响应后，把本地 cursor 更新为 `checkpointEventId`。

如果用户在比赛开始前进入页面，SSE 初始通知通常是：

```json
{
  "latestEventId": 0,
  "streamRevision": 1
}
```

此时 catch-up 返回空事件；后续 producer append 成功后，SSE 会通知新的 `latestEventId`。

### 中途进入页面

没有本地缓存时，从 `afterEventId=0` 开始 catch-up：

```text
GET /api/v2/public/contests/contest-a/events?afterEventId=0&streamRevision=<revision>
```

如果只是恢复当前榜单状态，可以使用默认 compaction，服务端会省略已被 settle/change 覆盖的过期 progress。

如果是实时观看，或需要审计/完整回放事件过程，建议显式关闭 compaction：

```text
GET /api/v2/public/contests/contest-a/events?afterEventId=0&streamRevision=<revision>&compactProgress=false
```

这样消费者能看到更完整的 progress 过程。

注意：`compactProgress=false` 只关闭“已被 settle/change 覆盖的 progress 压缩”，不会关闭封榜过滤。只要 solution 的 `NEW_SOLUTION.time` 落入封榜区间，服务端仍会隐藏这个 solution 的 progress / settle / changed。

### 断线后回来

消费者应持久化：

```ts
{
  uk: string;
  lastEventId: number;
  streamRevision: number;
  cachedEvents: ClientEvent[];
}
```

回来后请求：

```text
GET /api/v2/public/contests/:uk/events?afterEventId=<lastEventId>&streamRevision=<streamRevision>
```

如果服务端返回 `resetRequired=false`，正常应用新增事件并推进 cursor。

如果返回：

```json
{
  "resetRequired": true,
  "streamRevision": 2,
  "checkpointEventId": 0
}
```

说明本地事件流版本已经过期。消费者应清空本地事件缓存，保存新的 `streamRevision`，然后从 `afterEventId=0` 重新 catch-up。

### SSE 重连和并发通知

SSE 初始通知可能已经领先于本地 cursor；catch-up 过程中也可能继续收到新的 SSE 通知。消费者不需要拼接 SSE 事件队列，因为 SSE 没有事件 payload，只需要维护一个目标高水位。

推荐逻辑：

```ts
let localEventId = loadLocalEventId();
let streamRevision = loadStreamRevision();
let targetLatestEventId = localEventId;
let catchingUp = false;

function onEventsAvailable(payload: {
  latestEventId: number;
  streamRevision: number;
}) {
  if (streamRevision !== undefined && payload.streamRevision !== streamRevision) {
    clearLocalEvents();
    localEventId = 0;
    streamRevision = payload.streamRevision;
  }

  targetLatestEventId = Math.max(targetLatestEventId, payload.latestEventId);
  void ensureCatchUp();
}

async function ensureCatchUp() {
  if (catchingUp) return;
  catchingUp = true;

  try {
    while (localEventId < targetLatestEventId) {
      const page = await fetchContestEvents({
        afterEventId: localEventId,
        streamRevision,
        compactProgress: false,
      });

      if (page.resetRequired) {
        clearLocalEvents();
        localEventId = 0;
        streamRevision = page.streamRevision;
        targetLatestEventId = page.latestEventId;
        continue;
      }

      const events = page.events;
      applyEvents(events);
      localEventId = page.checkpointEventId;
      streamRevision = page.streamRevision;
      saveCursor(localEventId, streamRevision);

      targetLatestEventId = Math.max(targetLatestEventId, page.latestEventId);
      if (!page.hasMore && localEventId >= targetLatestEventId) {
        break;
      }
    }
  } finally {
    catchingUp = false;
    if (localEventId < targetLatestEventId) {
      void ensureCatchUp();
    }
  }
}
```

### `checkpointEventId` 和 `latestEventId`

- `latestEventId`：服务端最高水位，说明服务端最多已有多少事件。
- `checkpointEventId`：本次响应处理完后，本地可以保存到哪里。

开启 compaction 时，返回事件可能是稀疏的。例如服务端检查了 81..100，但省略了部分过期 progress，消费者仍应保存：

```json
{
  "checkpointEventId": 100
}
```

下一次请求使用：

```text
afterEventId=100
```

不要用 `toEventId` 替代 `checkpointEventId`。

### 消费者注意事项

- 对同一 contest 串行执行 catch-up，避免多个请求乱序覆盖 cursor。
- 事件应用应按 eventId 升序处理。
- 对重复事件要幂等。
- `streamRevision` 改变时清空本地旧事件状态。
- 实时观看场景建议 `compactProgress=false`。
- 恢复历史状态、只关心最终榜单时可以使用默认 compaction；默认 compaction 会跨本次 catch-up 范围识别后续 settle/change 事件，并过滤已过时的 progress。
- 封榜过滤优先于 compaction，判断依据是同一个 solution 的 `NEW_SOLUTION.time`，不是 progress / settle / changed 自身的 time。
- SSE 断线后由 `EventSource` 自动重连；重连后初始通知会再次给出当前高水位。

## 生产者实现

### 写入通道

推荐 raw protobuf：

```text
POST /api/v2/contests/:uk/events
Content-Type: application/protobuf
x-token: <AUTH_TOKEN>
x-producer-id: <producer-id>
```

也接受 `application/x-protobuf`。不再接受 `application/octet-stream`。

也可以使用直接 JSON：

```text
POST /api/v2/contests/:uk/events
Content-Type: application/json
x-token: <AUTH_TOKEN>
x-producer-id: <producer-id>

{ "streamRevision": 1, "events": [/* BatchProducerEvent.events */] }
```

两种方式都提交 `BatchProducerEvent`，且 `streamRevision` 必填。

raw protobuf body 最大 5 MiB。`x-producer-id` 必填，建议使用一个稳定且可读的短字符串，例如脚本实例 id 或部署实例 id。

事件中的相对比赛时间使用 `TimeDuration` 表示。服务端出站会统一转成纳秒语义，即 `unit = NS`，`value` 是 int64；生产者可以提交 `S`、`MS`、`US` 或 `NS`，但应避免在脚本中用普通 JS number 承载可能超过安全整数范围的纳秒值。

生产者必须先提交某个 solution 的 `NEW_SOLUTION`，再提交该 solution 的 progress / settle / changed。服务端会在写入时把 `NEW_SOLUTION.time` 反范式保存到后续事件行，用于高并发消费时快速执行封榜过滤；如果非 new 事件找不到对应的 new solution，会返回 `INVALID_EVENT_BATCH`。

### 服务端 append 事务逻辑

当前实现的性能路径：

1. 在事务外 decode/verify protobuf。
2. 在事务外校验 batch 内 `eventId` 严格递增。
3. 在事务外把 producer event 转成 client event payload，并计算 `payloadHash`。
4. 开启 MySQL 事务。
5. 解析 `uk -> contest.id`。
6. 悲观锁定 `contest_event_stream` 行。
7. 校验 batch 的 `streamRevision` 必须等于当前 stream revision。
8. 校验/设置 producer lock。
9. 对本批所有 eventId 在当前 revision 内做一次批量查询。
10. 在内存中检查 duplicate/gap/conflict。
11. 收集真正新增的事件。
12. 对新增事件做一次 bulk insert。
13. 更新 `contest_event_stream.last_event_id`。
14. 事务提交后广播 SSE 高水位通知。

因此每个 batch 的核心 DB 操作是：

- 1 次 stream 行锁查询。
- 1 次 eventId 批量查重。
- 0 或 1 次新增事件 bulk insert。
- 0 或 1 次高水位 update。

### producer lock

每个 contest event stream 同时只允许一个 producer。

- 第一次 append 时，如果没有锁，当前 `x-producer-id` 自动占有锁。
- 后续 append 必须使用同一个 `x-producer-id`。
- 管理员可以调用：

```text
DELETE /api/v2/contests/:uk/event-stream/producer-lock
```

释放后，新 producer 必须从服务端当前 `lastEventId + 1` 继续。

### eventId 和幂等

生产者必须保证：

- eventId 从 1 开始。
- eventId 严格递增。
- batch 内不能乱序、重复、跳号。
- 新 batch 必须接续服务端当前 `lastEventId + 1`。

服务端对重复提交的处理：

- eventId 已存在且 payload hash 相同：视为幂等重试，返回在 `duplicateEventIds` 中，不 update 原事件。
- eventId 已存在但 payload hash 不同：返回 `EVENT_ID_CONFLICT`，事务回滚。
- eventId 不接续：返回 `EVENT_ID_GAP`，事务回滚。

示例：

服务端已到 100，producer 提交 `[99, 100, 101, 102]`：

- 99、100 若 hash 相同，作为 duplicate。
- 101、102 作为新增事件批量插入。
- `lastEventId` 更新到 102。

服务端已到 100，producer 提交 `[102]`：

- 期望 101，收到 102，返回 gap。

数据库唯一约束是 `(contest_id, stream_revision, event_id)`。reset/dropEvents 会保留旧 revision 的 `contest_event` 行作为归档，再递增 `streamRevision`，因此新事件流可以重新从 eventId 1 开始。

### ACK 规则

生产者必须等待服务端确认后再发送下一批。

成功响应：

```json
{
  "acceptedEventIds": [101, 102],
  "duplicateEventIds": [],
  "lastEventId": 102,
  "expectedNextEventId": 103,
  "streamRevision": 1
}
```

收到成功后，生产者本地 cursor 更新为 `lastEventId` 或 `expectedNextEventId - 1`。

不要并发发送同一个 contest 的多个 batch。服务端会用行锁串行化，但网络到达顺序不可控，并发 batch 很容易制造 gap。

### 网络失败与重试

如果 HTTP 超时、连接断开、5xx 或生产者不确定服务端是否已提交，应原样重试同一个 batch。

原样重试意味着：

- eventId 不变。
- payload 不变。
- protobuf 语义不变。
- streamRevision 不变。
- producerId 不变。

如果上一次其实已经成功提交，服务端会返回 duplicate 或 duplicate + accepted 的组合结果。

不要在不确定提交结果时重新生成同 eventId 的不同 payload，否则会触发 `EVENT_ID_CONFLICT`。

### 推荐生产者主循环

```ts
const producerId = loadStableProducerId();
let nextEventId = loadLocalNextEventId();
let streamRevision = loadStreamRevision();

while (running) {
  const rawChanges = await pollContestChanges();
  const events = buildProducerEvents(rawChanges, nextEventId);

  if (events.length === 0) {
    await sleep(pollIntervalMs);
    continue;
  }

  const batchBytes = encodeBatchProducerEvent({ streamRevision, events });

  while (true) {
    try {
      const resp = await appendBatch({
        uk,
        producerId,
        body: batchBytes,
      });

      nextEventId = resp.expectedNextEventId;
      streamRevision = resp.streamRevision;
      saveLocalNextEventId(nextEventId);
      saveStreamRevision(streamRevision);
      break;
    } catch (e) {
      if (isRetryableNetworkError(e)) {
        await backoff();
        continue;
      }
      if (isDuplicateCompatible(e)) {
        break;
      }
      alertAndStop(e);
      throw e;
    }
  }
}
```

### 生产者错误处理建议

| 错误 | 建议 |
| --- | --- |
| 网络超时 / 连接断开 | 原样重试同一 batch |
| `INVALID_EVENT_BATCH` | 停止脚本，修生产逻辑 |
| `PRODUCER_LOCKED` | 停止脚本，确认是否已有 producer；必要时管理员 release |
| `STREAM_REVISION_MISMATCH` | 停止脚本，丢弃本地旧 cursor，重新获取 stream state 后从 eventId 1 生产新 revision |
| `EVENT_ID_GAP` | 停止脚本，重新对齐服务端 `lastEventId` |
| `EVENT_ID_CONFLICT` | 停止脚本，说明同 eventId 的 payload 不一致 |
| `CONTEST_NOT_FOUND` | 停止脚本，确认 `uk` 是否正确 |

## reset/dropEvents 后的行为

管理员 reset 后：

- 历史 `contest_event` 行被保留为旧 revision 归档。
- `contest_event_stream.last_event_id` 变成 0。
- `contest_event_stream.stream_revision` 加 1。
- producer lock 被释放。
- SSE 广播新的 `streamRevision`。

消费者看到 revision 变化后清本地缓存，从 `afterEventId=0` 拉新流。

生产者看到 reset 后，如果要继续生产，必须从 eventId 1 开始提交新流，并使用新的 producer lock。
