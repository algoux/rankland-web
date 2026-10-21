# Node 22 安全更新实施计划

日期：2026-10-21。范围：rankland-web 与相邻 dockerfiles 仓库。

## 目标与边界

- 将 Node 20 以最小主版本跨度升级至已修补的 Node 22.23.4。
- 在任何请求体解码之前拒绝压缩请求，封闭匿名 Brotli 入站攻击面；Node 运行时更新同时覆盖 SSR 原生 fetch 的出站解码。
- dockerfiles 新增 Node 22 基础镜像与多架构发布 CI，并提供本地 gh secrets 配置脚本。
- 保留已有工作区改动，不新建分支/工作树。初始阶段只实现与验证；用户完成 secrets 配置并要求继续后，进入两仓库提交、CI 发布及线上验收。
- 云厂商防火墙由用户后续操作；非 root、文件系统只读等 P1 加固不在本轮范围。

## 分段实施

1. [完成] 核对框架注册顺序、HTTP 入口、基础镜像/CI、secrets 配置及测试环境。
2. [完成] dockerfiles 新增固定修补版本的 Node 22 镜像、CI 与 secrets 脚本。
3. [完成] rankland-web 统一 Docker/开发/CI Node 版本，并在原生 HTTP 入口阻断非 identity 请求编码。
4. [完成] 验证编码绕过与正常 JSON/form/multipart/protobuf 请求，执行 Node 22 下的项目测试、构建及隔离集成检查。用户明确选择不做本地镜像验证，镜像交由 CI 双架构构建及运行时断言验证。
5. [完成] 一次独立绕过/回归审查未发现实质问题；补充 8 项 Node 22 回环协议检查通过，设计和发布说明已沉淀。
6. [进行中] dockerfiles `030593a` 已通过双架构 CI 并发布。应用 `d7a1800` 首轮 CI 被已有 SSE 测试时钟问题阻断；修正测试后重跑，再检查生产实例。

## 必须保持的行为

- 未压缩请求及单一 identity 编码继续工作，响应 Accept-Encoding 协商不受影响。
- 所有方法与路径统一拦截，包含健康检查、未知路径、静态文件；不能依赖业务路由或 token guard。
- 重复、组合、未知编码不得到达 bodyparser；拒绝响应为 HTTP 415。
- 保持已有 JSON/form 5 MB 与 multipart 8 MB 上限、Protobuf 处理、SSR 和 SSE 逻辑。
- secrets 不进入命令历史、脚本源码、日志或仓库；本轮只提供脚本，不写入真实凭据。

## 发布顺序

用户已运行 secrets 配置脚本并要求继续；已核实两项 repository secrets 存在。
先提交并发布 nodebase:22.23.4，确认镜像内 Node 与修补标记，再发布依赖该标签的 rankland-web。
代码验证完成不能代替生产验收完成。

## 验证记录

- `fnm exec --using v22.23.4 corepack pnpm@9.15.9 exec tsc -p src/server/tsconfig.json --noEmit`：通过。
- 定向 Vitest（HTTP 编码边界、listener、Protobuf、SSE）：40 项通过。
- 全量 `vitest run --config vitest.config.ts --threads=false`，启用独立 Redis：734 项通过。
- 两组 MySQL opt-in 集成测试，以临时 setup 仅覆盖连接配置：20 项通过；不连接默认开发库。
- `pnpm run build:e2e`：客户端、SSR、服务端均通过。
- `pnpm run test:notification-smoke`，隔离 MySQL/Redis：全部双进程检查通过；未启用可选 Nginx smoke，因为本轮未改反代。
- `playwright test tests/e2e/home.spec.ts tests/e2e/public-api.spec.ts tests/e2e/live.spec.ts`：3 项通过。
- 构建后的生产入口本地探测：普通/IDENTITY 请求 200，br 与 gzip 请求 415，含未知路由。
- secrets 脚本 Bash 语法、mock-gh 与隐藏输入验证通过；未执行真实 secrets 写入。
- 两仓库 diff whitespace 检查通过；新增 TypeScript/文档格式检查通过。
- 本机 Docker 存储只读；根据用户后续明确指示不重启、不本地构建镜像。已推送基础镜像提交，等待 GitHub Actions 处理发布事件。
- 发布前线上检查：两个主实例健康；原有 standby 失败原因为缺少 REDIS_NAMESPACE 等环境配置。本轮不扩展修改该既有配置。
- 首轮应用 CI 753 项通过、1 项失败。SSE 分片测试混用假定时器与真实 performance 时钟；在首批写入注入 5 ms 实际耗时可稳定复现。仅统一测试单调时钟后，同一探针与全部 21 项 Hub 测试通过；探针已移除，保留原有严格时序断言，生产调度逻辑未变。

## 实施决策

采用原生 HTTP RequestListener 包装器，在调用 Koa callback 前校验 Content-Encoding。
相比替换框架自动 bodyparser，该切入点无需新增依赖或变更解析器顺序；保留全部正常请求行为。
设计、边界细节与两仓库发布先后顺序已记录于 [设计文档](../node22-security-update.md)。
