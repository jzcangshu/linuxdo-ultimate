# Split Layout Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完成已确认的 11 项分屏交互优化，并修复帖子滚动重载和底部空白。

**Architecture:** 统一由路由辅助函数判定可分屏页面；布局控制器根据 Discourse（论坛系统）侧栏实际状态生成两列或三列网格。面板比例同时写入会话状态和长期设置；内嵌帖子仅上报滚动位置和可持久化的楼层信息，不把滚动导致的 URL（网址）变化再写回 iframe（内嵌页面）。

**Tech Stack:** TypeScript（类型脚本语言）、Vitest（测试框架）、jsdom（DOM 模拟环境）、esbuild（构建工具）、Chrome extension（Chrome 扩展浏览器会话）。

---

### Task 1: 路由和真实点击

**Files:** `src/discourse/routes.ts`, `src/app.ts`, `tests/routes.test.ts`, `tests/browser/smoke.test.ts`

1. 添加首页 `/` 分类失败测试和首页真实链接点击测试。
2. 运行定向测试，确认测试失败。
3. 实现 `isSplitRoute`（可分屏路由判断）并替换重复判断。
4. 重跑定向测试。

### Task 2: 比例、侧栏和顶栏布局

**Files:** `src/core/defaults.ts`, `src/ui/layout-controller.ts`, `src/ui/styles.ts`, `tests/layout.test.ts`, `tests/styles.test.ts`

1. 添加默认 65:35、无侧栏时保持当前比例、顶栏全宽对齐的失败测试。
2. 将列表默认比例改为 `0.35`，用 `has-sidebar-page`（有侧栏页面）状态切换两列/三列网格。
3. 让顶部 logo（标志）条取消原有居中最大宽度，左右控件对齐实际页面边界。
4. 重跑布局和样式测试。

### Task 3: 长期记忆拖动比例

**Files:** `src/app.ts`, `src/core/defaults.ts`, `src/core/session.ts`, `src/ui/layout-controller.ts`, `tests/storage.test.ts`, `tests/session.test.ts`, `tests/browser/smoke.test.ts`

1. 添加拖动后同时更新会话和长期设置的失败测试。
2. 设置加载后使其作为新会话的面板初始值，旧会话保留自身当前比例。
3. 拖动结束时无感写入用户脚本存储，不新增手动配置项。
4. 验证旧像素宽度设置迁移为新默认比例。

### Task 4: 顶部设置和完整重置

**Files:** `src/app.ts`, `src/ui/settings-panel.ts`, `src/ui/styles.ts`, `tests/browser/smoke.test.ts`, `tests/styles.test.ts`

1. 添加设置按钮位于顶部导航区、重置全部设置和比例的失败测试。
2. 将设置宿主挂载到 `.d-header-icons`（顶部图标区）或顶栏可用后备位置，并支持 Discourse 重渲染后重挂载。
3. 使用站内图标按钮尺寸、颜色和焦点状态，移除右下角悬浮样式。
4. 恢复默认时回调完整 `DEFAULT_SETTINGS`（默认设置）。

### Task 5: 标签、分隔线与字号

**Files:** `src/tabs/tab-strip.ts`, `src/ui/layout-controller.ts`, `src/ui/styles.ts`, `tests/styles.test.ts`, `tests/browser/smoke.test.ts`

1. 添加标签 roving tabindex（游走焦点）、方向键/删除键和分隔线键盘调整测试。
2. 标签字号绑定 Discourse 侧栏分类字号变量，保留文本截断和稳定高度。
3. 为分隔线增加 `separator`（分隔线）语义、取值范围和键盘步进。

### Task 6: 观察器和阅读计数任务去重

**Files:** `src/app.ts`, `src/frame-bridge.ts`, `tests/browser/smoke.test.ts`

1. 添加 DOM（页面结构）变更不重复安排同一帖子阅读计数任务的失败测试。
2. 仅在 URL（网址）变化、布局宿主丢失或关键容器变化时同步路由。
3. 按帖子标识记录已安排的计数任务并在路由切换时清理。

### Task 7: 滚动重载和底部空白

**Files:** `src/app.ts`, `src/frame-bridge.ts`, `src/tabs/frame-pool.ts`, `src/ui/styles.ts`, `tests/frame-pool.test.ts`, `tests/styles.test.ts`, `tests/browser/smoke.test.ts`

1. 用“滚动改变楼层 URL（网址）不得重设 iframe（内嵌页面）`src`”的失败测试复现问题。
2. 分离 `loadedUrl`（已加载网址）和 `reportedUrl`（页面上报网址），同一帖子内的楼层变化只更新持久化位置。
3. 去掉写死的 `72px` 和 `32px` 底部间距，使用原站间距变量和浏览器安全区。
4. 滚动多次并验证 iframe 不发生 `load`（重新加载）。

### Task 8: 全量验证与文档

**Files:** `README.md`, `docs/architecture.md`, `docs/testing.md`, `docs/troubleshooting.md`, `docs/requirements-audit.md`

1. 运行 `pnpm test`，期望所有测试通过。
2. 运行 `pnpm check`，期望无 TypeScript（类型脚本）错误。
3. 运行 `pnpm build`，生成 `dist/linuxdo-ultimate.user.js`。
4. 注入构建版，在已登录 Chrome（谷歌浏览器）验证首页真实点击、侧栏收起、顶栏对齐、比例保存、滚动不重载和底部空白。
5. 在 1888、1440、1100 宽度截图，检查字号、比例、对齐和内容遮挡。
6. 同步文档中的默认 65:35 比例和长期自动记忆行为。
