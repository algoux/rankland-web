# MySQL DATETIME UTC 约定

Updated: 2026-07-14

## 核心约定

项目内所有 `DATETIME(6)` 都保存 **UTC 墙钟值**。例如绝对时刻
`2026-01-01T00:00:00Z` 在数据库中保存为：

```text
2026-01-01 00:00:00.000000
```

`DATETIME` 自身不携带时区，因此这个含义是项目协议，不是列值中的元数据。任何读写该数据库的程序都必须遵守本协议。

## 连接约束

共享 TypeORM DataSource 同时固定两层时区：

1. mysql2 `timezone: 'Z'`：负责 JavaScript `Date` 与 MySQL 时间字段之间的 UTC 编解码。
2. 每次从 pool 取得连接时，先执行并等待：

   ```sql
   SET SESSION time_zone = '+00:00';
   ```

第二层负责 `CURRENT_TIMESTAMP(6)`、`NOW(6)`、`ON UPDATE CURRENT_TIMESTAMP(6)` 以及未来 `TIMESTAMP(6)` 的 MySQL 会话语义。初始化失败时连接会被销毁，acquire 失败；应用首次连接失败会使 `DataSource.initialize()` 失败，不允许降级为未知时区继续运行。

每次 acquire 都会重新设置 session，因此连接复用、重连或 release 时的 session reset 不会绕过约束。当前 connector 不支持 TypeORM replication，`createPoolCluster` 会明确报错；未来增加 replication 前必须为集群中的每次连接获取实现同等保证。

业务 SQL 禁止执行 `SET [SESSION] time_zone`。如确需改变此约束，必须先修改本设计、connector 和时区矩阵测试。

## 业务写入

TypeORM 有列元数据时遵循以下规则：

- `Date`：按其代表的绝对时刻写入 UTC。
- 带 `Z` 或显式偏移的字符串：遵循字符串自身偏移后写入 UTC。
- 无偏移字符串：按 Node 进程当前时区解释，再写入 UTC。

因此部署环境的 `TZ` 可以是任意有效 IANA 时区；不得假定服务器一定是 UTC 或 Asia/Shanghai。

原生 SQL 的字符串参数没有 TypeORM 列元数据，驱动无法判断它是不是时间。写 `DATETIME`/`TIMESTAMP` 时应直接绑定 `Date`，或者先调用：

```ts
normalizeDateTimeInput(input: Date | string): Date
```

该 helper 会严格校验日历日期，拒绝诸如 `2026-02-30` 的输入；显式偏移支持 `+08:00` 和 ISO basic 形式 `+0800`。

不要把未转换的无偏移时间字符串直接传给 `dataSource.query()`、`queryRunner.query()` 或底层 mysql2。

不要给单个 `DATETIME` 列添加时区 transformer，也不要用 transformer 替代连接约束。这样未来新增 `TIMESTAMP(6)` 时，仍能在同一 UTC session 下正常进行 MySQL 的存储与读取转换。

## JSON API 输出

普通 JSON 成功响应中的真实 `Date` 会在统一响应边界转换为服务器当前时区、带显式偏移的 ISO 字符串：

```text
YYYY-MM-DDTHH:mm:ss[.SSS]±HH:mm
```

- 毫秒为零时省略 `.000`，非零时保留三位毫秒。
- UTC 环境也输出 `+00:00`，不输出 `Z`。
- offset 按目标时刻计算，因此支持 `America/New_York` 等地区的冬夏令时变化。
- 普通字符串、Buffer、带自定义序列化行为的对象不会被递归猜测或改写。
- protobuf、SSE、RSS/XML、HTML 和自定义字符串响应保持各自协议，不经过此 JSON 转换。

例如数据库中保存 `2026-01-01 00:00:00.000000`，后端环境为 `TZ=Asia/Shanghai` 时，API 返回：

```text
2026-01-01T08:00:00+08:00
```

当前 API 尚未暴露上述 10 个字段。未来把数据库时间加入 DTO 时，wire type 必须声明为 `string` 或 `string | null`，实体和服务内部仍使用 `Date`。

已知 raw-query 数据库时间是字符串时，应在 mapper 中显式调用：

```ts
formatDatabaseDateTimeForApi(value: Date | string | null): string | null
```

该 helper 会把无偏移 MySQL 字符串按数据库 UTC 协议解析。统一 JSON 遍历不会自动猜测字符串，以免误改 `contest.startAt` 或外部 API 字段。

## 精度

MySQL 函数生成的值可以在 `DATETIME(6)` 内保留微秒。JavaScript `Date` 最多表示毫秒，因此经 TypeORM 读入 Node 后以及 JSON API 输出时最多保留三位毫秒；这不是数据库列精度的变化。
