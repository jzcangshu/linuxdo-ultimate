# Cloudflare Challenge Bypass Integration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将快速过盾脚本的自动跳转与回跳能力移植到 Linux Do Ultimate，并让宿主页、列表 iframe 和帖子 iframe 各自独立恢复。

**Architecture:** 新增一个不依赖宿主应用的轻量 challenge 模块，由扩展以独立 content script 在所有 linux.do frame 中运行。每个文档只观察自身错误弹窗并只重定向自身 browsing context，从而保留分屏中未受影响的页面；兼容用户脚本复用同一模块，并在顶层页面注册原脚本的手动菜单。

**Tech Stack:** TypeScript、MutationObserver、WebExtension Manifest V3、Vitest、JSDOM、esbuild。

---

### Task 1: 固化原脚本行为

**Files:**
- Create: `tests/challenge-bypass.test.ts`
- Create: `src/discourse/challenge-bypass.ts`

1. 为错误文案识别、安全 redirect 参数、5 秒循环保护和动态弹窗观察编写失败测试。
2. 实现可注入导航器与时钟的 challenge 控制器，保持原脚本判断和跳转原理。
3. 验证普通页面、challenge 页面及 iframe 使用相同逻辑且互不依赖。

### Task 2: 接入扩展和兼容用户脚本

**Files:**
- Create: `src/extension/challenge.ts`
- Modify: `src/main.ts`
- Modify: `scripts/build-extension.ts`
- Modify: `scripts/package-extension.ts`
- Modify: `extension/manifest.template.json`
- Modify: `extension/manifest.firefox.template.json`
- Modify: `src/meta.ts`
- Modify: `tests/extension-build.test.ts`
- Modify: `tests/extension-package.test.ts`
- Modify: `tests/build.test.ts`

1. 扩展独立产出 `challenge.js`，在 linux.do 顶层和所有子 frame 的 document-start 阶段加载。
2. 用户脚本在宿主页和内嵌页启动同一模块，只在顶层注册手动 Challenge 菜单。
3. 构建与压缩包测试确认轻量模块没有重新引入宿主、预览或布局代码。

### Task 3: 版本、文档和交付验证

**Files:**
- Modify: `package.json`
- Modify: `CHANGELOG.md`
- Modify: `README.md`
- Modify: `updates/latest.json`

1. 版本升级到 `0.6.0`，记录自动过盾和分屏独立恢复行为。
2. README 增加核心功能说明，并致谢 `@pipecraft` 与原帖。
3. 依次运行类型检查、全量测试、双浏览器构建和正式压缩包构建。
4. 不提交、不推送、不发布 Release。
