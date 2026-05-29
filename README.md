# rankland-web

一个基于 bwcx 的全栈 SSR 项目模板（created at 2021）。

包含技术栈：
- Vue 3 (Class Component First)
- TypeScript
- Vite

## 准备

1. 安装并使用 Node.js 16（推荐使用 fnm 自动切换版本）。
2. 安装并使用 pnpm v8。
3. 准备本机 MySQL。默认开发连接配置为：

```text
host: 127.0.0.1
port: 3306
user: blue
password: test
database: rankland
```

4. 首次参与开发时，需要先创建 database。TypeORM migration 会创建表，但不会创建 database：

```sql
CREATE DATABASE rankland
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

5. 安装依赖：

```bash
pnpm run init
```

6. 初始化或更新数据库结构：

```bash
pnpm run db:migration:run
```

TypeORM 会在 `typeorm_migrations` 表记录已经执行过的 migration。再次执行该命令时，只会按时间戳顺序运行尚未记录的新 migration。

## 开发

1. 运行开发服务：

```bash
pnpm run dev
```

2. 在浏览器中打开 <http://127.0.0.1:3000/>。

开发环境可以通过环境变量覆盖默认 MySQL 配置：

```bash
MYSQL_HOST=127.0.0.1 \
MYSQL_PORT=3306 \
MYSQL_USER=blue \
MYSQL_PASS=test \
MYSQL_DB=rankland \
pnpm run dev
```

运行时不会自动执行 migration。切换分支、拉取代码或新增 migration 后，请手动运行：

```bash
pnpm run db:migration:run
```

如果修改了 TypeORM Entity 并需要生成 schema 迁移文件，运行：

```bash
pnpm run db:migration:generate
```

生成的 migration 需要人工 review 后提交。

## 设计文档

- [Contest 事件架构](docs/contest-event-architecture.md)
- [Contest v2 API 文档](docs/contest-api.md)
- [生产者 / 消费者实现指导](docs/contest-producer-consumer-guide.md)
- [Contest 事件实现进度](docs/contest-event-implementation-progress.md)

## 测试

运行单元测试：

```bash
pnpm run test
```

运行依赖本机 MySQL 的集成测试：

```bash
RUN_MYSQL_TESTS=true pnpm run test
```

## Contest v2 API

比赛相关接口统一使用 `/api/v2` 前缀。创建和更新比赛时使用 `users` 字段表示比赛用户。需要管理权限的接口使用 `x-token: <AUTH_TOKEN>`，事件追加还需要 `x-producer-id`：

```text
POST /api/v2/contests                              x-token
POST /api/v2/contests/:uk                          x-token
GET  /api/v2/contests/:uk                          x-token
GET  /api/v2/public/contests/:uk
GET  /api/v2/contests/:uk/users                    x-token
GET  /api/v2/contests/:uk/users/:userId            x-token
POST /api/v2/contests/:uk/users/:userId            x-token
GET  /api/v2/public/contests/:uk/users
GET  /api/v2/public/contests/:uk/users/:userId
POST /api/v2/contests/:uk/events                   x-token, x-producer-id
GET  /api/v2/contests/:uk/events
GET  /api/v2/contests/:uk/events/stream
GET  /api/v2/contests/:uk/stream                   x-token
POST /api/v2/contests/:uk/producer/release         x-token
POST /api/v2/contests/:uk/events/reset             x-token
```

`POST /api/v2/contests/:uk/events` 支持直接传 `BatchProducerEvent` 等价 JSON，也支持 raw protobuf bytes；protobuf content type 仅允许 `application/x-protobuf` 或 `application/protobuf`。`GET /api/v2/contests/:uk/events` 会按 `Accept` 返回 `GetContestEventsResponse` protobuf bytes 或等价 JSON。

`contest.uk` 是唯一比赛标识。MySQL 表字段使用 snake_case；例如 `contest_event_stream` 只保存 `contest_id`、事件高水位和 producer lock，不保存冗余 `uk`。接口、DTO 和业务代码中的字段仍使用 camelCase，并由 TypeORM 映射到 snake_case 列。

## 构建

```bash
pnpm run build
```

## 部署

服务以单个前台 Node 进程运行，不再使用 PM2 cluster。生产环境应在启动服务前显式执行 migration：

```bash
pnpm run db:migration:run
pnpm run build
MYSQL_HOST=... \
MYSQL_PORT=3306 \
MYSQL_USER=... \
MYSQL_PASS=... \
MYSQL_DB=... \
AUTH_TOKEN=... \
pnpm run start
```

`NODE_ENV=production` 下必须提供 `MYSQL_HOST`、`MYSQL_USER`、`MYSQL_PASS` 和 `MYSQL_DB`。生产启动不会自动迁移数据库。

## 开发指南

### 目录结构

本项目模板采用了基于运行时 -> 模块的目录分层结构：

```
src/
  client/
  common/
  server/
```

为了规避混合运行时带来的潜在错误风险，前端和后端代码应放置在对应目录下，而涉及在前后端共享的模块（如错误码枚举、公共接口、公共服务、DTO、RPO）推荐放置在 `common`。

### 后端开发

服务端使用 bwcx，提供简洁的 OOP 开发体验，参考 [bwcx 文档](https://bwcxjs.github.io/bwcx/)。

### 前端/前后端一体化开发

前端使用 Vue 3。本模板的前端组件（位于 `src/client/modules/`）均采用类组件的方式向你展示如何开发，但你仍可以使用选项式 API 或 setup 语法糖进行开发（不推荐）。

#### 数据预取

要使用兼容 SSR/CSR 的数据预取，请在类组件中使用 `asyncData` 钩子获取数据。其返回值可以直接提供给页面组件的 props 使用：

```typescript
export default class SomeComponent extends Vue {
  // 从 asyncData 返回对象中获取 SSR 或页面导航时所需的初始数据
  @Prop() public msg: string;

  async asyncData({ to }: AsyncDataOptions) {
    return {
      msg: `hello ${to.name}`,
    };
  }
}
```

`asyncData` 中不可访问组件 `this`，这是由于 Vue Class Component 的限制，我们不得不将 `asyncData` 作为组件实例方法提供，但实际上你应该将它视为静态方法。

#### 请求后端接口

后端开发的接口可以借助 `@Api.Summary` 和 `@Contract` 装饰器声明为 API。这样你可以在前端通过下列方式一键调用接口，且带有完备的类型提示。

开发后端接口：

```typescript
@Controller('/api')
export default class SomeController {
  @Api.Summary('接口描述')
  @Get()
  @Contract(SomeApiReqDTO, SomeApiRespDTO)
  public async someApi(@Data() data: SomeApiReqDTO): Promise<SomeApiRespDTO> {
    return ...
  }
}
```

在前端直接调用接口：

```typescript
// 直接通过组件内 asyncData 或 $api 调用
export default class SomeView extends Vue {
  async asyncData({ apiClient }) {
    const res = await apiClient.someApi({ ... });
    return res;
  }

  async mounted() {
    const res = await this.$api.someApi({ ... });
  }
}

// setup 或组合式 API 函数
const apiClient = useApiClient();
const res = await apiClient.someApi({ ... });
```


#### 前端路由和导航

使用 `@View` 和 `@RenderMethod` 为页面视图组件声明路由，这样可以无需定义前端路由配置并自动在后端装配该路由。

要导航到其他页面，请通过组件实例上的 `$$router` 进行导航。在本模板中，根据习惯约定页面路由组件以 `.view.vue` 结尾，以和其他组件进行区分。

示例：
```typescript
@View('/demo', DemoHomeRPO)
@RenderMethod(RenderMethodKind.SSR)
export default class Demo extends mixinRouteProps(DemoHomeRPO) {
  public goToDetail(id: string) {
    return this.$$router.to('DemoDetail').push({
      id,
    });
  }
}
```
