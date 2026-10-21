# Node 22 安全更新与请求编码边界

日期：2026-10-21。对应 [实施计划](implementation/2026-10-21-node22-security-plan.md)。

## 本轮范围

针对 Node.js 2026-10-21 安全公告，运行时从 Node 20 升级至已修补的
**22.23.4**，同时在应用 HTTP 入口拒绝压缩请求。保持现有认证、数据模型、
响应压缩、SSR、SSE 与存储逻辑。云防火墙由维护者后续配置；非 root 等 P1
加固不属于本轮变更。

## 为什么在 HTTP 入口拦截

现有依赖链是 bwcx-ljsm 1.0.3 → koa-bodyparser 4.4.1 → co-body 6.1.0 →
inflation 2.1.0。框架在 `_init()` 中安装 bodyparser，早于 `beforeWire()`、
路由中间件及 token guard。JSON/form 的请求体会直接根据 `Content-Encoding`
解压，GET 和不存在的路由同样可能进入解析器。

因此在 `src/server/index.ts` 唯一的 `http.createServer` 调用处，使用
`createApplicationHttpHandler(app.instance.callback())` 包装原 RequestListener。
该边界位于任何 Koa 中间件之前，开发、生产、E2E 和直连应用端口均使用它。
不替换解析器，不新增依赖，也不调整原有解析器和业务中间件的顺序。

请求编码规则：

- 无 `Content-Encoding`：原样放行。
- 单个 `identity`：大小写不敏感，忽略外围空白；放行前将解析后的头值规范化为
  `identity`，兼容 inflation 区分大小写的实现。
- `br`、`gzip`、`deflate`、未知值、空值、参数、逗号组合：返回 HTTP 415。
- 重复 `Content-Encoding` 字段：通过 `rawHeaders` 检测并拒绝，包括重复 identity。
- 拒绝时不调用 Koa，不读取或解压 body；发送固定响应与 `Connection: close`。
- 不检查 `Accept-Encoding`；它仅用于响应编码协商。正常请求仍保留 keep-alive/SSE。

JSON/form 的 5 MB 上限、multipart 的 8 MB 上限、Protobuf 原始 body 处理均保持。
仓库内未发现主动压缩请求的业务客户端；仓库外生产者需要改为发送原始 body。
由于拒绝发生在框架外，415 不走路由日志或 CORS middleware，跨域客户端可能观察到
CORS 网络错误；这不影响正常未压缩请求。

## 运行时和镜像

以下配置统一使用 Node 22.23.4：`.node-version`、测试/发布 CI、README 与应用
Dockerfile；`package.json` engines 为 `^22.23.4`，限制在已修补的 Node 22 系列。
保留现有依赖锁与类型声明，避免扩大依赖升级范围。

相邻 `../dockerfiles` 新增 `nodebase/Dockerfile.22`，基于
`node:22.23.4-bookworm`，保持 jemalloc 5.3.0 和已有工具。未复制旧镜像中的
Debian buster archive 源。CI 对 linux/amd64 与 linux/arm64 构建后发布：

- `algoux/nodebase:22`
- `algoux/nodebase:22.23.4`

应用 Dockerfile 消费明确的 `22.23.4` 标签，构建时检查实际 Node 版本及
`BROTLI_DECODER_ERROR_FORMAT_BLOCK_SWITCH` 常量。基础镜像对两个架构也执行这些
检查及正常 Brotli round-trip；任何一项失败均不能进入发布步骤。
**Brotli 版本字符串仍可能为 1.1.0，不能只根据该字符串判断修补状态。**

应用 CI 增加 `pull: true`，确保取得指定基镜像。版本标签不等同注册表强制不可变；
发布时记录镜像 digest，部署后核对每个实例的实际版本。

HTTP 入口拦截只解决入站路径。生产 SSR 使用原生 fetch 自动解码上游响应，仍需通过
Node 二进制升级覆盖；修改 Accept-Encoding 或只更新 npm 依赖不能替代运行时升级。

## 发布步骤与 secrets

初次检查时 `algoux/dockerfiles` 尚无 repository Actions secrets；维护者已运行脚本，
发布前已核实两项 secrets 存在。本地配置脚本位于：

```sh
cd /Users/bLue/GitProjects/algoux/dockerfiles
./scripts/set-dockerhub-secrets.sh --repo algoux/dockerfiles --username algoux
```

它隐藏输入 Docker Hub token，并通过 stdin 调用 `gh secret set`，设置
`DOCKERHUB_USERNAME`、`DOCKERHUB_TOKEN`。也支持 `--token-file PATH` 与
`--token-stdin`，完整说明见 dockerfiles README。username 是 token 所属的 Docker Hub
登录账号，需要对 `algoux/nodebase` 有推送权限。脚本会覆盖同名旧 secret；不要在本仓库
保存 token，也不要将 token 作为命令行参数。

发布顺序：

1. 配置 secrets，提交/推送 dockerfiles 的新配置。
2. 等待 `Build nodebase 22` CI 通过，确认两个架构的 `22.23.4` 镜像已发布。
3. 再提交/推送 rankland-web。既有 Test → Build Docker Image → VPS 部署流程继续生效。
4. 部署后逐实例核对 Node 版本、镜像 digest、健康状态；复测未压缩请求 200 与 br 请求
   415，检查 SSR、上传和 Live/SSE。
5. 由维护者收紧云防火墙对应用端口的访问；应用拦截并不依赖这项后续操作。

维护者配置 secrets 并要求继续后，已按上述顺序提交、推送及验收。用户选择依靠 CI
构建镜像，未重启本地 Docker 或执行本地镜像验证。原有备用实例仍因缺少
REDIS_NAMESPACE 等配置持续重启；本轮未修改该配置，当前两个主实例均健康。

## 实际发布结果

验收时间：2026-10-22 00:17（北京时间）。

| 项目                 | 结果                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| 基础镜像提交         | `030593a`                                                                                                     |
| 基础镜像 CI          | [39625366319](https://github.com/algoux/dockerfiles/actions/runs/39625366319)，amd64/arm64 校验成功           |
| 基础镜像摘要         | `sha256:fc7ffdedf6c943860a42ec8036fe9ec2d38c418876710c9f65d928a74ed20e2d`                                     |
| 最终应用发布提交     | `378e384`，包含 `d7a1800` 安全修复和 `7bec98d` 测试时钟修正                                                   |
| 应用测试 CI          | [39631520322](https://github.com/algoux/rankland-web/actions/runs/39631520322)，754 项测试及多进程 smoke 通过 |
| 应用发布 CI          | [39631971147](https://github.com/algoux/rankland-web/actions/runs/39631971147)，构建、推送、VPS 部署成功      |
| 生产镜像摘要         | `sha256:724823fcf403bd2a9ea17e3249d5d9859884339c5a38f2116ed408442a687762`，与 CI 输出一致                     |
| 两个生产主实例       | Node 22.23.4、healthy、零重启                                                                                 |
| 运行时修补证据       | Brotli marker = -17，Undici 6.29.1，OpenSSL 3.5.9                                                             |
| 公网及源站 3000/3001 | 普通和 IDENTITY 健康请求 200；br 请求 415                                                                     |
| 公开页面/API         | 首页和公开统计 API 均 200                                                                                     |

发布中修复了两项实际阻断：SSE 单元测试统一假定时器与单调时钟，保留原时序断言；
CI 将 concurrency 下移到受成功条件保护的发布 job，防止延迟到达且最终被跳过的
workflow_run 取消正常发布。生产 SSE 调度逻辑未改变。

发布期间发现根分区已满，释放本轮临时保留的旧镜像缓存后约剩余 2.4 GB（使用率
88%），没有删除业务文件；临时本地回滚标签已移除。云防火墙和 P1 加固由维护者后续处理。

## 验证记录

- Node 22.23.4 已本地安装并验证修补标记。
- 服务端 TypeScript 检查及客户端、SSR、服务端构建通过。
- 编码边界、HTTP listener、Protobuf、SSE 定向测试：40 项通过。
- 全量 Vitest：734 项通过；20 项 MySQL opt-in 测试另在临时连接配置下全部通过。
  临时覆盖仅修改测试连接地址/端口/库名，测试使用真实 MySQL，避免触及开发数据库。
- 双进程通知 smoke：本地/Redis 跨进程 fan-out、写进程退出恢复、命名空间错配恢复、
  Redis blackhole、SSE headers/retry/heartbeat、软删除断流检查通过。
- Playwright：首页、公开 v2 API、Live 页面 3 项通过。
- 构建后的生产入口本地探测：缺省/大写 identity 正常健康请求 200；br 健康请求、
  br 未知路径、gzip 请求均为 415。
- dockerfiles 脚本 Bash 语法、14 项 mock-gh 检查、隐藏输入检查、CI YAML 与发布顺序
  静态检查通过。没有向真实 GitHub secrets 发出写入请求。
- 独立补丁审查未发现实质问题；在 Node 22.23.4 下补充 8 项内存/回环协议检查，
  覆盖 chunked、trailer、Transfer-Encoding、Expect 100-continue、折叠/重复字段及
  HTTP/1.0。危险输入未调用 Brotli/Unzip 解码器，合法 chunked JSON 和原有 JSON
  错误行为保持。脚本另以 mock gh、假 token 和 bash -x 核对不泄漏。

## 资料

- [Node.js 官方安全公告](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
- [Node 22.23.4 更新记录](https://nodejs.org/en/blog/release/v22.23.4)
