# Collection v2 API

Updated: 2026-07-15

本文档描述数据库 `collection` 实体及其 HTTP API。数据库表和列使用 snake_case，API DTO/JSON 字段使用 camelCase。

## 通用约定

Base path:

```text
/api/v2
```

管理和写入接口需要请求头：

```text
x-token: <AUTH_TOKEN>
```

公开读取接口不需要鉴权。普通 JSON 成功响应由全局响应处理器包装：

```json
{ "success": true, "code": 0, "data": {} }
```

## 数据模型

```text
id         BIGINT UNSIGNED PRIMARY KEY
uk         VARCHAR(64) NOT NULL UNIQUE
content    JSON NOT NULL
created_at DATETIME(6) NOT NULL
updated_at DATETIME(6) NOT NULL
deleted_at DATETIME(6) NULL
```

- `id` 由服务端 Snowflake 生成器分配，API 使用十进制字符串 `_id` 返回，不能转换为 JSON number。
- `uk` 长度为 `1..64`，创建后不可修改。软删除记录仍占用唯一键，不能用相同 `uk` 再次创建。
- `content` 接受任意合法 JSON 值，包括 `null`、boolean、有限 number、string、array 和 object。
- `updated_at` 由 MySQL 的 `CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)` 维护。
- 删除为软删除；公开读取自动排除 `deleted_at IS NOT NULL` 的记录。

错误码：

| Code     | 含义                                             |
| -------- | ------------------------------------------------ |
| `102000` | Collection 已存在（包括同 `uk` 的软删除记录）    |
| `102001` | Collection 不存在，或公开/写接口访问了已删除记录 |

## 管理 API

### 创建

```text
POST /api/v2/collections
```

Body:

```json
{
  "uk": "official",
  "content": { "ranklists": ["contest-a"] }
}
```

Data:

```json
{ "_id": "70346717215600640" }
```

### 更新

```text
PATCH /api/v2/collections/:uk
```

Body 必须提供 `content`，并整体替换原 JSON 值：

```json
{ "content": { "ranklists": ["contest-a", "contest-b"] } }
```

已删除记录不能更新。

### 查询全部

```text
GET /api/v2/collections
```

不分页，按 Snowflake 主键 `id DESC` 返回所有记录（包括已删除记录）。列表查询不会读取或返回 `content`。

Data:

```json
{
  "collections": [
    {
      "_id": "70346717215600640",
      "uk": "official",
      "createdAt": "2026-07-15T09:00:00+08:00",
      "updatedAt": "2026-07-15T09:30:00+08:00",
      "deletedAt": null
    }
  ]
}
```

### 查询单个

```text
GET /api/v2/collections/:uk
```

可查询已删除记录，返回 `_id`、`uk`、`content`、`createdAt`、`updatedAt`、`deletedAt`。

### 删除

```text
DELETE /api/v2/collections/:uk
```

只软删除活动记录。重复删除返回 `102001`。

## Public API

### 查询全部

```text
GET /api/v2/public/collections
```

不分页，按 `id DESC` 返回所有活动记录。响应结构与管理列表相同，但不含 `content` 和 `deletedAt`。

### 查询单个

```text
GET /api/v2/public/collections/:uk
```

返回活动记录的 `_id`、`uk`、`content`、`createdAt`、`updatedAt`，不含 `deletedAt`。已删除记录按不存在处理并返回 `102001`。

## 代码结构

- DTO 和客户端契约：`src/common/modules/collection/collection.dto.ts`
- Entity：`src/server/entities/collection.entity.ts`
- Migration：`src/server/database/migrations/1784084400000-CollectionSchema.ts`
- Controller：`src/server/modules/collection/collection.controller.ts`
- Service：`src/server/modules/collection/collection.service.ts`
- Typed client：`src/common/api/api-client.ts`（由开发服务启动时自动生成）
