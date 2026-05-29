# Contest v2 API

Updated: 2026-05-28

本文档描述 contest 相关 HTTP/SSE API。接口、DTO、JSON 字段使用 camelCase；MySQL 表和列使用 snake_case，并由 TypeORM entity 显式映射。

## 通用约定

Base path:

```text
/api/v2
```

普通 bwcx controller 响应会被包装为：

```json
{
  "success": true,
  "code": 0,
  "data": {}
}
```

业务错误通常为：

```json
{
  "success": false,
  "code": 100001,
  "msg": "该比赛未找到"
}
```

raw protobuf middleware 使用字符串错误码：

```json
{
  "success": false,
  "code": "EVENT_ID_GAP",
  "msg": "expected event id 12 but received 14",
  "expectedEventId": 12,
  "receivedEventId": 14
}
```

## 鉴权

需要管理权限的 API 使用：

```text
x-token: <AUTH_TOKEN>
```

生产者追加事件还必须提供：

```text
x-producer-id: <producer-id>
```

公开读取接口、事件 catch-up 接口、SSE 接口当前不要求 `x-token`。

普通 controller 鉴权失败由 `AuthGuard` 返回：

```json
{ "success": false, "code": -4, "msg": "未授权的操作" }
```

raw protobuf append 由 Koa middleware 处理，鉴权失败为 HTTP 403：

```json
{ "success": false, "code": "INVALID_AUTH_INFO", "msg": "Invalid authorization info" }
```

## Contest 对象

创建和更新 contest 使用 `users` 表示比赛用户，不使用 `members`。

核心字段：

```ts
{
  uk: string;                // 唯一比赛标识，长度 3..32
  name: string;              // 展示/管理名称，长度 3..32
  contest: {
    title: string | I18NStringSet;
    startAt: string;
    duration: TimeDuration;
    frozenDuration?: TimeDuration;
    banner?: Image | ImageWithLink;
    refLinks?: Array<{ link: string; title: string }>;
  };
  problems: ProblemDTO[];
  users: UserDTO[];
  markers: MarkerDTO[];
  series: RankSeries[];
  sorter?: Sorter;
  contributors?: string[];
}
```

公开用户响应会过滤 `banned`、`broadcasterToken` 等管理字段；管理用户响应会包含这些字段。

## 事件 Protobuf

事件生产和消费沿用现有 proto：

- `rankland_live_contest_producer.BatchProducerEvent`
- `rankland_live_contest_client.BatchClientEvent`
- 共享事件类型定义在 `rankland_live_contest_common`

当前支持事件类型：

```text
NEW_SOLUTION
SOLUTION_ON_PROGRESS
SOLUTION_ON_RESULT_SETTLE
SOLUTION_ON_RESULT_CHANGE
CONTEST_CONFIG_CHANGE
```

生产者提交的 `ProducerEvent.type` 必须与 oneof payload 字段匹配。服务端会把出站 `ClientEvent` 中所有相对比赛开始时间的 `TimeDuration` 规范化为 `unit = NS`；`value` 是 int64 纳秒值，前端和脚本侧不要用会丢精度的 number 处理超大值。

## 管理 API

### 创建比赛

```text
POST /api/v2/contests
Auth: x-token
```

Body:

```json
{
  "uk": "contest-a",
  "name": "Contest A",
  "contest": {
    "title": "Contest A",
    "startAt": "2026-01-01T00:00:00Z",
    "duration": [5, "h"]
  },
  "problems": [],
  "users": [],
  "markers": [],
  "series": []
}
```

Data:

```json
{ "_id": "contest-uuid" }
```

创建比赛会同时创建一行 `contest_event_stream`，初始 `lastEventId=0`、`streamRevision=1`、无 producer lock。

### 更新比赛

```text
POST /api/v2/contests/:uk
Auth: x-token
```

Body 中字段均为可选：`name`、`contest`、`problems`、`users`、`markers`、`series`、`sorter`、`contributors`。

如果传入 `users` 数组，会替换当前 contest 的用户集合；未出现在新数组中的用户会被删除。

注意：当前代码路径可以处理 `users: null` 并清空用户集合，但 DTO 类型没有把它声明为正式接口契约；外部调用方应优先使用数组语义，除非后续专门把 `null` 契约化。

Data: `null`

### 查询比赛

```text
GET /api/v2/contests/:uk
Auth: x-token
```

Data:

```ts
{
  _id: string;
  uk: string;
  name: string;
  contest: ContestDTO;
  problems: ProblemDTO[];
  users: AdminUserDTO[];
  markers: MarkerDTO[];
  series: RankSeries[];
  sorter?: Sorter;
  contributors?: string[];
}
```

### 查询比赛用户

```text
GET /api/v2/contests/:uk/users
Auth: x-token
```

Data:

```ts
{
  users: Array<UserDTO & {
    banned: boolean;
    broadcasterToken?: string;
  }>;
}
```

### 查询比赛用户详情

```text
GET /api/v2/contests/:uk/users/:userId
Auth: x-token
```

Data: admin user object。

### 更新比赛用户

```text
POST /api/v2/contests/:uk/users/:userId
Auth: x-token
```

Body 字段均可选：

```ts
{
  name?: string | I18NStringSet | null;
  official?: boolean | null;
  avatar?: string | Image | null;
  photo?: string | Image | null;
  organization?: string | I18NStringSet | null;
  location?: string | null;
  teamMembers?: ExternalUser[] | null;
  markers?: string[] | null;
  banned?: boolean | null;
  broadcasterToken?: string | null;
}
```

Data: `null`

## 公开 API

### 公开查询比赛

```text
GET /api/v2/public/contests/:uk
```

Data 与管理查询比赛类似，但 `users` 中不包含 `banned`、`broadcasterToken`。

### 公开查询用户列表

```text
GET /api/v2/public/contests/:uk/users
```

Query:

```ts
{
  userId?: string;
  name?: string;
  organization?: string;
  location?: string;
  markerId?: string;
  official?: boolean;
  teamMemberName?: string;
  banned?: boolean;
}
```

注意：当前 public users DTO 暴露了 `banned` query 字段，但 controller 实现没有把它传入 service 过滤条件；公开响应也不会返回 `banned`。

同理，DTO 暴露了 `location` query 字段，但当前 controller 也没有透传给 service，因此它暂时不会生效。

Data:

```ts
{ users: UserDTO[] }
```

### 公开查询用户详情

```text
GET /api/v2/public/contests/:uk/users/:userId
```

Data: public user object。

## 事件生产 API

### JSON 追加

```text
POST /api/v2/contests/:uk/events
Auth: x-token
Required header: x-producer-id
Content-Type: application/json
```

Body:

```json
{
  "events": [
    {
      "eventId": 101,
      "type": "NEW_SOLUTION",
      "newSolutionData": {
        "solutionId": 501,
        "userId": "team-a",
        "problemAlias": "A",
        "time": { "value": "123000000000", "unit": "NS" }
      }
    }
  ]
}
```

Data:

```json
{
  "acceptedEventIds": [101, 102],
  "duplicateEventIds": [],
  "lastEventId": 102,
  "expectedNextEventId": 103,
  "streamRevision": 1
}
```

### Raw protobuf 追加

```text
POST /api/v2/contests/:uk/events
Auth: x-token
Required header: x-producer-id
Content-Type: application/protobuf
```

仅接受：

```text
application/x-protobuf
application/protobuf
```

Body 是 `BatchProducerEvent` protobuf 原始 bytes，最大 5 MiB。`application/octet-stream` 不再作为 events protobuf content type 接受。响应 data 与 JSON 追加相同。

事件追加成功提交事务后，服务端才会发送 SSE 通知。

## 事件消费 API

### HTTP catch-up

```text
GET /api/v2/contests/:uk/events
```

Query:

```ts
{
  afterEventId?: number;       // 默认 0
  limit?: number;              // 默认 1000，服务端限制 1..5000
  streamRevision?: number;     // 客户端本地事件流版本
  compactProgress?: boolean;   // URL 中传 compactProgress=false 才会关闭；默认 true
}
```

Data:

当 `Accept` 未声明、只声明通配类型，或 protobuf 类型优先级不低于 JSON 时，响应 body 为 `rankland_live_contest_client.GetContestEventsResponse` protobuf bytes，响应头携带：

```text
Content-Type: application/protobuf
X-RL-Resp-Success: true
X-RL-Resp-Code: 0
X-RL-Resp-Msg: OK
```

当 `Accept: application/json` 且没有更高优先级 protobuf 类型时，响应仍使用普通 JSON wrapper：

```ts
{
  success: true;
  code: 0;
  data: {
    uk: string;
    fromEventId: number | null;
    toEventId: number | null;
    checkpointEventId: number;
    latestEventId: number;
    streamRevision: number;
    hasMore: boolean;
    resetRequired: boolean;
    resetReason?: string;
    events: ClientEvent[];
  };
}
```

`checkpointEventId` 是消费者处理本次响应后可安全保存的 cursor。开启 compaction 时，返回事件可能是稀疏的，因此不要用 `toEventId` 替代 `checkpointEventId`。

如果 contest 配置了正数 `frozenDuration`，服务端会按 `duration - frozenDuration` 计算封榜起点。某个 solution 的 `NEW_SOLUTION.time` 落入封榜区间时，catch-up 响应会过滤该 solution 的 `SOLUTION_ON_PROGRESS`、`SOLUTION_ON_RESULT_SETTLE`、`SOLUTION_ON_RESULT_CHANGE`，但仍返回 `NEW_SOLUTION` 本身。这个过滤不受 `compactProgress` 影响；`compactProgress=false` 也会过滤封榜非 new 事件。判断依据只看 `NEW_SOLUTION.time`，不看 settle/change 事件自身的 time。

封榜过滤和 progress compaction 都不会改变 `checkpointEventId` 的含义：它仍然基于服务端本次扫描的过滤前 page 计算。因此响应里的 events 可能为空，但 `checkpointEventId` 仍会前进。

如果客户端传入的 `streamRevision` 已过期，或 `afterEventId` 大于服务端 `latestEventId`，响应会包含：

```json
{
  "resetRequired": true,
  "checkpointEventId": 0,
  "events": [],
  "resetReason": "stream revision changed"
}
```

### SSE 更新通知

```text
GET /api/v2/contests/:uk/events/stream
```

响应类型：

```text
Content-Type: text/event-stream; charset=utf-8
```

连接建立后，服务端会先写：

```text
retry: 1000

event: events-available
data: {"uk":"contest-a","latestEventId":0,"streamRevision":1}

```

事件追加或 reset 后会继续发送：

```text
event: events-available
data: {"uk":"contest-a","latestEventId":123,"streamRevision":1}

```

SSE 只表示“有新高水位”，不携带事件 payload。消费者必须通过 HTTP catch-up 读取事件数据。

### 查询事件流状态

```text
GET /api/v2/contests/:uk/stream
Auth: x-token
```

Data:

```ts
{
  contestId: string;
  uk: string;
  lastEventId: number;
  streamRevision: number;
  producerId?: string | null;
}
```

这个 API 查询的是 `contest_event_stream` 当前状态。

### 释放 producer lock

```text
POST /api/v2/contests/:uk/producer/release
Auth: x-token
```

Data: 同事件流状态。

释放后新的 producer 可以从当前 `lastEventId + 1` 继续追加。

### 重置事件流

```text
POST /api/v2/contests/:uk/events/reset
Auth: x-token
```

Data: `null`

效果：

- 删除当前 contest 的 `contest_event` 行。
- `contest_event_stream.last_event_id` 重置为 `0`。
- `contest_event_stream.stream_revision` 加 1。
- 清空 producer lock。
- 发送 SSE `events-available` 通知。

## 事件错误码

raw protobuf middleware 和事件流 service 可能返回：

| code | HTTP | 含义 |
| --- | ---: | --- |
| `INVALID_EVENT_BATCH` | 422 | protobuf decode/verify 失败、batch 为空、eventId 非法、payload 与 type 不匹配等 |
| `PRODUCER_LOCKED` | 409 | 当前事件流已被另一个 producer 锁定 |
| `EVENT_ID_GAP` | 409 | 收到的 eventId 没有接续当前高水位 |
| `EVENT_ID_CONFLICT` | 409 | 同一个 eventId 已存在，但 payload hash 不同 |
| `STREAM_REVISION_MISMATCH` | 409 | append 请求指定的事件流版本与服务端当前版本不一致 |
| `CONTEST_NOT_FOUND` | 404 | `uk` 对应 contest 不存在 |
| `PAYLOAD_TOO_LARGE` | 413 | raw protobuf body 超过 5 MiB |

参数校验失败通常为 HTTP 422、数字错误码 `-3`。普通 contest 管理 API 的业务错误通常不额外显式设置 HTTP status，而是通过响应体中的数字错误码表达。

普通 contest 管理 API 使用数字错误码：

| code | 含义 |
| ---: | --- |
| `100000` | contest 已存在 |
| `100001` | contest 未找到 |
| `100002` | contest user 未找到 |
