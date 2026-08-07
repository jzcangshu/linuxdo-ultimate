# Tab Drag, Icon System and Cache Maintenance Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为两块阅读区增加高性能标签拖拽排序，统一脚本操作图标，并让脚本拥有的临时缓存自动按期回收，同时从仓库移除废弃实现。

**Architecture:** 标签排序只改变现有版本化会话中的顺序，不新建存储；拖动过程使用浏览器原生拖拽反馈与单一插入标记，放下时只提交一次状态。图标由一个无依赖 SVG（可缩放矢量图形）工厂统一输出，预览上游适配层也复用同一图标集合。持久会话、阅读锁、LDC 短时缓存和预览内存缓存分别由其所有者清理。

**Tech Stack:** TypeScript、DOM Pointer/Drag Events（网页拖拽事件）、SVG（可缩放矢量图形）、Vitest、jsdom、esbuild

---

### Task 1: 标签拖拽排序

**Files:**
- Modify: `src/tabs/tab-store.ts`
- Modify: `src/tabs/tab-strip.ts`
- Modify: `src/app.ts`
- Modify: `src/ui/styles.ts`
- Test: `tests/tab-store.test.ts`
- Test: `tests/tab-strip.test.ts`

**Steps:**
1. 增加失败测试：主阅读区与第二阅读区可独立重排；无效放置不写状态；重复拖过同一位置只在放下时回调一次。
2. 实现 `reorderInPane`，只重排目标阅读区，保持活动标签、页面实例和另一阅读区不变。
3. 为标签元素增加原生拖拽、插入位置提示、取消清理和无障碍状态；关闭按钮不启动拖拽。
4. 在主、第二标签栏接入同一排序回调，最终放下时只触发一次会话持久化。
5. 运行标签与 DOM 集成测试。

### Task 2: 统一图标系统

**Files:**
- Create: `src/ui/icons.ts`
- Modify: `src/ui/settings-panel.ts`
- Modify: `src/ui/tab-context-menu.ts`
- Modify: `src/tabs/tab-strip.ts`
- Modify: `src/app.ts`
- Modify: `src/preview/link-hover-previewer-upstream.ts`
- Modify: `src/ui/styles.ts`
- Test: `tests/icons.test.ts`
- Test: `tests/tab-context-menu.test.ts`
- Test: `tests/upstream-preview.test.ts`

**Steps:**
1. 增加失败测试：所有上下文菜单项均有对应图标；预览操作按钮与关闭按钮均使用统一 SVG；按钮保留标题和无障碍名称。
2. 建立统一 24 单位画布、圆角端点、统一线宽的图标工厂，包含设置、关闭、拆分、新标签、刷新、复制、书签、列表、最大化、还原、删除和关闭其他标签。
3. 替换设置入口、标签关闭、阅读区关闭、上下文菜单及预览窗口中的字符图标和旧 SVG。
4. 统一按钮尺寸、悬停、按压与聚焦反馈；高频标签操作不添加入场动画，并尊重减少动态效果设置。
5. 运行图标、菜单、设置、预览和样式测试。

### Task 3: 临时缓存自动维护

**Files:**
- Modify: `src/app.ts`
- Modify: `src/credit/credit-widget.ts`
- Modify: `src/preview/link-hover-previewer-upstream.ts`
- Test: `tests/storage.test.ts`
- Test: `tests/credit-widget.test.ts`
- Test: `tests/upstream-preview.test.ts`
- Test: `tests/lifecycle-memory.test.ts`

**Steps:**
1. 增加失败测试：LDC 过期缓存被删除；预览缓存按最近到期时间自动清扫；卸载时取消维护定时器；页面长期运行会重复清理过期会话。
2. 预览缓存只在非空时安排一次最近到期清理，删除过期内容后按需续约；卸载时取消。
3. LDC 读取到损坏或过期缓存时立即删除；有效缓存保持不变。
4. 顶层应用以低频定时器调用既有会话清理，页面离开时释放定时器。
5. 运行存储、LDC、预览和生命周期测试。

### Task 4: 移除废弃代码并发布

**Files:**
- Archive outside repository: `src/frame-bridge.ts`
- Archive outside repository: `src/preview/preview-controller.ts`
- Archive outside repository: `src/preview/sanitizer.ts`
- Archive outside repository: `src/discourse/direct-topic-handoff.ts`
- Archive outside repository: obsolete marker-only tests
- Rename: `tests/frame-bridge.test.ts` to `tests/frame-runtime.test.ts`
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/architecture.md`
- Modify: `docs/technical-guide.md`
- Modify: `docs/testing.md`
- Modify: `docs/requirements-audit.md`

**Steps:**
1. 核对正式构建无废弃引用，把文件移动到仓库外本地归档目录，保留可恢复副本但从 Git（版本管理）中删除。
2. 更新用户文档、技术文档、测试矩阵和 `0.3.0` 更新日志。
3. 运行 `pnpm test`、`pnpm check`、`pnpm build`、`git diff --check`。
4. 在真实 Chrome（谷歌浏览器）验证拖拽、全部图标、右键菜单、缓存生命周期以及既有核心流程。
5. 检查秘密信息，提交并推送 `codex/v0.3-audit-hardening`。
