# Redis SSR 页面缓存

`rankland-web` 的开发和生产 SSR renderer 都会用 Redis 缓存页面渲染结果。缓存只覆盖可识别的公开 SSR 路由：`/`、`/search`、`/ranklist/:id`、`/collection/:id` 和 `/live/:id`。

## Key

缓存 key 使用规范化后的 `path + query` 做 SHA-256 哈希，前缀为 `rankland:ssr:page:`。query 只保留业务白名单：

- 全局：`focus`、`聚焦`
- `/search`：`kw`
- `/collection/:id`：`rankId`
- `/live/:id`：`token`、`scrollSolution`

未知 query 不参与缓存 key，过长 URL 或未知路由直接跳过页面缓存。

`ssr` 是服务端渲染控制参数，仅在服务端 SSR 入口判断，不写入页面 route props 或 DTO，也不参与缓存 key。请求带 `ssr=0` 或 `ssr=false` 时会直接返回 CSR HTML，并跳过 SSR 页面缓存读写。

## TTL 和降级

- SSR 成功页：60 秒
- 数据 NotFound 页：5 秒
- transient load-failed 页：不缓存

Redis 读写异常会被记录并当作 cache miss 处理。SSR 渲染异常仍沿用原有 CSR fallback，不写入页面缓存。

## 配置

Redis 配置由 bwcx `@Config` 注入，可通过以下变量覆盖：

```bash
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASS=
```
