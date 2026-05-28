# RankLand 迁移人工验收清单

日期：2026-05-26
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
- 最高优先级后续 slice：product-review-driven SRK lower-level table pixel parity / route polish, if a new concrete visual difference is found.
- 发布、合并或收口阻塞项摘要：2026-05-26 自动化复核未保留已知阻塞；剩余项为 review-driven polish / release process，而不是当前工作区的已复现失败。

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
- `gen:client-router`：生成 6 条 client route，且没有非预期路由文件 diff
- `test:migration`：build、unit、SSR、浅层 E2E、full-chain E2E 全部通过

检查项：

- `[x]` 运行时为 Node 24 和 pnpm 8
- `[x]` 依赖可以用 frozen lockfile 安装
- `[x]` 路由生成命令正常退出
- `[x]` 生成路由文件没有非预期漂移
- `[x]` 完整迁移门禁通过
- `[x]` `git diff --check` 通过
- `[x]` 当前工作区变更已确认，不包含未知风险

备注：

```text
2026-05-28 最新记录：user modal team members product class parity 已通过 focused RED/GREEN、ranklist full-chain 9 tests、完整默认 `test:migration` 与 `git diff --check`。RED 复现迁移版 team-members row 仍暴露 Vue-only `rankland-user-modal-team-members` class；GREEN 验证 `[data-id="rankland-user-modal-team-members"]` 恢复旧 React exact `user-modal-info-team-members mt-2` class list，且成员文本、raw ` / ` 分隔符、item-level entry spans、0.8 opacity、6px padding-top 和 8px margin-top 保持不变；完整 gate 使用 Node `v24.11.1`、pnpm `8.15.9`，`gen:client-router` 生成 6 条 client routes，`test:migration` 通过 build、36 个 unit files / 154 个 unit tests、1 个 SSR smoke test、1 个 shallow Playwright test、60 passed / 1 skipped full-chain Playwright tests。
```

## 全局外壳与跨路由行为

请分别在桌面和移动端视口检查。建议桌面视口：`1440x900`。建议移动端视口：`390x844`。

检查项：

- `[x]` 普通路由会显示全局导航
- `[x]` Logo 和主导航链接跳转到预期路由
- `[x]` 主导航菜单行高与旧版 Ant Design horizontal menu 一致
- `[x]` 主导航选中态颜色和下划线与旧版 dark primary 色一致
- `[x]` 站点切换行为可接受
- `[x]` 站点切换链接保留旧版 `target="_blank"` 且无 `rel` 的 DOM/referrer 语义
- `[x]` 站点切换中国站点下拉内容保留旧版 `word-break: keep-all`、`mb-0`、`opacity-60 text-xs` class/样式语义
- `[x]` 站点切换按钮保留旧版 `px-2` class token 和 8px 水平 padding 语义
- `[x]` App shell 根布局、header 内层和 logo 保留旧版 `layout`、`flex justify-between`、`logo` class/DOM 语义
- `[x]` 桌面端外壳 header padding、内层宽度和 logo 左边缘与旧版一致
- `[x]` 站点切换按钮高度、最小高度、圆角和水平 padding 与旧版 Ant Design text button 一致
- `[x]` 移动端外壳 header、logo、导航和站点切换尺寸与旧版一致
- `[x]` `focus=yes` 在应兼容旧版聚焦模式的页面隐藏全局外壳
- `[x]` 联系弹窗可以打开、关闭，并展示邮箱和 QQ 群图片，深色模式下使用旧版 Ant Design Modal surface/title/close/body padding
- `[x]` 首页和 SRK footer 联系入口使用旧版无 `href` `<a>` 触发器 DOM，而不是 Vue-only `<button>`
- `[x]` 联系弹窗 QQ 群图片保留旧版 `w-full` 类名
- `[x]` 全局 `body` 使用旧版 Ant Design 14px、system font、tabular-nums 和 1.5715 line-height 排版基线
- `[x]` 长页面 BackTop 行为可接受
- `[x]` 系统主题同步行为可接受
- `[x]` macOS Blink 优化 class 没有引入视觉问题
- `[x]` 迁移后的公开路由桌面端没有横向溢出
- `[x]` 迁移后的公开路由移动端没有横向溢出
- `[x]` 直达页面和前端跳转后的页面标题可接受
- `[x]` 直接刷新公开路由 URL 可正常工作
- `[x]` 旧 RankLand 不存在的脚手架 `/about` 和 `/demo/detail/:id` 不再作为公开路由暴露，直接访问返回旧版 fallback 404
- `[x]` 公开资源缺失时的 Not Found 行为可接受

需要决策：

- App shell 是否需要精确复刻 Ant Design 菜单/dropdown 样式：`[x]` 接受当前实现 / `[ ]` 后续处理 / `[ ]` 阻塞
- GA/pageview dispatch 是否需要补齐：`[ ]` 接受延期 / `[x]` 收口前处理 / `[ ]` 阻塞（已处理）

备注：

```text
macOS Blink 优化 class 已由 `tests/e2e/full-chain/app-shell.spec.ts` 和 `tests/unit/app-shell-srk-style.spec.ts` 覆盖。
直达页面标题由各 route full-chain 覆盖；前端跳转后的标题由 app-shell CSR navigation full-chain 覆盖。标题分隔符已还原旧 React `Title | RankLand`。
App shell Ant Design Vue Layout/Menu/Dropdown/Button、旧版根布局 `layout` class、header 内层 `flex justify-between` class 与 `space-between` 计算样式、内层 `.logo` 64px box、40px logo image、旧版全局 body light/dark 文本色、旧版全局 body 14px/system-font/tabular-nums/1.5715 line-height 排版、旧版联系弹窗 Ant Design Modal 深色 surface/title/close/body padding、旧版联系弹窗 QQ 群图片 `w-full` 类名、主导航旧版 46px line-height、主导航 dark primary `#f6ac06` 选中态/下划线、站点切换 ArrowRight icon、站点切换按钮旧版 `px-2` class token 与 8px 水平 padding、站点切换链接旧版 `target="_blank"` 且无 `rel`、站点切换中国站点下拉旧版 `word-break: keep-all` / `mb-0` / `opacity-60 text-xs` 内容 class/style 语义、站点切换旧版 32px button height/0px min-height/2px radius/8px 水平 padding、桌面旧版 50px header padding、无居中 max-width/无内层 gap、移动端旧版 20px header padding/无内层 padding/无内层 gap、64px header/logo 容器、40px logo 图片、16px nav item padding、8px 站点切换 padding、focus mode、theme bootstrap/sync、analytics pageview、legacy title separator、fallback 404 和桌面/移动端 bounds 已有 full-chain 覆盖。
```

## 首页 `/`

测试 URL：

- `http://127.0.0.1:3000/`
- `http://127.0.0.1:3000/?focus=yes`

检查项：

- `[x]` SSR 首屏可以看到首页内容
- `[x]` Hydration 后没有明显内容闪烁、重复或断裂
- `[x]` 统计区域展示可接受
- `[x]` 最近榜单或榜单内容展示可接受
- `[x]` 搜索入口行为可接受
- `[x]` 推荐卡片标题层级、`UnorderedListOutlined` / `TrophyOutlined` 图标与旧首页一致
- `[x]` 推荐/工具卡片标题图标和 logo 的 `mr-3` 右间距与旧首页一致
- `[x]` 推荐/工具卡片行使用旧版水平-only `Row gutter={16}` 行为，不额外叠加 16px vertical row-gap
- `[x]` 推荐/工具卡片列保留旧版 `mb-4` class 和 16px 底部间距
- `[x]` 推荐/工具卡片正文使用旧版 `mt-4 mb-0` class 和 16px/0px 段落间距
- `[x]` 首页工具卡 logo 保留旧版 `mr-3 inline-block` class 和 inline-block 显示语义
- `[x]` paste.then.ac 工具卡 logo 尺寸和 `2px` 内边距与旧首页一致
- `[x]` 首页 about 区域“其他链接”分隔符保留旧版 `mx-2` class 和 8px 左右间距
- `[x]` 深色模式下 hero、资源列表和关于区域分隔符使用旧版 Ant Design 正文色
- `[x]` 结构化内容和标题满足当前 SEO 基线
- `[x]` 首页使用旧版 `main.normal-content` 和 `.home-intro` 内容容器 DOM
- `[x]` 首页五个内容区块使用旧版 `div.block` DOM，同时保留迁移测试用 `home-section` 样式钩子
- `[x]` 首页内容区使用旧版 `normal-content` padding、无桌面 max-width cap，并保留 `home-intro` block/title 间距
- `[x]` 首页 hero 标题保留旧版 inline `font-size: 32px` 样式和 computed 32px 字号
- `[x]` 首页 hero 文案段落保留旧版 `text-base` class token
- `[x]` 首页区块标题使用旧版 `h1.block-title` DOM 和 32px/500 heading 视觉
- `[x]` 首页推荐卡统计数字使用旧版 `strong` DOM 和加粗非斜体视觉
- `[x]` 首页工具、资源、about/其他默认可见外链保留旧版 `target="_blank"` 且无 `rel` 的 DOM/referrer 语义
- `[x]` `cnn` 站点首页备案链接保留旧版 `target="_blank"` 且无 `rel` 的 DOM/referrer 语义
- `[x]` 桌面端布局可接受
- `[x]` 移动端布局可接受
- `[x]` 首页联系入口可正常打开联系弹窗
- `[x]` 首页联系弹窗 QQ 群图片保留旧版 `w-full` 类名
- `[x]` 上游空数据或失败状态可接受，如已测试

需要决策：

- 首页更完整的 SEO/content polish：`[x]` 接受当前实现 / `[ ]` 后续处理 / `[ ]` 阻塞
- 是否要求旧首页视觉精确一致：`[x]` 不要求 / `[ ]` 后续处理 / `[ ]` 阻塞

备注：

```text
2026-05-27 复核：home full-chain 断言 SSR HTML 包含首页内容、统计数据和 JSON-LD，hydration marker 正常；旧版 `main.normal-content` 和 `.home-intro` 内容容器 DOM、五个旧版 `div.block` 内容区块 DOM、旧版 `normal-content` desktop 32px/50px padding、mobile 32px/20px padding、无桌面 max-width cap、`home-intro` block 40px 顶部间距、Hero 标题旧版 inline `font-size: 32px` 与 computed 32px、hero 文案段落旧版 `text-base` class token、`h1.block-title` DOM、32px/500 区块标题视觉和 block title 20px 底部间距已覆盖；Ant Design Card/Row/Col 推荐/工具区、推荐/工具卡片行旧版水平-only gutter 和 `rowGap: normal`、推荐/工具卡片列旧版 `mb-4` class 与 16px bottom margin、推荐卡片旧版 dark Card 背景/边框/圆角/文字色、hero/resource/about 非卡片正文旧版暗色正文色、旧版 `h2` 标题和 `UnorderedListOutlined` / `TrophyOutlined` 图标、标题图标/logo 的旧版 `mr-3` 右间距、工具卡 logo 旧版 `mr-3 inline-block` class token、inline-block display 和 12px right spacing、about 分隔符旧版 `mx-2` class token 与 8px 左右间距、卡片正文旧版 `mt-4 mb-0` class 与 16px/0px margin、统计数字旧版 `strong` DOM 与加粗非斜体视觉、paste.then.ac logo 24px 尺寸和 2px 内边距、默认可见首页外链旧版 `target="_blank"` 且无 `rel`、`cnn` 站点首页备案链接旧版 `target="_blank"` 且无 `rel`、联系弹窗 Ant Design Modal 深色样式、联系弹窗 QQ 群图片旧版 `w-full` 类名、桌面/移动端截图和 bounds、partial upstream statistics 的旧版 `-` fallback 与 SSR/hydration 一致性已覆盖。
```

## 搜索页 `/search`

测试 URL：

- `http://127.0.0.1:3000/search`
- `http://127.0.0.1:3000/search?kw=test`
- `http://127.0.0.1:3000/search?kw=`

检查项：

- `[x]` 空查询展示最近榜单
- `[x]` 测试用 hydration marker 不作为可见产品文本展示
- `[x]` `kw` 查询展示匹配结果
- `[x]` 空 `kw` 按最近榜单状态处理
- `[x]` `kw` 查询和提交搜索保留旧版首尾空白语义，不在 route normalize、Fuse search 或 URL build 前裁剪
- `[x]` 页面外壳保留旧版 `div.normal-content > div` DOM，不渲染 Vue-only `.search-page`、`section.search-panel` 或 route-local `min-height: 70vh`
- `[x]` 页面标题保留旧版精确 `h3.mb-6` class，不渲染 Vue-only `.search-heading`
- `[x]` 搜索框保留旧版无页面自定义 class DOM，不渲染 Vue-only `.search-input`
- `[x]` loading、error、result、recent 状态外层保留旧版 `mt-10` DOM/class 合同，不渲染 Vue-only `.search-state` 或 `.search-section`
- `[x]` result/recent 标题、列表和空状态内容外层保留旧版 `div.opacity-70` / `div.mt-2 > List` / `div.mt-2` DOM，不渲染 Vue-only `.search-section-title`、`.search-list` 或 `.search-empty-state`
- `[x]` result/recent 列表项容器保留旧版无页面自定义 class DOM，不渲染 Vue-only `.search-list-item`
- `[x]` 搜索结果和最近榜单行内容保留旧版 `p.mb-0` / `span.ml-2.opacity-70` / `p.mb-0.opacity-50.text-sm` DOM/class，不渲染 Vue-only `.search-row-title`、`.search-view-count` 或 `.search-created-at`
- `[x]` 搜索框 enter button 使用旧版 Ant Design 默认 SearchOutlined 图标按钮，而不是自定义“搜索”文字按钮
- `[x]` 最近榜单空状态保留旧版 `mt-2` 间距，并在深色模式下使用旧版 Ant Design 正文色
- `[x]` 初始化失败状态保留旧版文案、`mt-10` 间距和 `text-red-500` 错误色
- `[x]` 搜索 loading 和错误态保留旧版 `mt-10` / `text-red-500` 工具类，错误态使用旧版外层 `mt-10`、内层 `text-red-500` DOM
- `[x]` 搜索错误消息内层保留旧版精确 `div.text-red-500` class，不渲染 Vue-only `.search-error-message`
- `[x]` 搜索结果和最近榜单行保留旧版 `mt-10` / `mt-2` / `mb-0` / `ml-2 opacity-70` / `opacity-50 text-sm` 工具类
- `[x]` 结果数量展示保留旧版 `div.opacity-70` 纯文本 DOM，不渲染 Vue-only `[data-id="search-result-count"]` span，并保留 section `data-result-count`
- `[x]` 搜索结果卡片和链接跳转正确
- `[x]` 浏览器后退、前进行为可接受
- `[x]` 桌面端布局可接受
- `[x]` 移动端布局可接受
- `[x]` 如果检查过网络请求，没有非预期上游请求或外部请求
- `[x]` 空结果状态可接受，如已测试

需要决策：

- 搜索页 route parity 之后的产品 polish：`[x]` 接受当前实现 / `[ ]` 后续处理 / `[ ]` 阻塞

备注：

```text
2026-05-27 复核：search full-chain 覆盖 CSR listAll、旧版 `div.normal-content > div` 外壳 DOM、无 Vue-only `.search-page` / `section.search-panel` / root `min-height: 70vh`、标题旧版精确 `h3.mb-6` class、无 Vue-only `.search-heading`、搜索框旧版无页面自定义 class DOM、无 Vue-only `.search-input`、loading/error/result/recent 状态外层旧版 `mt-10` DOM/class 合同、result/recent `DIV` wrapper、无 Vue-only `.search-state` / `.search-section`、result/recent 标题旧版 `div.opacity-70`、结果数旧版纯文本 `搜索到 N 个结果`、无 Vue-only `[data-id="search-result-count"]` span、section `data-result-count` 保留、关键词空白旧版 passthrough 语义，route `kw`、提交 URL 和 Fuse search 均不 trim，空白-only `kw` 仍为结果状态、list 旧版 `div.mt-2 > .ant-list` wrapper、recent empty 旧版 `div.mt-2`、无 Vue-only `.search-section-title` / `.search-list` / `.search-empty-state`、result/recent 列表项容器旧版无页面自定义 class、无 Vue-only `.search-list-item`、Ant Design list item `display:flex`、result/recent 行内容旧版 `p.mb-0` / `span.ml-2.opacity-70` / `p.mb-0.opacity-50.text-sm` 精确类名、无 Vue-only `.search-row-title` / `.search-view-count` / `.search-created-at`、错误消息内层旧版精确 `div.text-red-500` class、无 Vue-only `.search-error-message`、hydration marker 视觉隐藏、Fuse 本地搜索、空 kw、zero-result summary-only、Ant Design Input.Search/List/Spin、旧版 boolean `enterButton` 默认 SearchOutlined 图标按钮、初始化失败状态旧版文案、外层 40px 顶部间距和内层 `text-red-500` 颜色/工具类 DOM、loading 旧版 `mt-10` 工具类、最近榜单空状态旧版 `mt-2` 间距和暗色正文色、搜索结果/最近榜单旧版工具类 token、网络请求无非预期 upstream/external call。
```

## 榜单详情页 `/ranklist/:id`

测试 URL：

- `http://127.0.0.1:3000/ranklist/<已知榜单 id>`
- `http://127.0.0.1:3000/ranklist/<已知榜单 id>?focus=yes`
- `http://127.0.0.1:3000/ranklist/<不存在的榜单 id>`

检查项：

- `[x]` SSR 首屏可以看到榜单内容
- `[x]` Hydration 后榜单内容保持正常
- `[x]` 测试用 hydration marker 不作为可见产品文本展示
- `[x]` loaded route root 保留旧版普通 `DIV`，不渲染 Vue-only `main`
- `[x]` loaded content wrapper 保留旧版普通 `DIV`，不渲染 Vue-only `section`
- `[x]` loaded content wrapper 保留旧版 `mt-8 mb-8` class token 和 32px 顶部/底部间距
- `[x]` loaded content wrapper 不渲染 Vue-only `ranklist-content` 产品 class
- `[x]` SRK renderer normal path 不渲染 Vue-only `.rankland-ranklist` 根 wrapper 或 `.rankland-ranklist-header` header wrapper，hydration marker 后直接保留旧 React 顶层节点顺序
- `[x]` 有效榜单的 SRK 表格渲染达到验收标准
- `[x]` SRK 表格前保留旧版 `div.mt-6` spacer DOM，不渲染 Vue-only `.rankland-ranklist-table-spacer` 产品类，表格前 24px 间距不依赖 Vue-only wrapper margin
- `[x]` SRK 用户弹窗和题目弹窗 wrapper 保留旧版位于 table wrapper 内的 DOM 结构，footer 仍位于 table wrapper 外
- `[x]` SRK header title 使用旧版 `h1.text-center.mb-1` 的 32px/500/4px 标题排版
- `[x]` SRK header banner wrapper 不渲染 Vue-only `.rankland-ranklist-banner-wrap`，保留旧版 `flex items-center justify-center` 工具类和 `display:flex` / `align-items:center` / `justify-content:center` 布局；banner image、title、meta、contributors 和 time 保留旧版 `mb-2` / `text-center mb-1` / `text-center mt-1` / `mb-0` / `text-center mb-0` 工具类，且 banner wrapper/image 的 0px/8px margin 来源与旧 React 一致
- `[x]` SRK header banner image class 精确为旧版 `mb-2`，尺寸来自 inline `max-width: min(100%, 1820px)` / `max-height: 40vh`，不渲染 Vue-only `rankland-ranklist-banner` 产品 class 或 scoped size CSS
- `[x]` SRK header contributors 和 ref-links 保留旧 React 作为 header meta block 子节点的 DOM 结构，time 仍为 meta block 后的顶层 renderer sibling
- `[x]` SRK header meta block 不渲染 Vue-only `.rankland-ranklist-header-meta`，仅保留旧版 `text-center mt-1` class 合同，并保留 4px top margin、block display、无 gap 和子节点 DOM
- `[x]` SRK header meta、贡献者、相关链接和时间使用旧版 Ant Design body 14px 字号
- `[x]` SRK header 在 metadata 缺失 `viewCnt` 时仍保留旧版 Eye icon 和 `-` 占位
- `[x]` SRK header 浏览量节点保留旧版精确 `mr-2` class list，且不渲染 Vue-only `.rankland-ranklist-view-count`
- `[x]` SRK header 隐藏相关链接触发器保留旧版无额外 CSS 左边距，仅保留 pointer cursor
- `[x]` SRK header meta/action 行不添加 Vue-only flex gap，操作间距仅来自旧版 `mr-2` / `pl-2` / `border-l` 工具类
- `[x]` SRK header meta/action 行保留旧版 block/inline display 语义，迁移用 action hook 不作为 flex 布局容器
- `[x]` SRK header 导出/分享操作图标使用旧版 light/dark 链接主色和 hover 色
- `[x]` SRK header 导出/分享操作保留旧版 `border-0 border-solid border-gray-400 mr-2` / `pl-2 border-l` / `pl-2 border-0 border-l border-solid border-gray-400` 工具类，并在 live 无 metadata 时不额外给导出按钮加 `pl-2 border-l`
- `[x]` SRK header 导出/分享触发器保留旧版无 `href` `<a>` DOM，不渲染 Ant Design button class 或 Vue-only action trigger/separator class
- `[x]` SRK header 导出操作不渲染 Vue-only inline `rankland-ranklist-action-status` 状态文本，分享成功仍使用旧版可接受的 Ant Design notification 路径
- `[x]` SRK 备注外层保留旧版 `mb-4 text-center` 工具类
- `[x]` SRK 备注外层 class 精确为旧版 `mb-4 text-center`，不渲染 Vue-only `rankland-ranklist-remarks` 产品 class，同时保留 16px bottom margin、center alignment 和 `.srk-remarks` pill 样式
- `[x]` SRK 备注 pill 使用旧版 light/dark primary rgba 边框
- `[x]` 缺失榜单展示 Not Found
- `[x]` 榜单 Not Found 外壳保留旧版 `mt-16 text-center` 工具类，标题保留旧版 `h3.mb-4`
- `[x]` 榜单通用错误和 loading 状态保留旧版 `mt-16 text-center` 工具类
- `[x]` 筛选和进度控制可用
- `[x]` SRK progress 外壳保留旧版 `mx-4` 工具类和 16px 左右外边距
- `[x]` SRK checker-error 外层保留旧版精确 `class="ml-8"`，不渲染 Vue-only `.rankland-ranklist-check-error` 产品类
- `[x]` SRK render-error 外层保留旧版 plain `div role="alert"` + inline `max-width: 400px; margin: 100px auto`，不渲染 Vue-only `rankland-ranklist-error` 产品 class 或 scoped CSS
- `[x]` SRK controls 根节点、组织筛选、正式筛选和分组筛选保留旧版 `mt-3 mx-4 flex justify-between items-center` / `ml-2` / `ml-5 inline-flex items-center` / `mr-1` 工具类
- `[x]` SRK controls 根节点不添加 Vue-only gap，Live extra-action 外层保留旧版 plain `div` block chrome
- `[x]` SRK controls 移动端保留旧版 row/center 布局、组织筛选 `160px` 宽度、正式筛选和分组筛选 20px 左边距，不使用 Vue-only column/stretch/100% 宽度覆盖
- `[x]` SRK controls 内部间距不使用 Vue-only wrapper gap；组织筛选由本地 `.ml-2` 提供 8px，正式筛选文字由本地 `.mr-1` 提供 4px
- `[x]` SRK filters 根节点直接包含旧版 `span`、Select、正式筛选 `span`、Radio.Group，不渲染 Vue-only `label.rankland-ranklist-filter` wrapper
- `[x]` SRK filters 根节点保留旧版 plain `div` class 合同，不渲染 Vue-only `.rankland-ranklist-filters` 产品类；布局样式改由稳定 `data-id` 承载
- `[x]` SRK 组织筛选 Select 根节点保留旧版 `ml-2` class 和 inline `width: 160px` 合同，不渲染 Vue-only `.rankland-ranklist-select` 产品类
- `[x]` SRK 正式筛选 wrapper 保留旧版 `span.ml-5.inline-flex.items-center` class 合同，不渲染 Vue-only `.rankland-ranklist-checkbox` 产品类
- `[x]` SRK 分组筛选 Radio.Group 保留旧版 `ml-5 inline-flex items-center` class 合同，不渲染 Vue-only `.rankland-ranklist-marker-filter` 产品类
- `[x]` 点击行或成员可以打开用户弹窗
- `[x]` 用户弹窗和题目解法弹窗根节点保留旧版 `srk-react-modal-root`，同时保留 `srk-modal-root`、`srk-animated-modal-root` 和 `srk-general-modal-root`
- `[x]` 用户弹窗内容根节点保留旧版 `.user-modal` 类
- `[x]` 用户弹窗组织行 class 精确为旧版 `mb-0`，不渲染 Vue-only `rankland-user-modal-line` / `rankland-user-modal-organization`，并保留 0px/0px 间距
- `[x]` 无组织用户弹窗仍保留旧版空 `p.mb-0` 组织行 DOM
- `[x]` 用户弹窗团队成员行 class 精确为旧版 `user-modal-info-team-members mt-2`，不渲染 Vue-only `rankland-user-modal-team-members`，并保留 8px 顶部间距、0.8 opacity 和 6px 顶部 padding
- `[x]` 用户弹窗团队成员分隔符保留旧版 raw ` / ` 文本、0.5 opacity 和 80% 字号
- `[x]` 用户弹窗团队成员保留旧版每个成员一个外层 `span` 的 item-level DOM 结构
- `[x]` 用户弹窗标记行保留旧版 `mt-2` 类和 8px 顶部间距
- `[x]` 用户弹窗非正式提示 class 精确为旧版 `mt-4 mb-0`，不渲染 Vue-only `rankland-user-modal-unofficial`，并保留 16px/0px 间距
- `[x]` 用户弹窗奖区行 class 精确为旧版 `mt-4 mb-0`，不渲染 Vue-only `rankland-user-modal-line` / `rankland-user-modal-segment`，并保留 16px/0px 间距
- `[x]` 用户弹窗奖区标签保留旧版 `.user-modal-segment-label` 类和 `bg-segment-*` 样式类
- `[x]` 用户弹窗标语节点保留旧版 `.slogan mt-4 mb-2` 类，并继续展示 `SLOGAN` 伪标签、旧版字体样式和 16px/8px 间距
- `[x]` 用户弹窗照片外壳保留旧版 `mt-4` 类和 16px 顶部间距，照片仍保持 full-width
- `[x]` 用户弹窗照片和标语共享旧版 `div.mt-4` 外壳结构
- `[x]` 用户弹窗无照片/无标语用户仍保留旧版空 `mt-4` 照片/标语外壳
- `[x]` rank-time 面板使用旧版 chart-only `mt-4` 外壳类名，不展示额外单位、摘要或过题事件 chip，G2 曲线可接受
- `[x]` 导出 SRK 可用
- `[x]` 导出 Gym Ghost 可用
- `[x]` 导出 VJudge replay 可用
- `[x]` 导出 XLSX 可用
- `[x]` 分享链接正确
- `[x]` iframe 嵌入代码正确
- `[x]` 相关 SRK 资源的 asset URL 重写可用
- `[x]` SRK banner 和用户照片资源加载失败时按旧版 `SrkAssetImage` 行为隐藏破图
- `[x]` 榜单相关链接与 footer 联系入口使用旧版 light/dark primary 链接色
- `[x]` 榜单贡献者可见项使用旧版 item-level `span` DOM，同时保留现有文本、链接处理、颜色和间距
- `[x]` 榜单贡献者 URL 链接保留旧版 `target="_blank"` / `rel="noopener"` DOM
- `[x]` 榜单相关链接 wrapper 和可见主链接项均使用旧版 `span` DOM，同时保留现有链接文本、颜色、间距和 dropdown 行为
- `[x]` 榜单相关链接可见主链接和隐藏 dropdown 链接均保留旧版 `target="_blank"` / `rel="noopener"` DOM
- `[x]` SRK footer 根节点和段落保留旧版 `text-center mt-8` / `mb-0` / `mt-1 mb-0` 工具类
- `[x]` SRK footer GitHub、Standard Ranklist、榜单合集外链保留旧版 `target="_blank"` 且不渲染 `rel`
- `[x]` `cnn` 站点 SRK footer 备案链接保留旧版 `target="_blank"` 且不渲染 `rel`
- `[x]` 页脚联系入口可用，并保留旧版无 `href` `<a>` 触发器 DOM
- `[x]` 桌面端布局可接受
- `[x]` 移动端布局可接受

需要决策：

- 是否要求精确复刻 `StyledRanklistRenderer` 视觉：`[x]` 接受当前实现 / `[ ]` 后续处理 / `[ ]` 阻塞
- 是否要求旧版 `@antv/g2` rank-time tooltip 和动画：`[x]` 接受当前 G2 实现 / `[ ]` 后续处理 / `[ ]` 阻塞

备注：

```text
2026-05-28 复核：ranklist full-chain 覆盖 SSR/hydration、hydration marker 视觉隐藏、loaded route root 旧版普通 `DIV`、loaded content wrapper 旧版普通 `DIV`、loaded content 精确 `mt-8 mb-8` class list、无 Vue-only `ranklist-content` 产品 class、Not Found、Gym Ghost/VJudge/XLSX 下载、iframe 嵌入代码、hover 打开/关闭导出和分享 dropdown、SRK wrapper header/filter/progress/table/footer/user-modal/rank-time 多项旧版视觉行为；其中 header banner wrapper 旧版 `flex items-center justify-center`、banner image `mb-2`、title `text-center mb-1`、meta `text-center mt-1`、contributors `mb-0`、time `text-center mb-0` 工具类，SRK banner 和用户照片破图隐藏行为，header title 旧版 32px/500/4px 排版、header meta/贡献者、相关链接和时间旧版 14px 字号、贡献者可见项旧版 item-level `span` DOM、贡献者 URL 链接旧版 `target="_blank"` 与 `rel="noopener"` DOM、相关链接 wrapper 和可见主链接项旧版 `span` DOM、相关链接可见主链接和隐藏 dropdown 链接旧版 `target="_blank"` 与 `rel="noopener"` DOM、footer GitHub/Standard Ranklist/榜单合集 package/project 外链旧版 `target="_blank"` 且无 `rel` DOM、`cnn` 站点 footer 备案链接旧版 `target="_blank"` 且无 `rel` DOM、footer ContactUs 旧版无 `href` `<a>` 触发器 DOM、header view-count 旧版精确 `mr-2` class list 且无 Vue-only `.rankland-ranklist-view-count`、header 导出/分享触发器旧版无 `href` `<a>` DOM、旧 utility classes + `ant-dropdown-trigger`、无 `ant-btn`/Vue-only action classes、hidden ref-link trigger 旧版 0px CSS 左边距、header meta/action 无额外 flex gap、header meta/action 旧版 block/inline display、header meta 到 contributors 的旧版 0px 额外间距、header 导出/分享旧版工具类、header 导出/分享操作图标 light `#ff8104` 与 dark `#f6ac06` 主色及 light `#ff9d2e` 与 dark `#a7770b` hover 色、SRK progress 外壳旧版 `mx-4` 工具类和 16px 左右外边距、SRK 备注外层旧版 `mb-4 text-center` 工具类、SRK 备注 pill light `rgba(255, 129, 4, 0.8)` 与 dark `rgba(246, 172, 6, 0.8)` 边框、header ref-link/footer contact trigger light `#ff8104` 与 dark `#f6ac06` 链接色、SRK controls 旧版 `mt-3 mx-4 flex justify-between items-center` 根类、Select `ml-2`、正式筛选 `ml-5 inline-flex items-center`、正式筛选文字 `mr-1` 和分组筛选 `ml-5 inline-flex items-center` 类、SRK footer 旧版 `text-center mt-8` 根类和 `mb-0` / `mt-1 mb-0` 段落类、用户弹窗和题目解法弹窗根节点旧版 `srk-react-modal-root` 以及 `srk-modal-root` / `srk-animated-modal-root` / `srk-general-modal-root` 类、用户弹窗旧版 `.user-modal` 内容根类、用户弹窗组织行旧版 `mb-0` 类、用户弹窗团队成员行旧版 `mt-2` 类、用户弹窗团队成员分隔符旧版 raw ` / ` 文本和样式、用户弹窗团队成员旧版 item-level entry `span` DOM、用户弹窗标记行旧版 `mt-2` 类、用户弹窗非正式提示旧版 `mt-4 mb-0` 类、用户弹窗奖区行旧版 `mt-4 mb-0` 类、用户弹窗奖区标签旧版 `.user-modal-segment-label` 类、用户弹窗标语旧版 `.slogan mt-4 mb-2` 类、用户弹窗照片/标语共享旧版 `div.mt-4` 外壳结构、用户弹窗照片外壳旧版 `mt-4` 类和 full-width 图片、无照片/无标语用户仍保留旧版空 `mt-4` 照片/标语外壳、用户弹窗 rank-time 旧版 chart-only `mt-4` 外壳类名和无额外单位/摘要/chip chrome 已有 computed layout/style 断言。Playground full-chain 另用无组织用户 SRK 变体覆盖旧版空 `p.mb-0` 组织行 DOM。

2026-05-28 追加复核：ranklist 移动端 SRK controls 已覆盖旧 React row/center 布局合同；RED 复现 Vue-only column/stretch/12px gap/100% Select/0px 左边距，GREEN 验证 390px 视口下 controls/filter 仍为 row/center、Select 为 `160px`、正式筛选和分组筛选均为 `20px` 左边距，ranklist 全文件 full-chain 9 tests 通过。

2026-05-28 追加复核：ranklist SRK controls 内部间距已覆盖旧 React utility spacing 合同；RED 复现 Vue-only wrapper `gap` 仍为组织筛选 `8px`、正式筛选 `4px`，GREEN 验证 wrapper computed `column-gap: normal`，实际视觉间距由本地旧 utility 样式恢复为「筛选」到 Select `8px`、正式筛选文字到 Switch `4px`，ranklist 全文件 full-chain 9 tests 通过。

2026-05-28 追加复核：ranklist SRK controls DOM 已覆盖旧 React direct-child 合同；RED 复现 filters 根节点下两个 Vue-only `LABEL` wrapper、organization Select parent 为 `LABEL`、official wrapper 为 `LABEL.rankland-ranklist-filter`，GREEN 验证 filters direct children 以 `SPAN`、Select root、official `SPAN`、Radio.Group root 开头，无 direct label，organization Select parent 为 filters root，official wrapper 为 `SPAN` 且不含 `.rankland-ranklist-filter`，ranklist 全文件 full-chain 9 tests 通过。

2026-05-28 追加复核：ranklist SRK filters 根节点 class 合同已覆盖旧 React plain `div` 行为；RED 复现 Vue-only `.rankland-ranklist-filters` 产品类仍在根节点 classList 中，GREEN 验证 `[data-id="rankland-ranklist-filters"]` classList 为空，布局改由稳定 data-id 样式承载，旧版 direct-child DOM、筛选交互、移动端布局和 ranklist 全文件 full-chain 9 tests 均保持通过。

2026-05-28 追加复核：ranklist SRK 组织筛选 Select class/style 合同已覆盖旧 React `className="ml-2"` + `style={{ width: '160px' }}` 行为；RED 复现 Vue 组织 Select 根节点缺少 inline width，GREEN 验证根节点 classList 包含 `ml-2` 且不含 `.rankland-ranklist-select`，inline width 为 `160px`，computed width/8px 左边距、selected-tag 行为、移动端布局和 ranklist 全文件 full-chain 9 tests 均保持通过。

2026-05-28 追加复核：ranklist SRK 分组筛选 Radio.Group class 合同已覆盖旧 React `className="ml-5 inline-flex items-center"` 行为；RED 复现 Vue marker Radio.Group 根节点仍包含 `.rankland-ranklist-marker-filter` 产品类，GREEN 验证根节点 classList 包含 `ml-5` / `inline-flex` / `items-center` 且不含 `.rankland-ranklist-marker-filter`，computed 20px 左边距、marker 筛选、移动端布局和 ranklist 全文件 full-chain 9 tests 均保持通过。

2026-05-28 追加复核：ranklist SRK 正式筛选 wrapper class 合同已覆盖旧 React `span.ml-5.inline-flex.items-center` 行为；RED 复现 Vue official-only wrapper 仍包含 `.rankland-ranklist-checkbox` 产品类，GREEN 验证 wrapper classList 包含 `ml-5` / `inline-flex` / `items-center` 且不含 `.rankland-ranklist-checkbox`，computed 20px 左边距、official-only 筛选、4px 文字到 Switch 间距、移动端布局和 ranklist 全文件 full-chain 9 tests 均保持通过。

2026-05-28 追加复核：ranklist SRK 表格 spacer class 合同已覆盖旧 React `div.mt-6` 行为；RED 复现 Vue spacer 仍包含 `.rankland-ranklist-table-spacer` 产品类，GREEN 验证 spacer classList 仅保留旧版 `mt-6` 且不含 `.rankland-ranklist-table-spacer`，computed 24px spacer margin、table wrapper 0px top margin、modal ancestry、筛选控件、深色模式和 ranklist 全文件 full-chain 9 tests 均保持通过。

2026-05-28 追加复核：ranklist SRK banner wrapper class 合同已覆盖旧 React `div.flex.items-center.justify-center` 行为；RED 复现 wrapper 旧版 utility 语义缺失，`align-items` 为 `normal`，并由测试守住不渲染 Vue-only `.rankland-ranklist-banner-wrap`；GREEN 验证 wrapper classList 仅保留旧版 `flex` / `items-center` / `justify-center` 且不含 `.rankland-ranklist-banner-wrap`，computed `display:flex`、`align-items:center`、`justify-content:center`、wrapper 0px bottom margin、banner image 8px bottom margin和 ranklist 全文件 full-chain 9 tests 均保持通过。

2026-05-28 追加复核：ranklist SRK header meta class 合同已覆盖旧 React `div.text-center.mt-1` 行为；RED 复现 metadata block 仍包含 `.rankland-ranklist-header-meta` 产品类，GREEN 验证 metadata block classList 精确等于 `text-center mt-1` 且不含 `.rankland-ranklist-header-meta`，computed block display、无 gap、4px top margin、14px 字号、meta 子节点 DOM 和 ranklist 全文件 full-chain 9 tests 均保持通过。

2026-05-28 追加复核：ranklist SRK header view-count class 合同已覆盖旧 React `span.mr-2` 行为；RED 复现浏览量节点仍包含 `.rankland-ranklist-view-count` 产品类，GREEN 验证 view-count classList 精确等于 `mr-2` 且不含 `.rankland-ranklist-view-count`，Eye icon、`42` / `-` fallback、14px 字号、light/dark metadata color、header action separator 和 ranklist 全文件 full-chain 9 tests 均保持通过。

2026-05-28 追加复核：ranklist/live SRK header action anchor 合同已覆盖旧 React 无 `href` `<a>` 触发器行为；RED 复现导出/分享触发器仍为 Ant Design Vue `BUTTON` 并带 `ant-btn`/Vue-only action classes，GREEN 验证 ranklist metadata 路径和 live no-metadata 路径均渲染无 `href` `A`，classList 为旧 utility classes + `ant-dropdown-trigger`，且不含 `ant-btn` / `ant-btn-sm` / `.rankland-ranklist-header-action-trigger` / `.rankland-ranklist-header-action-separated`，focused ranklist/live、ranklist 9 tests 和 live 11 tests 均保持通过。

2026-05-28 追加复核：ranklist/live SRK header action status removal 合同已覆盖旧 React 导出后不展示内联状态文本的行为；RED 复现 SRK/Gym Ghost/VJudge Replay/Excel 导出后仍出现 Vue-only `[data-id="rankland-ranklist-action-status"]`，GREEN 验证导出下载文件名/内容覆盖保持不变且 status node 计数为 0，分享成功 notification 断言保持通过，focused ranklist/live、ranklist 9 tests 和 live 11 tests 均保持通过。

2026-05-28 追加复核：SRK renderer top-level wrapper DOM 合同已覆盖旧 React direct-child 行为；RED 复现 Vue shared renderer 仍渲染 `.rankland-ranklist` 根 wrapper 和 `header.rankland-ranklist-header`，GREEN 验证 `[data-id="ranklist-content"]` 在 hidden hydration marker 后的直接子节点为 banner wrapper、`h1`、meta block、time paragraph、progress、controls、spacer、table wrapper、footer，且 `.rankland-ranklist` / `.rankland-ranklist-header` 计数为 0；ranklist 9 tests、collection 11 tests、playground 7 tests 和 live 11 tests 均保持通过。

2026-05-28 追加复核：SRK render-error wrapper DOM 合同已覆盖旧 React `StyledRanklistRenderer` 错误外壳行为；RED 复现 Vue wrapper 缺少旧版 inline `max-width: 400px; margin: 100px auto` 样式且仍渲染 Vue-only `rankland-ranklist-error` 产品 class，GREEN 验证 `[data-id="rankland-ranklist-render-error"]` 为 plain `div role="alert"`、inline style 精确匹配旧版、无 Vue-only class、无 scoped `.rankland-ranklist-error` CSS；focused unit 1 test、Playground full-chain 7 tests 和完整默认 `test:migration` 均保持通过。

2026-05-28 追加复核：ranklist SRK banner image class/style 合同已覆盖旧 React `SrkAssetImage` 调用行为；RED 复现 Vue image 仍渲染 Vue-only `rankland-ranklist-banner` 产品 class，GREEN 验证 `[data-id="rankland-ranklist-banner"]` classList 精确等于 `mb-2`，inline style 包含 `max-width: min(100%, 1820px)` / `max-height: 40vh`，不含 Vue-only 产品 class，且 ranklist 全文件 full-chain 9 tests 保持通过。

2026-05-28 追加复核：ranklist SRK remarks wrapper exact class 合同已覆盖旧 React `div.mb-4.text-center` 行为；RED 复现 Vue remarks wrapper 仍渲染 Vue-only `rankland-ranklist-remarks` 产品 class，GREEN 验证 `.srk-remarks` 的父 wrapper classList 精确等于 `mb-4 text-center`，不含 Vue-only 产品 class，computed `margin-bottom: 16px` 和 `text-align: center` 保持，ranklist 全文件 full-chain 9 tests 保持通过。
```

## 合集页 `/collection/:id`

测试 URL：

- `http://127.0.0.1:3000/collection/<已知合集 id>`
- `http://127.0.0.1:3000/collection/<已知合集 id>?rankId=<已知榜单 id>`
- `http://127.0.0.1:3000/collection/<已知合集 id>?rankId=<无效榜单 id>`
- `http://127.0.0.1:3000/collection/<不存在的合集 id>`

检查项：

- `[x]` SSR 首屏可以看到合集内容
- `[x]` Hydration 后选中榜单内容保持正常
- `[x]` 测试用 hydration marker 不作为可见产品文本展示
- `[x]` 没有 `rankId` 时的默认合集状态可接受
- `[x]` 空合集选择标题保留旧版 `h3.pt-16.text-center` DOM/class token
- `[x]` 有效 `rankId` 可以渲染选中榜单
- `[x]` 无效 `rankId` 会被替换，且不会请求不存在的榜单数据
- `[x]` 榜单之间仅 query 变化的前端导航可接受
- `[x]` 缺失合集展示 Not Found
- `[x]` 合集 Not Found 外壳保留旧版 `pt-16 text-center` 工具类，标题保留旧版 `h3.mb-4`
- `[x]` 合集通用错误、合集 loading、选中榜单错误和选中榜单 loading 状态保留旧版 `pt-16 text-center` 工具类
- `[x]` 合集树或菜单可用
- `[x]` 分类或分组展示可接受
- `[x]` 合集导航浅色背景使用旧版 `#f4f4f4`
- `[x]` 合集导航深色背景和右边框使用旧版 `#111111` / `#434343`
- `[x]` 合集 loaded route root 保留旧版普通 `DIV`，不渲染 Vue-only `main`
- `[x]` 合集 loaded shell 保留旧版 `DIV.srk-collection-container`，不渲染 Vue-only `section` 或 `collection-page` 产品 class
- `[x]` 合集导航 wrapper 保留旧版 `DIV.srk-collection-nav`，不渲染 Vue-only `aside` 或 `collection-nav` 产品 class
- `[x]` 合集榜单面板保留旧版 `DIV.srk-collection-ranklist`，不渲染 Vue-only `section` 或 `collection-ranklist-panel` 产品 class
- `[x]` 合集隐藏标题使用旧版 `.srk-collection-hidden-header h3.mb-0` DOM
- `[x]` 合集隐藏标题保留旧版 inline style 合同：无 inline `marginTop`，展开态 `marginLeft: 8px`，折叠态 `fontSize: 14px` / `marginLeft: 0px`
- `[x]` 合集隐藏标题不再使用 Vue-only route-local `line-height: 1` 覆盖
- `[x]` 合集隐藏标题 wrapper 保留旧版 `DIV.srk-collection-hidden-header`，不渲染 Vue-only `collection-hidden-header` 产品 class
- `[x]` 合集外壳保留旧版 `.srk-collection-container` / `.srk-collection-nav` / `.srk-collection-ranklist` 类名
- `[x]` 合集导航层级使用旧版 `z-index: 1`
- `[x]` 合集隐藏标题不设置额外层级，保持旧版 `z-index: auto`
- `[x]` 合集折叠态子菜单标题左右内边距使用旧版 `0px`
- `[x]` 合集榜单面板使用旧版 `position: relative` 和 `flex: 1`
- `[x]` 选中榜单内容 wrapper 保留旧版 `DIV.pb-8` 精确 class list 和 32px 底部 padding，不渲染 Vue-only `collection-ranklist-content` 产品 class
- `[x]` 桌面端布局可接受
- `[x]` 移动端布局可接受

需要决策：

- 是否要求精确复刻旧版菜单行为：`[x]` 接受当前实现 / `[ ]` 后续处理 / `[ ]` 阻塞
- 是否要求精确复刻旧版移动端合集行为：`[x]` 接受当前实现 / `[ ]` 后续处理 / `[ ]` 阻塞
- 是否要求精确复刻分类 icon 行为：`[x]` 接受当前实现 / `[ ]` 后续处理 / `[ ]` 阻塞
- 是否要求精确复刻剩余高度和折叠动画行为：`[x]` 接受当前实现 / `[ ]` 后续处理 / `[ ]` 阻塞

备注：

```text
2026-05-28 复核：collection full-chain 覆盖 SSR/hydration、hydration marker 视觉隐藏、invalid rankId cleanup、Ant Design Vue menu/category icons/mobile collapse、旧版 `MenuFoldOutlined` / `MenuUnfoldOutlined` collapse icon、remaining-height/nav animation contract、selected-ranklist wrapper/filter/progress/footer/action、空选择/加载/错误/Not Found 状态；已补充 loaded wrapper DOM parity：root 旧版普通 `DIV`、shell 旧版 `DIV.srk-collection-container`、nav 旧版 `DIV.srk-collection-nav`、hidden header 旧版 `DIV.srk-collection-hidden-header`、ranklist panel 旧版 `DIV.srk-collection-ranklist`、selected-ranklist content 旧版 `DIV.pb-8` 精确 class list 和 32px 底部 padding，且无 Vue-only `collection-page` / `collection-nav` / `collection-hidden-header` / `collection-ranklist-panel` / `collection-ranklist-content` 产品 class；旧版 `.srk-collection-ranklist` `position: relative` / `flex: 1`、collapsed submenu-title 0px 左右内边距、nav light `#f4f4f4`、dark `#111111`、dark border `#434343`、`.srk-collection-hidden-header h3.mb-0` DOM、隐藏标题无 inline `marginTop`、展开态 `marginLeft: 8px`、折叠态 `fontSize: 14px` / `marginLeft: 0px`、无 Vue-only `line-height: 1`、nav `z-index: 1` 和 hidden-header `z-index: auto` 断言继续覆盖。
```

## 演练场 `/playground`

测试 URL：

- `http://127.0.0.1:3000/playground`

检查项：

- `[x]` CSR 页面加载正常，且不依赖上游数据调用
- `[x]` 页面不展示旧 React 不存在的 `Playground` 顶部标题栏
- `[x]` 页面不展示旧 React 不存在的可见 `Preview` 按钮
- `[x]` 测试用 hydration marker 不作为可见产品文本展示
- `[x]` 测试用 editor-ready marker 不作为可见产品文本展示
- `[x]` 编辑器外壳不展示旧 React 不存在的额外边框和圆角
- `[x]` 内置 demo SRK 可以预览
- `[x]` 粘贴合法 SRK JSON 后可以预览
- `[x]` 粘贴格式错误 JSON 后展示可理解的 invalid JSON 状态
- `[x]` invalid JSON 提示标题保留旧版 `h3.mt-16.text-center` 类名
- `[x]` invalid JSON 快捷键标签使用旧版 `mr-0` class token，并保持 0px 右/左间距
- `[x]` 粘贴对象 JSON 但不是可渲染 SRK 时展示可理解的转换错误
- `[x]` 编辑区控件可用
- `[x]` Monaco minimap/default option chrome 与旧 React 行为一致：minimap 可见，且仅保留旧版 `selectOnLineNumbers: true` option
- `[x]` 预览区可用
- `[x]` 预览区右上角 `srk 文档` 入口位置、问号图标、外链地址与旧版一致
- `[x]` 预览区右上角 `srk 文档` 入口保留旧版 `div.absolute.right-4.top-4` 外壳 DOM
- `[x]` 预览区右上角 `srk 文档` 入口外壳类名精确等于旧版 `absolute right-4 top-4`，不包含 Vue-only wrapper class
- `[x]` 预览区右上角 `srk 文档` 入口锚点为旧版 plain anchor，不包含 Vue-only `playground-docs-link` class
- `[x]` 预览区右上角 `srk 文档` 入口保留旧版 `target="_blank"` 且无 `rel` 的 DOM/referrer 语义
- `[x]` 欢迎弹窗使用旧版“点击右上角 QuestionCircle 图标”的 srk 文档提示，不展示迁移版“页面中的 srk 文档入口”文案
- `[x]` Playground 根布局和预览 pane 保留旧版 `.srk-playground-container` / `.srk-playground-preview` 类名
- `[x]` 有效 SRK 预览外壳保留旧版 `div.mt-8.mb-8` DOM/class token 和 32px 顶部/底部间距
- `[x]` 桌面端使用旧版 flex 布局、500px 编辑器和自适应预览区
- `[x]` 桌面端编辑区和预览区布局可接受
- `[x]` 移动端编辑区和预览区布局可接受

需要决策：

- Monaco editor parity：`[ ]` 接受当前编辑器 / `[x]` 后续处理 / `[ ]` 阻塞（旧 minimap/default option chrome 已处理；旧 Monaco `0.34.0` 包版本和 synthetic Monaco editing 仍延期）
- 更完整的 playground UX polish：`[ ]` 接受当前实现 / `[x]` 后续处理 / `[ ]` 阻塞

备注：

```text
2026-05-28 复核：`tests/e2e/full-chain/playground.spec.ts` 覆盖旧 React `.srk-playground-container` / `.srk-playground-preview` 外壳类名、桌面 flex 布局、500px 编辑器、自适应预览区、Monaco minimap/default option chrome（`.minimap` 可见且宽度大于 0，Playground 仅保留旧版 `selectOnLineNumbers: true` option）、有效 SRK 预览外壳旧版 `div.mt-8.mb-8` DOM/class token 和 32px 间距、编辑器外壳无旧版不存在的额外边框/圆角、旧 React 不存在的 `Playground` 顶部标题栏和可见 `Preview` 按钮已移除、hydration marker 和 editor-ready marker 视觉隐藏、欢迎弹窗旧版右上角 `QuestionCircleOutlined` 文档提示语和图标、invalid JSON 标题旧版 `h3.mt-16.text-center` 类名、invalid JSON 快捷键 Tag 旧版 `mr-0` class token 和 0px 右/左间距、旧 React 预览区右上角 `div.absolute.right-4.top-4` 外壳及精确类名 `absolute right-4 top-4`、plain no-class `QuestionCircleOutlined` srk 文档锚点、入口位置、图标、地址、`target="_blank"` 和无 `rel` DOM/referrer 语义，以及结构非法 object JSON 的旧版 SRK checker-error `div.ml-8 > h3 + pre` DOM。
```

## 实时榜单页 `/live/:id`

测试 URL：

- `http://127.0.0.1:3000/live/<已知 live id>?token=<token>`
- `http://127.0.0.1:3000/live/<已知 live id>?token=<token>&scrollSolution=1&focus=yes`
- `http://127.0.0.1:3000/live/<不存在的 live id>`

检查项：

- `[x]` CSR 页面加载和 hydration 正常
- `[x]` 测试用 hydration marker 不作为可见产品文本展示
- `[x]` query 参数按预期保留
- `[x]` loaded content wrapper 保留旧版 `mt-8 mb-8` class token 和 32px 顶部/底部间距
- `[x]` loaded content wrapper 保留旧版普通 `DIV`，不再渲染 Vue-only `section`
- `[x]` loaded content wrapper 精确保留 `mt-8 mb-8` class list，不渲染 Vue-only `live-content` / `live-content-with-scroll-solution` product classes
- `[x]` 实时榜单轮询可用
- `[x]` WebSocket 建连行为可接受
- `[x]` 实时事件面板能清晰展示 accepted/rejected 事件
- `[x]` 实时事件面板保留旧 React Toastify `DIV` container 与 direct visible `DIV` toast row DOM，不渲染 `ul` / `li` product structure
- `[x]` 同屏多条实时事件按旧 Toastify `newestOnTop={false}` 保持 oldest-first 可见顺序
- `[x]` scroll-solution 模式可以关闭
- `[x]` 关闭 scroll-solution 时保留其他 query 参数
- `[x]` 关闭 scroll-solution 时 WebSocket 会关闭
- `[x]` WebSocket 异常关闭时展示实时错误，同时保留榜单可见
- `[x]` loaded live 外层布局不添加 Vue-only route padding、`1280px` max-width 或自动居中
- `[x]` scroll-solution 模式下 live 内容区保留旧版 `250px` 左偏移且不添加额外右外边距
- `[x]` scroll-solution 模式下 live 内容区通过旧版 inline style 提供 `250px` 左偏移，移动端 realtime 布局同样保留 content-left `250px`
- `[x]` scroll-solution 开关文本与 Switch 间距使用旧版 `4px`
- `[x]` scroll-solution 开关文字使用旧版 `14px` 和 light `rgba(0, 0, 0, 0.85)` 正文色
- `[x]` scroll-solution 未知结果使用旧版 `--` 文案且不添加 Vue-only `result-unknown` 类
- `[x]` 移动端不渲染 scroll-solution 开关 DOM，同时保留榜单渲染
- `[x]` 缺失 live contest 展示 Not Found
- `[x]` Live Not Found 外壳保留旧版 `mt-16 text-center` 工具类，标题保留旧版 `h3.mb-4`
- `[x]` Live 通用错误和 loading 状态保留旧版 `mt-16 text-center` 工具类
- `[x]` 桌面端普通 live 布局可接受
- `[x]` 移动端普通 live 布局可接受
- `[x]` 桌面端实时布局可接受
- `[x]` 移动端实时布局可接受

需要决策：

- 自动 WebSocket reconnect/backoff：`[x]` 接受当前实现 / `[ ]` 后续处理 / `[ ]` 阻塞
- Toastify 动画和像素级一致：`[x]` 接受当前实现 / `[ ]` 后续处理 / `[ ]` 阻塞

备注：

```text
2026-05-28 复核：live full-chain 使用 mock backend 和 stub WebSocket 覆盖 CSR hydration、hydration marker 视觉隐藏、query 保留、loaded content 旧版普通 `DIV` wrapper、精确 `mt-8 mb-8` class list、无 Vue-only `live-content` / `live-content-with-scroll-solution` product classes、32px 间距、旧版 inline `250px` scroll-solution 左偏移、移动端 realtime content-left `250px`、loaded root 旧版普通 `DIV` 且无 Vue-only `live-page` class / 无 route-local `70vh` min-height、polling、loaded live 外层无 Vue-only padding/max-width/auto-centering、scroll-solution 旧版 250px 左偏移且无额外右外边距、WebSocket setup/reconnect/close、Toastify/scroll-solution、旧 React Toastify `DIV` container + direct visible `DIV` toast row DOM 且无 `ul` / `li` product structure、旧 Toastify `newestOnTop={false}` oldest-first 可见行顺序、scroll-solution 开关旧版 4px 间距、旧版 14px 和 light `rgba(0, 0, 0, 0.85)` 文字样式、移动端旧版不渲染 scroll-solution 开关 DOM、未知实时结果旧版 `--` fallback 与无 `result-unknown` class、no-meta header action 旧版工具类和导出按钮不带 `pl-2 border-l`、用户弹窗 rank-time 旧版 chart-only `mt-4` 外壳类名和 G2 图表、Not Found、普通/实时桌面移动端截图和 bounds。
```

## API 与数据行为

检查项：

- `[x]` Normal API 行为可接受：statistics、list-all、search、live info、live ranklist
- `[x]` CDN API 行为可接受：ranklist info、SRK file download、collection data
- `[x]` wrapped API `code === 0` 成功行为可接受
- `[x]` wrapped API `code === 11` 映射到 Not Found 行为
- `[x]` HTTP 404 映射到 Not Found 行为
- `[x]` 其他 API 错误展示的通用错误状态可接受
- `[x]` 重复加载榜单或合集时的缓存行为可接受
- `[x]` 人工测试中没有发现非预期的生产数据假设

备注：

```text
2026-05-26 复核：API 行为由 `tests/unit/rankland-api.service.spec.ts`、adapter/error unit tests，以及各公开 route full-chain mock request assertions 覆盖。
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
| App shell Ant Design 菜单/dropdown 样式 | `[ ]` | `[ ]` | `[ ]` | 已处理，full-chain 覆盖 Ant Design Vue shell/menu/dropdown/button 结构 |
| App shell GA/pageview dispatch parity | `[ ]` | `[ ]` | `[ ]` | 已处理，full-chain 覆盖 analytics init/pageview dispatch |
| 首页更完整 SEO/content polish | `[x]` | `[ ]` | `[ ]` | |
| 合集页菜单、移动端、分类 icon 精确行为 | `[ ]` | `[ ]` | `[ ]` | 已处理，full-chain 覆盖 Ant Design Vue menu/category icon/mobile collapse/remaining-height/nav chrome/hidden header/shell classes |
| 演练场 Monaco/editor parity | `[x]` | `[ ]` | `[ ]` | Monaco minimap/default option chrome 已按旧 React 还原；Monaco 0.43 保留为已验证 Vue wrapper 依赖，旧 0.34 包版本不再精确保留 |
| Live WebSocket reconnect/backoff | `[ ]` | `[ ]` | `[ ]` | 已处理，full-chain 覆盖错误关闭/异常关闭后的 reconnect |
| Live Toastify DOM、动画、像素和行顺序一致 | `[ ]` | `[ ]` | `[ ]` | 已处理，full-chain 覆盖旧 React Toastify `DIV` container / direct visible `DIV` toast row DOM、Zoom 动画、像素覆盖，以及旧 `newestOnTop={false}` oldest-first 可见行顺序 |
| SRK renderer 精确 `StyledRanklistRenderer` 视觉 parity | `[x]` | `[ ]` | `[ ]` | 已处理多个 wrapper/低层视觉切片，包括 remarks wrapper exact `mb-4 text-center` / no Vue-only product class、banner image exact `mb-2` / inline max-width/max-height / no Vue-only product class、render-error plain alert wrapper inline style/no Vue-only class、header title 32px/500/4px、header 非标题文字 14px、progress 外壳 `mx-4` 类、移动端筛选 controls 旧版 row/center 布局、Select `160px` 和 `ml-5` 间距、筛选控件内部无 Vue-only wrapper gap 且 `.ml-2`/`.mr-1` 恢复 8px/4px 实际间距、筛选控件 direct-child DOM 去除 Vue-only `label.rankland-ranklist-filter` wrapper、SRK banner/用户照片破图隐藏、用户和题目解法弹窗 wrapper 旧版 table wrapper 内 DOM、用户和题目解法弹窗根节点旧版 `srk-react-modal-root` 类、用户弹窗旧版 `.user-modal` 根类、组织行 `mb-0` 类、无组织用户空组织行、团队成员行 `mt-2` 类、团队成员分隔符 raw ` / ` 文本、团队成员 item-level entry `span` DOM、标记行 `mt-2` 类、非正式提示 `mt-4 mb-0` 类、奖区行 `mt-4 mb-0` 类、奖区标签 `.user-modal-segment-label` 类、标语 `.slogan mt-4 mb-2` 类、照片外壳 `mt-4` 类、照片/标语共享外壳结构和无照片/无标语用户空外壳；若后续产品 review 发现具体差异，再开独立 slice |
| Rank-time 旧版 `@antv/g2` tooltip、动画和弹窗外壳 parity | `[ ]` | `[ ]` | `[ ]` | 已处理，full-chain 覆盖 G2 图表容器/canvas、tooltip/动画模型，以及旧版 chart-only `mt-4` 外壳类名 |

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
- `[x]` 接受路由兼容迁移完成，但保留列出的后续 slice
- `[ ]` 暂不收口，先修复阻塞项

最新自动化结论：user modal team members product class parity 已纳入收口记录，完整 gate 已通过，`git diff --check` 已通过。

无当前已复现阻塞；SRK controls extra-action gap parity、App shell legacy layout/logo class parity、App shell site-switch trigger `px-2` class parity、App shell site-switch dropdown content class/style parity、Fallback 404 class token parity、SRK table wrapper class attribute parity、Playground preview wrapper DOM/class parity、Playground docs link anchor class parity、Playground docs link wrapper class parity、Playground docs link wrapper DOM parity、Playground docs link rel omission parity、Playground Monaco minimap/default option chrome parity、App shell site-switch rel omission parity、Beian link rel omission parity、Home external link rel omission parity、ContactUs trigger anchor DOM parity、SRK contributor link rel parity、SRK header ref-link rel parity、SRK header meta DOM parity、SRK header meta product class parity、SRK renderer top-level wrapper DOM parity、SRK render-error wrapper DOM/class parity、SRK banner image class/style parity、SRK remarks wrapper exact class parity、SRK contributor item span DOM parity、SRK ref-link item span DOM parity、Playground shortcut tag mr-0 class parity、Collection selected-ranklist pb-8 class parity、Collection wrapper DOM parity、Collection hidden-header title style parity、Route content utility class parity、Ranklist loaded wrapper DOM parity、Live route wrapper chrome parity、Live root wrapper DOM parity、Live content wrapper DOM parity、Live realtime Toastify DOM parity、Live scroll-solution unknown result class parity、Live scroll-solution order parity、Live mobile scroll toggle DOM parity、SRK checker error DOM parity、SRK check-error wrapper class parity、user modal empty organization line parity、user modal organization line product class parity、user modal team members product class parity、user modal segment line product class parity、user modal unofficial line product class parity、SRK modal root class parity、SRK modal table-wrapper DOM parity、SRK table spacer DOM parity、SRK header action display parity、SRK header action gap parity、SRK header action attribute parity、SRK header action status removal parity、SRK extra ref-link spacing parity、SRK view-count utility-class parity、SRK progress wrapper utility-class parity、SRK progress wrapper product class parity、SRK controls wrapper product class parity、SRK footer wrapper product class parity、user modal empty photo wrapper parity、SRK asset image error parity、Contact QQ image class parity、SRK header utility class parity、SRK header action utility class parity、SRK header title typography parity、header text size parity、header view-count fallback parity、SRK controls utility class parity、SRK remarks wrapper utility class parity、SRK footer utility class parity、SSR hydration marker visual parity、search shell DOM parity、search heading DOM parity、search input DOM parity、search list item DOM parity、search result count DOM parity、search keyword whitespace parity、search state wrapper DOM parity、search section content DOM parity、search row content DOM parity、search error message DOM parity、search state utility class parity、search error DOM parity、search list utility class parity、Playground legacy shell class parity、Playground invalid prompt class parity、user modal root class parity、user modal organization line class parity、user modal team members class parity、user modal team separator raw text coverage、user modal team-member entry DOM parity、user modal markers class parity、user modal unofficial line class parity、user modal segment line class parity、user modal segment label class parity、user modal slogan spacing class parity、user modal photo wrapper class parity、user modal photo/slogan shared wrapper DOM parity 和 user modal photo inline width parity 已补充，保留 product-review-driven SRK lower-level table pixel parity / route polish 作为后续 review-driven slice。

最终收口前必须完成：

```text

```

建议下一步开发 slice，按优先级排序：

1. Product-review-driven SRK lower-level table pixel parity, if route review finds a concrete remaining table difference.
2. Route-level product polish after manual review.
3. Release/merge/deploy process only when Cooper requests it.

2026-05-26 自动化证据已覆盖此前记录的大部分阻塞项；本清单保留为人工验收记录，不替代最终 release 决策。

最终验收意见：

```text

```
