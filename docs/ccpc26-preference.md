# CCPC26 持久化偏好

## 设置语义

榜单声明 `ICPC` 的 `CCPC26` 扩展算法时，进入 Time Travel 后，在状态文字右侧显示项目现有的 Switch。该开关控制用户是否允许使用 CCPC26 逻辑，不直接显示 renderer 的 `enableCCPC26` prop。

| 用户偏好 | 现有时间规则 | 开关 | 实际榜单模式 |
| --- | --- | --- | --- |
| 开启 | 封榜前，可启用 CCPC26 | 开启 | CCPC26 |
| 开启 | 封榜后、静态完整榜单等不可启用状态 | 开启（回放时可见） | 普通 |
| 关闭 | 任意时间 | 关闭（回放时可见） | 普通 |

开关退出回放后隐藏；回放时间变化、封榜边界和 Live 更新不会改写偏好。未声明 CCPC26 的榜单不会显示开关。

## 持久化与渲染

- 复用 `localStorage.StyledRanklistSettings` JSON，新增 `preferCCPC26` 字段。
- 默认 `true`，旧数据缺失字段及非法非布尔值都回退为开启；只有明确的布尔 `false` 禁用。
- 通过现有 `updateRanklistSetting` 和存储 watcher 写入，与其他榜单偏好共存，属于同一浏览器的全局榜单设置。
- `useCCPC26Mode` 继续只负责既有比赛声明/回放/Live/封榜时间资格。
- 实际 `enableCCPC26 = renderedRanklistSettings.preferCCPC26 && ccpc26TimeEligible`；表格、完整比赛切片的题目布局、弹窗、排名曲线和 Worker 都继续使用这个最终值。
- SSR 首屏仍使用既有默认设置恢复流程；Live CCPC26 的浏览器时钟门控不因本地偏好关闭而移除。ProgressBar key 不包含偏好，因此切换设置不重置回放位置。

## 插槽与布局

使用正式 npm 包 `@algoux/standard-ranklist-renderer-component-vue@0.7.3` 的 `#timeMachine` 插槽，保留默认状态文字及其动画。Switch 复用项目的 shadcn-vue / radix-vue 实现，采用 `checked` / `update:checked`，可访问名称为 `CCPC26`，支持键盘操作。

状态容器仅占文字宽度；控件组内标签在左、Switch 在右；控件组绝对定位于 `left: calc(100% + 16px)`，不参与文字居中，也不随文字闪烁。进度区域是命名为 `ranklist-progress` 的 inline-size query container，宽度不大于 720px 时，将 elapsed / remaining 移到第二行。因此桌面窄预览区域、嵌入榜单和手机都能采用同一布局。

## 发布来源与验证

Renderer 功能提交 `1be0bb2d`，版本 PR #13 合并提交 `61a85a30`，五个框架包均发布为 `0.7.3`。发布流水线 `39439710096` 成功，五个 npm tarball 均核对 registry 完整性后才升级本仓库。core 保持 `0.7.2`、styles 保持 `0.7.0`。

测试结果和完成状态见 [实施计划](implementation/2026-10-20-ccpc26-preference-plan.md)。

验证完成：706 项单元/SSR 测试通过，21 项既有环境测试跳过；完整 client/SSR/server 构建通过。13 项 CCPC26 Chromium 场景全部通过，另两项保存设置水合/主题回归通过。额外的设置弹层回归仍有一项层级断言失败（实际 `z-index: 50`，期望至少 1000；对应弹层实现和测试本轮均未修改）。
