# RankLand 迁移人工验收清单

日期：2026-05-25
分支：`migration/live-page-foundation`
验收人：cooper

本文档用于人工验收 RankLand 路由兼容迁移结果。请用以下标记填写每一项：

- `[x]` 已通过
- `[ ]` 尚未检查
- `[~]` 可接受，但需要后续跟进
- `[!]` 阻塞发布或迁移收口

如果某项未通过，请尽量写清楚：页面 URL、视口尺寸、测试数据、期望行为、实际行为，以及截图或录屏路径。

## 验收结论摘要

- 总体结论：`[ ]` 接受迁移 / `[x]` 带后续事项接受 / `[ ]` 暂不接受，需先修复阻塞项
- 是否接受“路由兼容完成”，不要求旧 React/Ant Design 像素级一致：`[ ]` 是 / `[x]` 否。要求进行像素级别还原，使用antd vue。
- 剩余产品 polish 是否可以放到迁移收口之后处理：`[ ]` 是 / `[x]` 否
- 最高优先级后续 slice：
- 发布、合并或收口阻塞项摘要：

验收备注：

```text

```

## 验收前置检查

在 `/Users/cooper/Projects/RankLand/rankland-web` 执行。

```bash
fnm use 24
node -v
corepack pnpm -v
corepack pnpm install --frozen-lockfile # 为什么要 --frozen-lockfile
corepack pnpm run gen:client-router 
corepack pnpm test:migration
git diff --check
git status --short --branch
```

预期基线：

- Node：`v24.11.1` 或兼容 `^24.0.0`
- pnpm：`8.15.9` 或兼容 `^8.0.0`
- `gen:client-router`：生成 8 条 client route，且没有非预期路由文件 diff
- `test:migration`：build、unit、SSR、浅层 E2E、full-chain E2E 全部通过

检查项：

- `[x]` 运行时为 Node 24 和 pnpm 8
- `[x]` 依赖可以用 frozen lockfile 安装
- `[x]` 路由生成命令正常退出
- `[x]` 生成路由文件没有非预期漂移
- `[!]` 完整迁移门禁通过
- `[x]` `git diff --check` 通过
- `[x]` 当前工作区变更已确认，不包含未知风险

备注：

```text
test:migration 存在一个异常点：  
1 failed
  [chromium] › app-shell.spec.ts:131:7 › app shell full-chain behavior › keeps the app shell within desktop and mobile viewport bounds
31 passed (15.0s)
```

## 全局外壳与跨路由行为

请分别在桌面和移动端视口检查。建议桌面视口：`1440x900`。建议移动端视口：`390x844`。

检查项：

- `[x]` 普通路由会显示全局导航
- `[x]` Logo 和主导航链接跳转到预期路由
- `[x]` 站点切换行为可接受
- `[x]` `focus=yes` 在应兼容旧版聚焦模式的页面隐藏全局外壳
- `[x]` 联系弹窗可以打开、关闭，并展示邮箱和 QQ 群图片
- `[x]` 长页面 BackTop 行为可接受
- `[x]` 系统主题同步行为可接受
- `[ ]` macOS Blink 优化 class 没有引入视觉问题
- `[x]` 迁移后的公开路由桌面端没有横向溢出
- `[x]` 迁移后的公开路由移动端没有横向溢出
- `[ ]` 直达页面和前端跳转后的页面标题可接受
- `[x]` 直接刷新公开路由 URL 可正常工作
- `[!]` 公开资源缺失时的 Not Found 行为可接受

需要决策：

- App shell 是否需要精确复刻 Ant Design 菜单/dropdown 样式：`[ ]` 接受当前实现 / `[ ]` 后续处理 / `[x]` 阻塞
- GA/pageview dispatch 是否需要补齐：`[ ]` 接受延期 / `[x]` 收口前处理 / `[ ]` 阻塞

备注：

```text
macOS Blink 优化 class 没有引入视觉问题 不知道怎么测试
直达页面和前端跳转后的页面标题可接受 没看懂
需要尽可能复刻整个前端样式。
```

## 首页 `/`

测试 URL：

- `http://127.0.0.1:3000/`
- `http://127.0.0.1:3000/?focus=yes`

检查项：

- `[!]` SSR 首屏可以看到首页内容
- `[!]` Hydration 后没有明显内容闪烁、重复或断裂
- `[x]` 统计区域展示可接受
- `[x]` 最近榜单或榜单内容展示可接受
- `[x]` 搜索入口行为可接受
- `[x]` 结构化内容和标题满足当前 SEO 基线
- `[x]` 桌面端布局可接受
- `[x]` 移动端布局可接受
- `[x]` 首页联系入口可正常打开联系弹窗
- `[ ]` 上游空数据或失败状态可接受，如已测试

需要决策：

- 首页更完整的 SEO/content polish：`[x]` 接受当前实现 / `[ ]` 后续处理 / `[ ]` 阻塞
- 是否要求旧首页视觉精确一致：`[ ]` 不要求 / `[ ]` 后续处理 / `[x]` 阻塞

备注：

```text
进入、刷新页面时有明显闪烁，应该是SSR问题
```

## 搜索页 `/search`

测试 URL：

- `http://127.0.0.1:3000/search`
- `http://127.0.0.1:3000/search?kw=test`
- `http://127.0.0.1:3000/search?kw=`

检查项：

- `[x]` 空查询展示最近榜单
- `[x]` `kw` 查询展示匹配结果
- `[x]` 空 `kw` 按最近榜单状态处理
- `[x]` 结果数量展示或选择器文案可接受
- `[x]` 搜索结果卡片和链接跳转正确
- `[x]` 浏览器后退、前进行为可接受
- `[x]` 桌面端布局可接受
- `[x]` 移动端布局可接受
- `[ ]` 如果检查过网络请求，没有非预期上游请求或外部请求
- `[ ]` 空结果状态可接受，如已测试

需要决策：

- 搜索页 route parity 之后的产品 polish：`[ ]` 接受当前实现 / `[x]` 后续处理 / `[ ]` 阻塞

备注：

```text
route parity是什么，有什么影响？如果需要开发应该怎么开发？
```

## 榜单详情页 `/ranklist/:id`

测试 URL：

- `http://127.0.0.1:3000/ranklist/<已知榜单 id>`
- `http://127.0.0.1:3000/ranklist/<已知榜单 id>?focus=yes`
- `http://127.0.0.1:3000/ranklist/<不存在的榜单 id>`

检查项：

- `[!]` SSR 首屏可以看到榜单内容
- `[x]` Hydration 后榜单内容保持正常
- `[x]` 有效榜单的 SRK 表格渲染达到验收标准
- `[ ]` 缺失榜单展示 Not Found
- `[x]` 筛选和进度控制可用
- `[x]` 点击行或成员可以打开用户弹窗
- `[x]` rank-time 面板展示的单位、G2 曲线和过题事件可接受
- `[x]` 导出 SRK 可用
- `[ ]` 导出 Gym Ghost 可用
- `[ ]` 导出 VJudge replay 可用
- `[x]` 导出 XLSX 可用
- `[x]` 分享链接正确
- `[ ]` iframe 嵌入代码正确
- `[x]` 相关 SRK 资源的 asset URL 重写可用
- `[x]` 页脚联系入口可用
- `[x]` 桌面端布局可接受
- `[x]` 移动端布局可接受

需要决策：

- 是否要求精确复刻 `StyledRanklistRenderer` 视觉：`[ ]` 接受当前实现 / `[ ]` 后续处理 / `[x]` 阻塞
- 是否要求旧版 `@antv/g2` rank-time tooltip 和动画：`[x]` 接受当前 G2 实现 / `[ ]` 后续处理 / `[ ]` 阻塞

备注：

```text
SSR也会闪烁
现在打开什么竞赛都是跳转这个：Test Contest 2024
iframe无法测试，Gym Ghost/VJudge replay 导出的文件我不确定
发现一个问题是「导出」「分享」按钮的行为，应该是hover展示、关闭
```

## 合集页 `/collection/:id`

测试 URL：

- `http://127.0.0.1:3000/collection/<已知合集 id>`
- `http://127.0.0.1:3000/collection/<已知合集 id>?rankId=<已知榜单 id>`
- `http://127.0.0.1:3000/collection/<已知合集 id>?rankId=<无效榜单 id>`
- `http://127.0.0.1:3000/collection/<不存在的合集 id>`

检查项：

- `[!]` SSR 首屏可以看到合集内容
- `[!]` Hydration 后选中榜单内容保持正常
- `[x]` 没有 `rankId` 时的默认合集状态可接受
- `[x]` 有效 `rankId` 可以渲染选中榜单
- `[x]` 无效 `rankId` 会被替换，且不会请求不存在的榜单数据
- `[x]` 榜单之间仅 query 变化的前端导航可接受
- `[ ]` 缺失合集展示 Not Found
- `[x]` 合集树或菜单可用
- `[x]` 分类或分组展示可接受
- `[x]` 桌面端布局可接受
- `[x]` 移动端布局可接受

需要决策：

- 是否要求精确复刻旧版菜单行为：`[ ]` 接受当前实现 / `[ ]` 后续处理 / `[x]` 阻塞
- 是否要求精确复刻旧版移动端合集行为：`[ ]` 接受当前实现 / `[ ]` 后续处理 / `[x]` 阻塞
- 是否要求精确复刻分类 icon 行为：`[ ]` 接受当前实现 / `[ ]` 后续处理 / `[x]` 阻塞

备注：

```text

```

## 演练场 `/playground`

测试 URL：

- `http://127.0.0.1:3000/playground`

检查项：

- `[x]` CSR 页面加载正常，且不依赖上游数据调用
- `[x]` 内置 demo SRK 可以预览
- `[x]` 粘贴合法 SRK JSON 后可以预览
- `[x]` 粘贴格式错误 JSON 后展示可理解的 invalid JSON 状态
- `[x]` 粘贴对象 JSON 但不是可渲染 SRK 时展示可理解的转换错误
- `[x]` 编辑区控件可用
- `[x]` 预览区可用
- `[x]` 桌面端编辑区和预览区布局可接受
- `[x]` 移动端编辑区和预览区布局可接受

需要决策：

- Monaco editor parity：`[ ]` 接受当前编辑器 / `[x]` 后续处理 / `[ ]` 阻塞
- 更完整的 playground UX polish：`[ ]` 接受当前实现 / `[x]` 后续处理 / `[ ]` 阻塞

备注：

```text

```

## 实时榜单页 `/live/:id`

测试 URL：

- `http://127.0.0.1:3000/live/<已知 live id>?token=<token>`
- `http://127.0.0.1:3000/live/<已知 live id>?token=<token>&scrollSolution=1&focus=yes`
- `http://127.0.0.1:3000/live/<不存在的 live id>`

检查项：

- `[ ]` CSR 页面加载和 hydration 正常
- `[ ]` query 参数按预期保留
- `[ ]` 实时榜单轮询可用
- `[ ]` WebSocket 建连行为可接受
- `[ ]` 实时事件面板能清晰展示 accepted/rejected 事件
- `[ ]` scroll-solution 模式可以关闭
- `[ ]` 关闭 scroll-solution 时保留其他 query 参数
- `[ ]` 关闭 scroll-solution 时 WebSocket 会关闭
- `[ ]` WebSocket 异常关闭时展示实时错误，同时保留榜单可见
- `[ ]` 移动端隐藏 scroll-solution 开关，同时保留榜单渲染
- `[ ]` 缺失 live contest 展示 Not Found
- `[ ]` 桌面端普通 live 布局可接受
- `[ ]` 移动端普通 live 布局可接受
- `[ ]` 桌面端实时布局可接受
- `[ ]` 移动端实时布局可接受

需要决策：

- 自动 WebSocket reconnect/backoff：`[x]` 接受当前实现 / `[ ]` 后续处理 / `[ ]` 阻塞
- Toastify 动画和像素级一致：`[x]` 接受当前实现 / `[ ]` 后续处理 / `[ ]` 阻塞

备注：

```text
需要告知我mock数据后测试
```

## API 与数据行为

检查项：

- `[ ]` Normal API 行为可接受：statistics、list-all、search、live info、live ranklist
- `[ ]` CDN API 行为可接受：ranklist info、SRK file download、collection data
- `[ ]` wrapped API `code === 0` 成功行为可接受
- `[ ]` wrapped API `code === 11` 映射到 Not Found 行为
- `[ ]` HTTP 404 映射到 Not Found 行为
- `[ ]` 其他 API 错误展示的通用错误状态可接受
- `[ ]` 重复加载榜单或合集时的缓存行为可接受
- `[ ]` 人工测试中没有发现非预期的生产数据假设

备注：

```text
这些你自己查吧。我不人工检查了。
```

## 视觉截图核对

最近一次自动 full-chain 测试会在 `test-results/` 下生成截图。

建议检查这些截图：

- `test-results/**/app-shell-desktop.png`
- `test-results/**/app-shell-mobile.png`
- `test-results/**/home-desktop.png`
- `test-results/**/home-mobile.png`
- `test-results/**/search-desktop.png`
- `test-results/**/search-mobile.png`
- `test-results/**/ranklist-desktop.png`
- `test-results/**/ranklist-mobile.png`
- `test-results/**/collection-desktop.png`
- `test-results/**/collection-mobile.png`
- `test-results/**/playground-desktop.png`
- `test-results/**/playground-mobile.png`
- `test-results/**/live-page-desktop.png`
- `test-results/**/live-page-mobile.png`
- `test-results/**/live-realtime-desktop.png`
- `test-results/**/live-realtime-mobile.png`

检查项：

- `[x]` 自动截图与人工浏览器观察一致
- `[x]` 没有明显裁切
- `[x]` 没有非预期横向滚动
- `[x]` 没有严重文字重叠
- `[x]` 移动端截图可接受
- `[x]` 桌面端截图可接受

备注：

```text

```

## 延期产品决策表

每一项请选择一个结果。

| 范围 | 接受延期 | 收口前必须处理 | 阻塞 | 备注 |
| --- | --- | --- | --- | --- |
| App shell Ant Design 菜单/dropdown 样式 | `[ ]` | `[x]` | `[ ]` | |
| App shell GA/pageview dispatch parity | `[ ]` | `[x]` | `[ ]` | |
| 首页更完整 SEO/content polish | `[x]` | `[ ]` | `[ ]` | |
| 合集页菜单、移动端、分类 icon 精确行为 | `[ ]` | `[x]` | `[ ]` | |
| 演练场 Monaco/editor parity | `[ ]` | `[ ]` | `[ ]` | |
| Live WebSocket reconnect/backoff | `[ ]` | `[ ]` | `[ ]` | 已处理，full-chain 覆盖错误关闭/异常关闭后的 reconnect |
| Live Toastify 动画和像素级一致 | `[ ]` | `[ ]` | `[ ]` | 已处理，full-chain 覆盖 Toastify 容器、toast 行、Zoom 动画和像素覆盖 |
| SRK renderer 精确 `StyledRanklistRenderer` 视觉 parity | `[ ]` | `[x]` | `[ ]` | |
| Rank-time 旧版 `@antv/g2` tooltip 和动画 parity | `[ ]` | `[ ]` | `[ ]` | 已处理，full-chain 覆盖 G2 图表容器/canvas，unit 覆盖 tooltip/动画模型 |

其他延期决策：

```text
总之，尽可能对照原项目还原
```

## 用于最终方案的问题记录

每个问题使用一个区块。严重程度建议使用：`blocker`、`must-fix`、`follow-up`、`nice-to-have`。

```text
Issue ID:
严重程度:
路由或范围:
URL:
视口:
复现步骤:
期望行为:
实际行为:
证据:
建议决策:
```

```text
Issue ID:
严重程度:
路由或范围:
URL:
视口:
复现步骤:
期望行为:
实际行为:
证据:
建议决策:
```

```text
Issue ID:
严重程度:
路由或范围:
URL:
视口:
复现步骤:
期望行为:
实际行为:
证据:
建议决策:
```

## 最终验收结论

- `[ ]` 接受路由兼容迁移完成
- `[ ]` 接受路由兼容迁移完成，但保留列出的后续 slice
- `[x]` 暂不收口，先修复阻塞项

最终收口前必须完成：

```text

```

建议下一步开发 slice，按优先级排序：

1.
2.
3.

最终验收意见：

```text

```
