# 比赛完结与最终 SRK

Updated: 2026-10-25

## 生命周期和接口

比赛状态采用数字枚举 `ContestStatus.Created = 0`、`ContestStatus.Finalized = 99`，API 中为
`status: 0 | 99`，与比赛时间独立。新建比赛默认 `created`（`0`），创建 API 不接收文件。
纯静态导入使用原有 create → upload → PATCH `srkFileID` 流程；PATCH 在当前流没有事件时原子完结。
已有事件的比赛可先关联文件而保持 `created`（`0`），最后调用带管理鉴权的
`POST /api/v2/contests/:uk/finalize` 生成权威文件。成功数据为 `{ uk, status: 99, srkFileID }`。

`finalized`（`99`）后的结果数据不可再写，包括事件追加／重置、SRK metadata、公开用户字段和最终文件关联。
名称、重定向、单用户 banned/broadcasterToken、浏览计数和比赛软删除保持可用。
同一文件 ID 的重复 PATCH 和重复 finalize 幂等；不能删除仍被未删除的已完结比赛引用的文件。
没有重新开放接口。

## 一致性和文件补偿

finalize 在 REPEATABLE READ 事务内按 contest → stream 加写锁，读取当前元数据、按顺序排列的用户，
并分页读取固定 revision、固定 lastEventId 以内的全部事件。追加、元数据、批量及单用户更新、重置
遵守相同的锁序；事务外不会读出另一版本的归档数据。上传期间仍持有锁，同场写入会等待。

共享 projector 沿用现有 live 排名、罚时、首解与重判逻辑，最终生成关闭 NEW 的封榜推定，
保留 SRK 中的 frozenDuration。当前事件协议没有题目分值，非 ICPC sorter 沿用现有实时投影的
ICPC-compatible 聚合，不增加分数制算法。仅使用当前配置，CONFIG_CHANGE 不作为历史配置重放。
取消提交不计分；缺失结果、PD/JG/FZ、终判后的新 PROGRESS 阻止完结。
事件缺口、重复 NEW、未知引用、损坏的 payload 均拒绝归档，不静默忽略。

`${uk}.srk.json` 使用唯一 Snowflake 文件路径、RankMain 类别、application/json、实际长度与 SHA-256。
UK 中不允许用于文件名的斜杠、反斜杠和控制字符替换为 `_`；正常 UK 的文件名不变。
上传成功后，文件记录、比赛文件引用和状态在同一事务提交。文件内容不包含 banned、broadcasterToken
或其他内部用户字段。空流可生成空结果榜；所有用户仍在 rows 中。

FS/COS 无法参加 MySQL ACID。上传或数据库失败后，释放原事务，在新事务重新获取比赛写锁，
确认原事务已结束并核对文件记录与比赛引用：确认未提交才删除本次唯一对象；若提交其实成功，
返回已提交结果；无法确认或清理失败则保留对象并记录 fileId、contestId、path，供运维核对。
绝不删除先前关联文件。进程被强制终止可能留下无数据库引用的对象，需要依据数据库引用人工清理。
缓存通知在提交后执行，失败不撤销归档。

## 事件视图和缓存

`ignoreFrozen=true` 仅在 events 内容接口生效，先校验管理令牌，再走带限流和超时的数据库快照路径，
绕过所有公开 cache/shadow 路径。返回 private, no-store；仅携带令牌不会自动切换视图。
普通 events 读取根据同一快照中的 status 决定封榜；`finalized`（`99`）的有效冻结边界为 null。
JSON/protobuf 和分页／compaction 协议保持不变。

统一 visibility helper 生成 duration、frozenDuration、数字 status fingerprint（`status=0` 或 `status=99`）。完结提交后通过既有
metadata control 失效本机和远端快照；旧构建任务被 generation token 阻止发布，丢失通知由
authority lease/reconciliation 收敛。旧的已开始响应可以完成，不承诺跨实例立即强一致。

不会递增 streamRevision、迁移事件或新增 SSE 帧。完结后／切换视角时，调用方需丢弃已有投影，
从 afterEventId=0 重放；从旧 checkpoint 继续不会补回此前隐藏事件。
现有 Live 页面重新载入 `finalized`（`status=99`）配置后也会关闭本地封榜推断，使已取消提交不再保留 `?`；
这不增加自动刷新或状态轮询。

## 迁移、部署和回退

1. 先暂停比赛管理写入和 producer，并记录所有 `srk_file_id IS NOT NULL` 的比赛数量。
2. 运行迁移 `ContestFinalization1792800000000`：新增 `status TINYINT UNSIGNED NOT NULL DEFAULT 0`，
   默认 `created`（`0`）；全部非空文件引用回填 `finalized`（`99`），包含软删除记录，
   通过显式 `updated_at=updated_at` 保留历史时间。
3. 更新所有读写实例到同一版本，核对迁移记录及状态数量后恢复写入。首次确认应检查最终文件可读、
   公开事件重拉已揭榜，监控 finalize 失败／补偿日志和现有 cache authority 指标。
4. 回退应用前必须停止管理写入及 producer：旧版本既不识别 `finalized`（`99`），也不会阻止改写结果。
   schema 可保留以保存状态；down 只删 status，不删除文件或事件，但会丢失状态，不应作为常规回退。

已有 SRK 的存量比赛全部视为完结，即使其历史事件未完整保存，也不重新生成旧文件。
本次交付包含迁移与运维说明，不执行生产迁移或部署。

## 验证入口

- 常规单测：`pnpm test`；服务端构建：`pnpm build:server`；客户端构建：`pnpm build:client`。
- 归档集成测试在专用本地 MySQL 运行，使用真实 FS 临时文件和模拟上传故障，不写 COS。
- 验证覆盖静态导入、pending/非法数据、并发/幂等、上传和数据库回滚、提交结果不确定时的恢复、
  finalized 写入限制、文件引用保护、两种传输格式及缓存视图隔离。

专用归档集成套件只在 `RUN_FINALIZATION_MYSQL_TESTS=true` 时启用，固定连接
`127.0.0.1:33324/rankland_finalization_test`（用户 `blue`、密码 `test`），不读取应用的 MYSQL_* 配置。
它会核对库名后重建该专用测试 schema，禁止将此端口转发到业务数据库。准备独立容器后运行：

```sh
RUN_FINALIZATION_MYSQL_TESTS=true pnpm test src/server/modules/contest/__tests__/contest-finalization.integration.test.ts
```

2026-10-24 本地验证：984 项常规测试、20 项归档 MySQL/真实 FS 集成测试、20 项既有 MySQL
事件存储和日期测试通过；完整迁移链与回退重放、编译后 HTTP JSON/protobuf 冒烟、前后端构建、
45 个改动 TypeScript 文件的 ESLint 均通过。未连接生产数据库或上传 COS。

2026-10-25 数字枚举调整后：990 项常规测试、20 项归档 MySQL/真实 FS 集成测试通过；实际迁移验证
`TINYINT UNSIGNED`、默认 `0`、存量回填 `99`、时间戳保留及回退重放通过，前后端构建与 ESLint 通过。
