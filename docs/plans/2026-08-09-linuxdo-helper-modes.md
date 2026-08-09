# LinuxDo 小助手模式移植实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将“LinuxDo 小助手”中截图对应的只看楼主、清爽模式和低端设备性能优化，以分屏兼容、低额外开销的方式接入 Linux Do Ultimate，并补齐致谢。

**Architecture:** 把页面增强逻辑集中在一个轻量 `topic-tools` 模块中：顶层原生帖子页直接挂载，列表/帖子 iframe（内嵌页面）由已有 bridge（页面通信桥）挂载。宿主只通过一条配置消息同步开关，避免每个 iframe 重复运行宿主应用；样式使用一次性静态 CSS 与 `data-*` 状态切换，只有只看楼主需要按增量内容重新应用。

**Tech Stack:** TypeScript（类型脚本语言）、Vitest（测试框架）、jsdom（浏览器环境模拟器）、esbuild（打包工具）、Chrome/Firefox 扩展 content script（内容脚本）。

---

### Task 1: 建立设置字段与默认值

**Files:**
- Modify: `src/core/types.ts`
- Modify: `src/core/defaults.ts`
- Test: `tests/settings-panel.test.ts`

1. 增加 `ownerOnlyEnabled`、`cleanModeEnabled`、`lowEndOptimizationEnabled` 三个布尔设置，默认关闭。
2. 在归一化逻辑中兼容旧设置并保持 schema 不变，避免无关迁移。
3. 为设置面板增加三项开关的结构与同步测试。

### Task 2: 实现页面增强模块

**Files:**
- Create: `src/discourse/topic-tools.ts`
- Test: `tests/topic-tools.test.ts`

1. 提供 `installTopicTools` 与配置更新接口。
2. 只看楼主按主题 ID 保存状态，按钮只出现在帖子文档；增量加载后只重新扫描帖子，不重建整个页面。
3. 清爽模式复用原脚本的公告、欢迎段落、分类徽章、标签和头像列隐藏规则；不在分屏宿主页强制收起官方 sidebar（侧边栏），避免破坏布局。
4. 低端设备优化只复用原脚本的动画/过渡降级规则，不移植黑白灰滤镜；样式只注入一次。

### Task 3: 接入顶层页面和 iframe bridge

**Files:**
- Modify: `src/frame-bridge.ts`
- Modify: `src/tabs/frame-pool.ts`
- Modify: `src/tabs/list-frame.ts`
- Modify: `src/app.ts`
- Test: `tests/frame-bridge.test.ts`, `tests/frame-pool.test.ts`, `tests/list-frame-bridge.test.ts`

1. 在 topic/list bridge 中挂载轻量增强模块，增加 `ldu:topic-tools-config` 配置消息。
2. 在两个阅读区和列表 iframe 的创建、加载、设置变更时同步配置。
3. 顶层原生帖子页挂载同一模块；进入分屏后不重复创建可见控制。
4. 验证 frame（内嵌页面）之间状态隔离、配置热更新和无 sidebar 破坏。

### Task 4: 文档、版本与构建验证

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/technical-guide.md`
- Modify: `package.json`

1. README 加入功能简介，并致谢 Greasy Fork（油猴脚本站）脚本；作者留空。
2. 补充 `@pipecraft` 过盾脚本致谢（若已有则校验措辞和链接）。
3. 更新维护文档与版本号，保留当前未提交改动，不覆盖历史产物。
4. 运行 `pnpm check`、`pnpm test`、`pnpm build:all`，检查 `git diff --check`。
