# Independent Navigation Architecture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the non-reading forum surface and the embedded topic workspace independent navigation contexts, so navigation or refresh in one context does not destroy the other context's layout, tabs, scroll position, or iframe cache.

**Architecture:** When split mode is active, the userscript owns a stable shell mounted directly under `body`. The shell keeps the top-level forum header/sidebar as navigation chrome, renders the current non-reading route in one same-origin list iframe, and renders topic tabs in the existing topic iframe pool. Navigation links in the top-level chrome are routed into the list iframe; links inside the list iframe report topic opens to the parent and keep all other non-reading navigation inside that iframe. Topic frames remain an independent pool. Session state records the list iframe URL/scroll and topic tabs, so a top-level reload rehydrates both contexts without redirecting the browser document.

**Tech Stack:** TypeScript（类型脚本语言）, DOM（网页节点）, same-origin iframe（同源内嵌页面）, Vitest（测试框架）, jsdom（浏览器环境模拟器）, esbuild（打包工具）.

---

### Task 1: Capture the current architecture and backup

**Files:**
- Create: `docs/plans/2026-08-06-independent-navigation-architecture.md`
- Git backup: tag `backup/v0.1.21-before-independent-navigation`

**Step 1:** Record the existing route, shell, topic-frame, session, and bridge boundaries in this plan.

**Step 2:** Verify the working tree is clean and the backup tag points at `94555bb`.

**Step 3:** Work on `codex/independent-navigation-architecture`; do not alter `main` directly.

### Task 2: Define the independent list-frame protocol with failing tests

**Files:**
- Modify: `src/core/types.ts`
- Modify: `src/tabs/frame-pool.ts`
- Modify: `src/frame-bridge.ts`
- Create: `src/tabs/list-frame.ts`
- Test: `tests/list-frame.test.ts`
- Test: `tests/frame-bridge.test.ts`

**Step 1:** Add tests for a named `ldu-list:<id>` iframe sending `ldu:list-ready` and debounced `ldu:list-state`, and for topic-link clicks sending `ldu:list-topic-open` while ordinary list links remain native inside the iframe.

**Step 2:** Run the focused tests and verify they fail because the list role and messages do not exist.

**Step 3:** Implement a small `ListFrameController` that creates exactly one same-origin list iframe, navigates it, sends/restores scroll, validates message source/origin, and destroys listeners without retaining detached frames.

**Step 4:** Extend the embedded bridge with a separate list role. List pages hide only their own header/sidebar, preserve their own browser scroll root for Discourse incremental loading, and never boot the top-level app.

**Step 5:** Run the focused tests and verify they pass.

### Task 3: Introduce a stable split shell

**Files:**
- Modify: `src/ui/layout-controller.ts`
- Modify: `src/ui/styles.ts`
- Test: `tests/layout-shell.test.ts`

**Step 1:** Add a failing test that a mounted split shell is a body-level stable host, contains one list pane and the existing topic panel, and can reattach a newly rendered sidebar without creating duplicate shells.

**Step 2:** Implement shell creation and teardown. Move the current sidebar node into the shell's sidebar slot, hide the route-owned main outlet while split mode is active, and keep the topic panel API used by the tab strip/frame pool.

**Step 3:** Add responsive grid rules for two-pane and three-pane modes, preserving adaptive pane ratios and the existing narrow-screen native fallback. Add list iframe sizing with no independent parent scroll container.

**Step 4:** Run layout and style tests.

### Task 4: Route all non-reading navigation into the list context

**Files:**
- Modify: `src/app.ts`
- Modify: `src/discourse/routes.ts`
- Modify: `src/tabs/tab-store.ts`
- Test: `tests/app-list-navigation.test.ts`
- Test: `tests/direct-topic-startup.test.ts`

**Step 1:** Add failing tests for category/user/search/header navigation staying in split mode, preserving the topic iframe identity, updating `session.listUrl`, and not causing `location.assign`/`location.replace`.

**Step 2:** Add list-frame startup and message handling to `LinuxDoApp`; use the frame URL as the only non-reading route source while the shell is active.

**Step 3:** Replace direct-topic handoff redirects with an in-document promotion: the first user-initiated same-origin navigation from a direct topic creates the shell, seeds the current topic, and routes the target into the list iframe or opens the target topic tab. A first direct topic with no follow-up remains native.

**Step 4:** Keep refresh semantics explicit: `sessionStorage` session identity and stored session rehydrate the shell; cross-visit restoration remains governed by the existing opt-in setting and never merges browser tabs.

**Step 5:** Run app/session/direct-topic tests and verify no native link is intercepted when split mode is inactive or the target is external, a topic control, a modified click, or the current topic.

### Task 5: Harden lifecycle and memory ownership

**Files:**
- Modify: `src/app.ts`
- Modify: `src/tabs/frame-pool.ts`
- Modify: `src/tabs/list-frame.ts`
- Test: `tests/lifecycle-memory.test.ts`

**Step 1:** Add failing tests for shell teardown, list-frame replacement, pagehide persistence, and repeated route mutations not growing event listeners or iframe count.

**Step 2:** Implement idempotent disposal, abort pending list-frame operations, clear timers, and ensure removed topic/list frames cannot post accepted messages.

**Step 3:** Run the lifecycle tests plus the complete suite; inspect heap-sensitive counters in test mode rather than limiting user-configured tab capacity.

### Task 6: Documentation, release, and verification

**Files:**
- Modify: `docs/architecture.md`
- Modify: `docs/technical-guide.md`
- Modify: `README.md`
- Modify: `src/meta.ts`
- Modify: `package.json`
- Modify: `dist/linuxdo-ultimate.user.js`

**Step 1:** Rewrite the architecture and maintenance sections around the stable shell/list-frame protocol, migration behavior, and known iframe limitations.

**Step 2:** Bump the patch version, build the distributable userscript, and verify the metadata version matches.

**Step 3:** Run `pnpm test`, `pnpm check`, `pnpm build`, and `git diff --check`.

**Step 4:** Use the logged-in real forum to verify home/category/user/search navigation, direct-topic promotion, topic-tab persistence, list-frame scroll/incremental loading, top-level reload rehydration, and two/three-pane screenshots. Do not post, react, pay, or manually invoke view-count endpoints.

**Step 5:** Commit the completed change and push the feature branch for review; keep the backup tag untouched.
