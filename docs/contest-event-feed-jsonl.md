# Contest Event Feed JSONL

Updated: 2026-06-07

本文档定义 RankLand contest event feed v1 的 JSONL 存储格式。该格式用于保存一个比赛的初始配置和完整事件序列；本规范只描述文件结构，不定义导入、导出、校验器或 API 行为。

## 文件格式

- 文件编码为 UTF-8。
- 文件内容为 JSON Lines：每行必须是一个独立 JSON object。
- 文件外层没有数组或包装对象。
- 第 1 行是 feed 元数据对象。
- 第 2 行是比赛初始配置对象。
- 第 3 行开始，每行是一个 contest event 对象。

## 第 1 行：Feed 元数据

第 1 行固定为 feed 声明和元数据对象：

```ts
{
  eventFeedVersion: 1;
  state: "complete";
  uk?: string;
  createdAt: string; // ISO time string
}
```

字段说明：

- `eventFeedVersion`：当前固定为 `1`。
- `state`：当前 v1 只定义 `"complete"`，表示该文件包含完整 feed。
- `uk`：可选的比赛 UK，推荐包含以便快速识别 feed 对应的比赛。
- `createdAt`：文件创建时间，使用 ISO time string。

## 第 2 行：初始比赛配置

第 2 行是比赛的初始配置快照。它语义上对应 `src/common/shared/proto/rankland_live_contest/common.proto` 中的 `ContestConfigPatch`，但 feed 文件使用自然 SRK JSON 类型表达，不使用 protobuf `Struct` / `ListValue` / `Value` wrapper。

```ts
{
  name: string;
  contest: srk.Contest;
  problems: srk.Problem[];
  users: srk.User[];
  markers?: srk.Marker[];
  series?: srk.RankSeries[];
  sorter?: srk.Sorter;
  contributors?: srk.Contributor[];
}
```

字段说明：

- `name`、`contest`、`problems`、`users` 为必填字段。
- `contest`、`problems`、`users`、`markers`、`series`、`sorter`、`contributors` 使用 `@algoux/standard-ranklist` 的自然 JSON 形态。
- `users` 是公开 SRK user 数据，不应包含 `banned`、`broadcasterToken` 等管理或生产者私有字段。
- 未出现的可选字段表示该初始配置中未声明该字段；出现的字段表示对应顶层字段的完整值。

## 第 3 行起：Contest Events

第 3 行开始是比赛内的所有 event，每行一个 event 对象。event 使用 `src/common/shared/proto/rankland_live_contest/client.proto` / `producer.proto` 中 `ClientEvent` / `ProducerEvent` 的 camelCase JSON 形态：

```ts
{
  eventId: number;
  type: "NEW_SOLUTION"
    | "SOLUTION_ON_PROGRESS"
    | "SOLUTION_ON_RESULT_SETTLE"
    | "SOLUTION_ON_RESULT_CHANGE"
    | "CONTEST_CONFIG_CHANGE";
  newSolutionData?: NewSolutionEvent;
  solutionOnProgressData?: SolutionOnProgressEvent;
  solutionOnResultSettleData?: SolutionOnResultSettleEvent;
  solutionOnResultChangeData?: SolutionOnResultChangeEvent;
  contestConfigChangeData?: ContestConfigChangeEvent;
}
```

每个 event 必须满足：

- `eventId` 从 `1` 开始，并按文件顺序严格递增。
- `type` 推荐使用 enum name 字符串。
- 每个 event 只能包含一个与 `type` 匹配的 payload 字段。
- payload 字段名使用 camelCase，例如 `newSolutionData`、`solutionOnResultSettleData`。

payload 与 `type` 的对应关系：

| `type` | Payload 字段 |
| --- | --- |
| `NEW_SOLUTION` | `newSolutionData` |
| `SOLUTION_ON_PROGRESS` | `solutionOnProgressData` |
| `SOLUTION_ON_RESULT_SETTLE` | `solutionOnResultSettleData` |
| `SOLUTION_ON_RESULT_CHANGE` | `solutionOnResultChangeData` |
| `CONTEST_CONFIG_CHANGE` | `contestConfigChangeData` |

## Event 字段约定

事件 payload 字段沿用 proto 定义转换后的 camelCase 名称。例如：

- `solution_id` 写作 `solutionId`。
- `user_id` 写作 `userId`。
- `problem_alias` 写作 `problemAlias`。
- `percentage_progress` 写作 `percentageProgress`。
- `previous_result` 写作 `previousResult`。
- `changed_fields` 写作 `changedFields`。

`TimeDuration` 使用：

```ts
{
  value: string;
  unit: "S" | "MS" | "US" | "NS";
}
```

`value` 推荐写为字符串，以保留 proto `int64` 精度；`unit` 推荐使用 enum name 字符串。

`Result` 推荐使用 enum name 字符串，例如 `"AC"`、`"WA"`、`"CE"`。事件 result 表示原始评测结果；`FB` 是榜单计算属性，不应写入 event feed 的 result / previousResult 字段。`FZ` 是 deprecated 的展示兜底值，仅在数据源无法提供封榜期间原始结果时使用。

## 示例

```jsonl
{"eventFeedVersion":1,"state":"complete","createdAt":"2026-06-07T12:00:00.000Z"}
{"name":"Contest A","contest":{"title":"Contest A","startAt":"2026-06-07T08:00:00.000Z","duration":[5,"h"]},"problems":[{"alias":"A","title":"A+B"}],"users":[{"id":"u1","name":"Team 1"}],"series":[]}
{"eventId":1,"type":"NEW_SOLUTION","newSolutionData":{"solutionId":1001,"userId":"u1","problemAlias":"A","time":{"value":"120000000000","unit":"NS"}}}
{"eventId":2,"type":"SOLUTION_ON_RESULT_SETTLE","solutionOnResultSettleData":{"solutionId":1001,"result":"AC","time":{"value":"121000000000","unit":"NS"}}}
```
