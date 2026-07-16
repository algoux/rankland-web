# Redis SSR 页面缓存

`rankland-web` 的开发和生产 SSR renderer 都会用 Redis 缓存页面渲染结果。缓存只覆盖可识别的公开 SSR 路由：`/`、`/search`、`/ranklist/:id`、`/collection/:id` 和 `/live/:id`。

## Key

缓存 key 使用规范化后的 `path + query` 以及可选请求语言 scope 做 SHA-256 哈希，前缀为 `rankland:ssr:page:`。query 只保留业务白名单：

- 全局：`focus`、`聚焦`
- `/search`：`kw`
- `/collection/:id`：`rankId`
- `/live/:id`：`token`、`scrollSolution`

未知 query 不参与缓存 key，过长 URL 或未知路由直接跳过页面缓存。

`ssr` 是服务端渲染控制参数，仅在服务端 SSR 入口判断，不写入页面 route props 或 DTO，也不参与缓存 key。请求带 `ssr=0` 或 `ssr=false` 时会直接返回 CSR HTML，并跳过 SSR 页面缓存读写。

SSR 页面会解析请求头 `Accept-Language`，按 q 值和原始顺序生成语言优先级列表。存在有效语言时，该列表会作为缓存 key 的额外 scope，并写入首屏 `window.__INITIAL_STATE__` 供 hydration 使用；不同语言请求不会复用同一个 SSR HTML。请求头缺失或解析后没有有效语言时，不写入语言 scope，也不显式 fallback 到英语。

## TTL 和降级

- SSR 成功页：60 秒
- 数据 NotFound 页：5 秒
- transient load-failed 页：不缓存

Redis 读写异常会被记录并当作 cache miss 处理。SSR 渲染异常仍沿用原有 CSR fallback，不写入页面缓存。

## 浏览量副作用

页面缓存只复用 HTML，不复用页面请求对应的浏览量副作用。`/ranklist/:id` 和带 `rankId` 的 `/collection/:id` 在 fresh render 或 cache hit 返回 2xx HTML 后，都会启动一次不阻塞响应的服务端浏览量上报。缓存中的 hydration state 会关闭浏览器首屏 reporter，避免 SSR 与 hydration 重复计数。

`ssr=0`/`ssr=false` 的请求没有成功 SSR，因此服务端不计数；CSR 页面加载完成后由浏览器 reporter 上报。Not Found、transient load-failed、SSR 失败后的 CSR fallback，以及未选择榜单的 Collection 页也不会触发服务端上报。

## 配置

Redis 配置由 bwcx `@Config` 注入，可通过以下变量覆盖：

```bash
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASS=
REDIS_NAMESPACE=rankland:local
```

`REDIS_NAMESPACE` 不参与 SSR cache key；它用于隔离比赛事件可用通知的 Redis Pub/Sub channel。
Redis Pub/Sub 不按 `REDIS_DB` 隔离，因此同一部署的全部应用实例必须使用完全相同的 namespace，
不同环境或独立部署必须使用不同值。非生产环境缺失时默认 `rankland:local`；生产环境缺失或只包含
空白字符时应用拒绝启动。

运行期间 Redis 故障时，SSR 仍按 cache miss 降级，比赛事件通知仍保留本机 Hub 和 MySQL 校准；
该故障不改变应用 readiness。
