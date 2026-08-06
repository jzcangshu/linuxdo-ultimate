# 直接帖子与会话归属实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 删除固定标签功能，让首次直达帖子保持原生页面，并确保跨访问只恢复最后关闭的一个浏览器标签页会话。

**Architecture:** 每个顶层浏览器标签页继续使用 `sessionStorage`（会话存储）中的独立编号保存自己的刷新状态；共享存储不再接收日常标签变化，只在 `pagehide`（页面离开）时暂存一个关闭候选。相同会话编号重新启动会撤销该候选，表示这是刷新；不同编号的新标签页只恢复最后一个候选，因此不会合并多个窗口。首次直达帖子不创建分屏，只有用户从该页点击另一个帖子或可承载列表的站内页面时才通过短期交接进入分屏。

**Tech Stack:** TypeScript（类型脚本）、Vitest（单元测试）、JSDOM（文档对象模型测试）、Tampermonkey（油猴）用户脚本。

---

### Task 1: 删除固定标签与压缩标题控件

**Files:**
- Modify: `src/core/types.ts`
- Modify: `src/core/session.ts`
- Modify: `src/tabs/tab-store.ts`
- Modify: `src/tabs/tab-strip.ts`
- Modify: `src/tabs/frame-pool.ts`
- Modify: `src/app.ts`
- Modify: `src/ui/styles.ts`
- Test: `tests/tab-strip.test.ts`
- Test: `tests/tab-store.test.ts`
- Test: `tests/frame-pool.test.ts`

**Steps:**

1. 添加失败测试，断言标签中不存在固定按钮，标题使用站内较小字号。
2. 运行标签与页面池测试，确认失败来自旧固定逻辑。
3. 从状态类型、规范化、标签存储、页面池淘汰和界面回调中删除 `pinned`（固定）字段。
4. 页面池只按最近使用时间暂停非活动页面。
5. 运行相关测试并确认通过。

### Task 2: 首次直达保持原生，第二次导航建立分屏

**Files:**
- Modify: `src/app.ts`
- Modify: `src/discourse/direct-topic-handoff.ts`
- Test: `tests/direct-topic-handoff.test.ts`
- Test: `tests/direct-topic-startup.test.ts`
- Test: `tests/browser/direct-topic-promotion.test.ts`

**Expected behavior:**

| 当前状态 | 用户动作 | 结果 |
| --- | --- | --- |
| 新浏览器标签页直接打开帖子 A | 无操作或刷新 | 保持论坛原生帖子页，不出现分屏 |
| 原生帖子 A | 点击另一个帖子 B | 转到主页列表，阅读区创建 A、B 两个标签，B 为活动标签 |
| 原生帖子 A | 点击分类、主页或搜索页 | 目标页面作为列表区，A 成为活动阅读标签 |
| 原生帖子 A | 点击同帖楼层、用户页、聊天或站外链接 | 保留论坛原生行为，不强制分屏 |
| 已有本标签页分屏会话 | 顶层意外进入帖子 B | 返回原列表并把 B 加入现有会话 |

**Steps:**

1. 添加失败测试，证明首次直达不调用 `location.replace`（替换地址）。
2. 将交接结构升级为“目标列表加一个或多个帖子”，并保持同源、时效和单次消费校验。
3. 在原生帖子页捕获另一个帖子或列表类站内链接，保存 A 或 A+B 后导航到列表。
4. 交接存在时禁止载入无关的跨访问恢复会话。
5. 列表容器挂载成功后依次打开交接帖子，最后一个成为活动标签。
6. 运行直达、路由和浏览器冒烟测试。

### Task 3: 将跨访问恢复限定为最后关闭的一个会话

**Files:**
- Modify: `src/core/defaults.ts`
- Modify: `src/core/storage.ts`
- Modify: `src/app.ts`
- Test: `tests/storage.test.ts`
- Test: `tests/app-session-startup.test.ts`

**Storage rules:**

1. `linuxdo-ultimate:session:<id>` 只属于对应浏览器标签页，用于该标签页刷新恢复。
2. 日常打开、关闭、切换帖子只更新本标签页记录，不更新共享恢复记录。
3. 页面离开时，若恢复开关开启且当前会话有帖子，则写入单个关闭候选；新候选覆盖旧候选。
4. 写入新候选前，把旧候选确认为上一个已关闭会话，以便另一个仍打开的页面刷新后能撤销自己的候选而不丢失真正关闭的会话。
5. 相同会话编号再次启动表示刷新，撤销本次关闭候选并继续使用自己的会话。
6. 无本标签页会话的新访问仅恢复当前最后关闭候选；绝不合并多个会话。
7. 关闭恢复开关时清除共享恢复候选和已确认记录，防止以后重新开启时复活陈旧帖子。

**Steps:**

1. 添加多会话失败测试，覆盖 A、B 同时活动、关闭 A、刷新 B、再新开 C 的顺序。
2. 新增关闭候选的写入、刷新撤销、最后关闭读取和清理函数。
3. 将 `TopicTabStore`（帖子标签存储）的日常保存改为仅保存本会话。
4. 在 `pagehide`（页面离开）同步保存本会话并暂存关闭候选。
5. 启动时先撤销同编号刷新候选，再决定是否恢复最后关闭会话。
6. 运行存储、启动和完整测试。

### Task 4: 文档、版本与发布验证

**Files:**
- Modify: `README.md`
- Modify: `docs/technical-guide.md`
- Modify: `docs/architecture.md`
- Modify: `package.json`

**Steps:**

1. 更新直接帖子入口、最后关闭会话和无固定标签的用户说明。
2. 升级用户脚本版本。
3. 运行 `pnpm test`、`pnpm check`、`pnpm build` 和 `git diff --check`。
4. 检查构建产物版本号和固定按钮字符串均符合预期。
