# Contest v2 API

Updated: 2026-05-29

本文档描述 contest 相关 HTTP/SSE API。接口、DTO、JSON 字段使用 camelCase；MySQL 表和列使用 snake_case，并由 TypeORM entity 显式映射。

## 通用约定

Base path:

```text
/api/v2
```

### 响应内容协商（content negotiation）

响应的包装方式由请求 `Accept` 头与该端点声明支持的内容类型共同决定，业务代码不再手动拼装。规则：

- 解析 `Accept` 的 q 值并按优先级排序，选择端点支持且优先级最高的类型。
- 当未声明优先级，或多个支持类型优先级相同时，**优先 JSON**。
- 端点不支持任何被请求的类型时返回 `406 Not Acceptable`。
- 普通端点只支持 JSON，且为宽松模式（异常 `Accept` 不会 406，回退到 JSON）；只有声明了 protobuf 响应或 SSE 能力的端点才是严格模式。

解析出的内容类型挂在 `ctx.state.respContentType` 上，响应处理器与异常处理器据此包装。

### JSON 包装

成功：

```json
{ "success": true, "code": 0, "data": {} }
```

失败（body 非空，携带错误信息）：

```json
{ "success": false, "code": 100001, "msg": "该比赛未找到" }
```

业务错误码均为数字，来自 `ErrCode`：

```json
{ "success": false, "code": 100005, "msg": "事件 ID 不连续" }
```

### Protobuf 包装

当协商结果为 protobuf 时：

- 成功：response body 为该端点声明的 protobuf 响应消息的二进制，响应头：
  ```text
  Content-Type: application/protobuf
  X-RL-Resp-Success: true
  X-RL-Resp-Code: 0
  ```
  成功响应不带 `X-RL-Resp-Msg`。
- 失败：response body 为空，错误信息通过响应头表达：
  ```text
  X-RL-Resp-Success: false
  X-RL-Resp-Code: <code>
  X-RL-Resp-Msg: <url-encoded msg>
  X-RL-Resp-Meta: <url-encoded json>   # 可选，仅错误可携带额外元数据
  ```

### 端点能力声明

protobuf / SSE 能力通过路由方法上的装饰器声明为元数据，由通用中间件读取：

- `@ProtobufContract(ReqMessage | null, RespMessage | null)`：`ReqMessage` 使端点可接收 protobuf 请求体，`RespMessage` 使端点可返回 protobuf 响应。
- `@Sse()`：将端点标记为事件流端点。

### 请求体解码

对声明了 protobuf 请求消息的端点：

- `application/protobuf` / `application/x-protobuf`：按声明的消息解码到请求体（在校验之前）。最大 5 MiB，超出返回 `413`。
- `application/json`：交由 body parser 与 DTO 校验处理。
- 其它显式类型（如 `application/octet-stream`）：返回 `415 Unsupported Media Type`。
- 无法解码的 protobuf 字节：返回 `400 Bad Request`；业务层的批次校验失败使用数字错误码 `100003`。

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

所有需要鉴权的端点（含 protobuf 追加）都通过控制器上的 `AuthGuard` 鉴权，鉴权失败统一返回未授权信封（按内容协商包装；protobuf 请求则为空 body + `X-RL-*` 错误头）：

```json
{ "success": false, "code": -4, "msg": "未授权的操作" }
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

`BatchProducerEvent` 必须包含 `streamRevision` 和非空 `events`。

当前支持事件类型：

```text
NEW_SOLUTION
SOLUTION_ON_PROGRESS
SOLUTION_ON_RESULT_SETTLE
SOLUTION_ON_RESULT_CHANGE
CONTEST_CONFIG_CHANGE
```

生产者提交的 `ProducerEvent.type` 必须与 oneof payload 字段匹配。事件中的 `rankland_live_contest_common.Result` 表示原始评测结果，不等同于 SRK `SolutionResultLite` / `SolutionResultFull` 的完整结果集合；`FZ`（SRK `?`，封榜/未知展示态）是 deprecated 的展示兜底值，应尽量避免使用，但当数据源无法获取封榜期间的原始结果时仍可使用。`FB` 是计算属性，不允许出现在 append 或 get events 的 solution result / previousResult 中。

服务端会把出站 `ClientEvent` 中所有相对比赛开始时间的 `TimeDuration` 规范化为 `unit = NS`；`value` 是 int64 纳秒值。JSON 请求中若用 number 表示 `TimeDuration.value`，该 number 必须在 JS safe integer 范围内；超过范围时必须用字符串，否则服务端会拒绝该 batch。

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

`events` 单次 append 请求必须包含 `1..1000` 条事件；JSON 与 raw protobuf 追加都使用相同的条数限制。

Data:

```json
{ "_id": "contest-uuid" }
```

创建比赛会同时创建一行 `contest_event_stream`，初始 `lastEventId=0`、`streamRevision=1`、无 producer lock。

### 更新比赛

```text
PATCH /api/v2/contests/:uk
Auth: x-token
```

Body 中字段均为可选：`name`、`contest`、`problems`、`users`、`markers`、`series`、`sorter`、`contributors`。

接口语义固定为部分更新：未传字段不更新；传入字段只按外层字段整体替换，不支持 `a.b.c` 形式的深层字段局部更新。

如果传入 `users` 数组，会替换当前 contest 的用户集合；未出现在新数组中的用户会被删除。传 `users: []` 表示清空用户集合。

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
PATCH /api/v2/contests/:uk/users/:userId
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

接口语义固定为部分更新：未传字段不更新；传入字段只按外层字段整体替换，不支持 `a.b.c` 形式的深层字段局部更新。`teamMembers`、`markers` 等数组字段会整体替换；声明支持 `null` 的字段传 `null` 表示清空该字段。

Data: `null`

## 公开 API

### 公开查询比赛

```text
GET /api/v2/public/contests/:uk
```

Data 与管理查询比赛类似，但 `users` 中不包含 `banned`、`broadcasterToken`。

### 公开查询事件流

```text
GET /api/v2/public/contests/:uk/event-stream
```

Data:

```ts
{
  uk: string;
  lastEventId: number;
  streamRevision: number;
}
```

纯 HTTP 消费者可以先用这个接口获取当前 `streamRevision`，再调用 catch-up。

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
  "streamRevision": 1,
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

该端点通过 `@ProtobufContract(BatchProducerEvent, null)` 声明可接收 protobuf 请求体，由通用 protobuf 中间件在校验前解码。Body 是 `BatchProducerEvent` protobuf 原始 bytes，必须包含 `streamRevision`，最大 5 MiB（超出 `413`），且 `events` 条数必须在 `1..1000` 范围内。`application/octet-stream` 不被接受（`415`）。无法解码的字节返回 `400`。追加端点无 protobuf 响应消息，响应固定为 JSON（与 JSON 追加相同）。

append 请求的 `streamRevision` 必须等于服务端当前 `contest_event_stream.stream_revision`，否则返回 `ErrCode.ContestEventStreamRevisionMismatch`（`100007`）。

append 请求中的 solution result / previousResult 优先使用原始评测结果。服务端不会拒绝 `FZ`，仅当数据源无法获取封榜期间的原始结果时才建议用它作为兜底。但当前服务端会拒绝包含 `FB` 的 event batch；first blood 应由消费者或榜单计算层根据原始 AC 事件推导。

事件追加成功提交事务后，服务端才会发送 SSE 通知。

## 事件消费 API

### HTTP catch-up

```text
GET /api/v2/public/contests/:uk/events
```

Query:

```ts
{
  afterEventId?: number;       // 默认 0
  limit?: number;              // 默认 1000，服务端限制 1..5000
  streamRevision: number;      // 必填，客户端本地事件流版本
  compactProgress?: boolean;   // URL 中传 compactProgress=false 才会关闭；默认 true
}
```

Data:

该端点通过 `@ProtobufContract(null, GetContestEventsResponse)` 声明可返回 protobuf，支持的响应类型为 `application/protobuf` 与 `application/json`，按[响应内容协商](#响应内容协商content-negotiation)决定（平局或未声明优先级时优先 JSON；都不接受时 `406`）。

当协商结果为 protobuf 时，响应 body 为 `rankland_live_contest_client.GetContestEventsResponse` protobuf bytes，响应头携带：

```text
Content-Type: application/protobuf
X-RL-Resp-Success: true
X-RL-Resp-Code: 0
```

当协商结果为 JSON 时，响应使用普通 JSON wrapper：

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

响应中的 `ClientEvent` result / previousResult 通常为原始评测结果集合；若上游数据源无法获取封榜期间的原始结果，可能出现 deprecated `FZ`（SRK `?`）兜底值。响应不应包含 SRK `SolutionResultLite` / `SolutionResultFull` 中作为计算属性出现的 `FB`。需要展示 first blood 时，应基于 AC 事件和榜单状态自行计算。

如果 contest 配置了正数 `frozenDuration`，服务端会按 `duration - frozenDuration` 计算封榜起点。某个 solution 的 `NEW_SOLUTION.time` 落入封榜区间时，catch-up 响应会过滤该 solution 的 `SOLUTION_ON_PROGRESS`、`SOLUTION_ON_RESULT_SETTLE`、`SOLUTION_ON_RESULT_CHANGE`，但仍返回 `NEW_SOLUTION` 本身。这个过滤不受 `compactProgress` 影响；`compactProgress=false` 也会过滤封榜非 new 事件。判断依据只看 `NEW_SOLUTION.time`，不看 settle/change 事件自身的 time。

封榜过滤和 progress compaction 都不会改变 `checkpointEventId` 的含义：它仍然基于服务端本次扫描的过滤前 page 计算。因此响应里的 events 可能为空，但 `checkpointEventId` 仍会前进。

如果客户端省略或传入非法 `streamRevision`，参数校验失败。首次纯 HTTP 客户端应先调用公开 event stream 接口获取当前 `streamRevision`。如果客户端传入的 `streamRevision` 已过期，或 `afterEventId` 大于服务端 `latestEventId`，响应会包含：

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
GET /api/v2/public/contests/:uk/event-stream/notifications
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

### 查询事件流

```text
GET /api/v2/contests/:uk/event-stream
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
DELETE /api/v2/contests/:uk/event-stream/producer-lock
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

- 保留历史 `contest_event` 行作为旧 revision 归档。
- `contest_event_stream.last_event_id` 重置为 `0`。
- `contest_event_stream.stream_revision` 加 1。
- 清空 producer lock。
- 发送 SSE `events-available` 通知。

## 事件错误码

事件流 service 的业务错误统一通过 `LogicException` 抛出，失败时 JSON body 的 `code` 或 protobuf 响应的 `X-RL-Resp-Code` 均为 `ErrCode` 数字值：

| ErrCode | code | 含义 |
| --- | ---: | --- |
| `ContestEventInvalidBatch` | 100003 | batch 为空、eventId 非法、payload 与 type 不匹配等业务校验失败 |
| `ContestEventProducerLocked` | 100004 | 当前事件流已被另一个 producer 锁定 |
| `ContestEventIdGap` | 100005 | 收到的 eventId 没有接续当前高水位 |
| `ContestEventIdConflict` | 100006 | 同一个 eventId 已存在，但 payload hash 不同 |
| `ContestEventStreamRevisionMismatch` | 100007 | append 请求指定的事件流版本与服务端当前版本不一致 |
| `ContestNotFound` | 100001 | `uk` 对应 contest 不存在 |

传输层失败由通用中间件以标准 HTTP 状态返回：`406` 无法协商响应类型；`415` 请求体类型不支持；`413` 请求体超过 5 MiB；`400` protobuf 请求字节无法解码。

参数校验失败通常为 HTTP 422、数字错误码 `-3`。普通 contest 管理 API 的业务错误通常不额外显式设置 HTTP status，而是通过响应体中的数字错误码表达。

普通 contest 管理 API 使用数字错误码：

| code | 含义 |
| ---: | --- |
| `100000` | contest 已存在 |
| `100001` | contest 未找到 |
| `100002` | contest user 未找到 |
