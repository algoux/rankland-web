# 比赛文件存储与 Provider 设计

Updated: 2026-07-15

本文档描述 `/api/v2/files`、`/api/v2/public/files` 文件接口、`file` 表、Tencent Cloud COS Provider 和比赛 `srkFileID` 关联规则。

## 数据模型

`file` 表保存文件元数据，不保存独立的对象存储 `key`：

```text
id BIGINT UNSIGNED PRIMARY KEY
contest_id BIGINT UNSIGNED NOT NULL INDEX
category VARCHAR(32) NOT NULL DEFAULT ''
name VARCHAR(256) NOT NULL
path VARCHAR(256) NOT NULL
size INT UNSIGNED NOT NULL
hash_type VARCHAR(32) NOT NULL
hash_value VARCHAR(128) NOT NULL
created_at DATETIME(6) NOT NULL
updated_at DATETIME(6) NOT NULL
deleted_at DATETIME(6) NULL
```

`id` 和 `contest_id` 是 Snowflake ID，HTTP JSON 中始终以十进制字符串输出。`contest_id` 不设数据库外键；上传时由业务层确认比赛存在且未删除。文件软删除不删除 COS 对象，也不会自动清除比赛的 `srk_file_id`。

## HTTP API

管理接口都需要 `x-token`：

```text
POST   /api/v2/files
GET    /api/v2/files/:id
DELETE /api/v2/files/:id
```

另提供无需鉴权的公开查询接口：

```text
GET /api/v2/public/files/:id
```

上传使用 `multipart/form-data`，只接受：

- `contestId`：比赛 Snowflake ID 字符串。
- `category`：可选，最大 32 字符；省略时保存为空串。
- `file`：文件字段，沿用服务端 8 MiB multipart 上限。

上传成功、管理端或公开端按 ID 查询均返回：

```ts
{
  id: string;
  contestId: string;
  category: string;
  name: string;
  path: string;
  size: number;
  hashType: "sha256";
  hashValue: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}
```

公开查询只能获取未删除文件，响应不包含 `deleted_at` / `deletedAt`；已删除或不存在的文件返回 `FileNotFound`。

删除接口只设置 `deleted_at`，成功 Data 为 `null`；已删除或不存在的文件返回 `FileNotFound`。

## 原始文件名与路径

`name` 直接使用 multipart 解析得到的完整 `originalname`，不会调用 `basename`、按 `.` 分割、截断扩展名或重命名。空格、Unicode 字符和多个扩展名均原样保存。例如：

```text
originalname = demo.srk.json
id           = 70346717215600640
path         = 70346717215600640/demo.srk.json
```

为了保证路径只有 `${id}/` 这一层目录，文件名不能是空串、`.`、`..`，也不能包含 `/`、`\`、NUL 或其他控制字符。`name` 和最终 `${id}/${originalname}` 都必须能完整写入各自的 `VARCHAR(256)`；超长时返回 `FileInvalidName`，不会截断。

服务器的 multipart 解析开启 `preservePath`，因此请求头中恶意携带的目录片段不会在进入业务校验前被自动裁成 basename，而是会被上述分隔符规则明确拒绝。

数据库中的 `name` / `path` 保留原文。下载 URL 由 `fileBaseUrl` 和对 `path` 每一段分别执行 URL 编码后的结果以单斜杠拼接。

## 上传顺序与一致性

服务端从内存 Buffer 计算 SHA-256 小写十六进制摘要，并依次执行：

1. 生成 Snowflake ID、原始文件名路径和摘要。
2. 调用配置的 Provider，等待对象存储上传或本地文件写入成功。
3. 插入 `file` 元数据。
4. 返回文件信息和最终下载 URL。

Provider 失败时不会插入数据库。若 Provider 已写入对象或文件但数据库写入失败，服务端记录文件 ID、比赛 ID 和存储路径用于人工清理，并返回 `FileUploadUnknown`；本轮不执行 COS 或 FS 补偿删除。

## Provider 与配置

Provider 通过适配器接口解析，目前支持：

- `FS`（默认）：在 `${fs.basePath}/${path}` 创建目录并写入文件；默认 base path 是当前工作目录下的 `temp/file/`，服务同时将该目录挂载到同源 `/file/` 下载路径。
- `TencentCloud`：使用 `cos-nodejs-sdk-v5.putObject`，单次 COS 请求超时为 30 秒。COS object `Key` 只在上传时由规范化后的 `${tencentCloud.basePath}/${path}` 构造，不写入数据库或 HTTP DTO；未设置 `FILE_BASE_URL` 时使用 `https://cdn.algoux.cn/rankland/file/`。

两种 Provider 以及开发、生产环境都使用同一个 `FileConfig`。`tencentCloud` 与 `fs` 是配置类的两个顶层对象成员，所有环境变量覆盖在该类实例化时统一完成。

默认值：

```text
FILE_PROVIDER=FS
FILE_BASE_URL=/file/
FS_BASE_PATH=<cwd>/temp/file/
COS_BASE_PATH=rankland/file/
```

生产环境支持以下环境变量：

```text
FILE_PROVIDER
FILE_BASE_URL
FS_BASE_PATH
COS_SECRET_ID
COS_SECRET_KEY
COS_DOMAIN       # 可选，自定义 COS domain
COS_BUCKET
COS_REGION
COS_BASE_PATH
```

无论 `NODE_ENV` 为何，使用 `TencentCloud` 时缺少 `COS_SECRET_ID`、`COS_SECRET_KEY`、`COS_BUCKET` 或 `COS_REGION` 都会直接启动失败。使用默认 `FS` 时不需要 COS 配置。

Compose 模板将 FS 目录挂载到共享的 `rankland-files` 命名卷，因此容器重建不会丢失文件，复制 `app-2` / `app-3` 服务时也会访问同一份内容。若自行部署多个实例，必须让所有实例的 `FS_BASE_PATH` 指向同一共享文件系统；也可以设置外部 `FILE_BASE_URL` 交由反向代理或 CDN 下载。

## 错误码

```text
101000 FileNotFound
101001 FileInvalidName
101002 FileUploadTooLarge
101003 FileUploadAccessDenied
101004 FileUploadUnavailable
101099 FileUploadUnknown
```

COS 权限或鉴权错误以及 FS 权限错误映射为 `FileUploadAccessDenied`；常见 COS 网络、超时、bucket、区域、服务端错误和 FS 容量/可用性错误映射为 `FileUploadUnavailable`；其余上传异常记录原始服务端日志后返回 `FileUploadUnknown`。

## 比赛关联

比赛 `srkFileID` 只能通过 `PATCH /api/v2/contests/:uk` 设置或传 `null` 清除。非空文件必须属于同一比赛且未删除，否则返回 `FileNotFound`。数据库不创建外键，文件删除也不修改比赛记录。
