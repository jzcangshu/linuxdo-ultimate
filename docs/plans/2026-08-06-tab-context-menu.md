# Tab Context Menu Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Chrome-style right-click menu to topic tabs with split-panel duplication, browser-tab opening, reload, copy-link, forum-native bookmarking, and close-other-tabs actions.

**Architecture:** Keep one global topic-record collection, but give every open tab exactly one reading-panel owner. Add an optional secondary reading panel with its own tab strip, active tab, and frame pool; invoking the split action moves the selected tab out of the primary panel into the secondary panel instead of duplicating it. Persist the secondary panel's ordered tab ids and active tab id in the versioned session state so refresh restores ownership without duplicating topic records. Capture the current scroll position before moving and transfer the live iframe when practical; the existing frame-ready scroll restoration remains the fallback if the browser reloads a reparented iframe. Implement the menu as a small top-level UI controller with explicit callbacks, separators, viewport clamping, outside-click dismissal, Escape handling, and no native context menu leakage.

**Tech Stack:** TypeScript（类型脚本语言）, DOM（网页节点）, same-origin iframe（同源内嵌页面）, Vitest（测试框架）, CSS（样式表）.

---

### Task 1: Define session and message contracts

**Files:**
- Modify: `src/core/types.ts`
- Modify: `src/core/defaults.ts`
- Modify: `src/core/session.ts`
- Modify: `src/tabs/tab-store.ts`
- Modify: `src/tabs/frame-pool.ts`
- Modify: `src/frame-bridge.ts`
- Test: `tests/session.test.ts`
- Test: `tests/frame-pool.test.ts`
- Test: `tests/frame-bridge.test.ts`

**Step 1:** Add `secondaryTabIds` and nullable `secondaryActiveTabId` to `SessionState`; normalize unknown/old sessions to an empty secondary panel, remove unknown/duplicate ids, and clear both fields when referenced tabs are closed or all tabs are cleared. Primary tabs are the global tab records not present in `secondaryTabIds`.

**Step 2:** Add a parent-to-frame `ldu:bookmark` command and a frame-to-parent-ready path already used by the existing bridge. The frame command must accept only the parent window and same origin.

**Step 3:** Add a `TopicFramePool.sendCommand(tabId, command)` queue. Commands sent before a frame load are delivered once after load; destroying/removing a frame clears commands for that frame. Add safe frame detach/adopt support so a moved tab can retain its live iframe and browsing position where the browser permits it.

**Step 4:** Write failing tests for session normalization, queued commands, and bookmark command dispatch to the forum's `.topic-footer-main-buttons .bookmark-menu-trigger` with a `.show-more-actions` fallback.

**Step 5:** Run focused tests and implement the smallest passing changes.

### Task 2: Add reusable Chrome-style context menu

**Files:**
- Create: `src/ui/tab-context-menu.ts`
- Modify: `src/tabs/tab-strip.ts`
- Modify: `src/ui/styles.ts`
- Test: `tests/tab-context-menu.test.ts`
- Test: `tests/tab-strip.test.ts`

**Step 1:** Write failing tests for right-click prevention, menu grouping/separators, exact Chinese labels, callback dispatch, outside-click dismissal, Escape dismissal, and viewport clamping.

**Step 2:** Implement a menu controller with `role=menu`/`role=menuitem`, fixed positioning, a single document-level dismissal listener per open menu, and cleanup on action/destroy.

**Step 3:** Add the menu items in these groups:

1. `向新的拆分视图中添加标签页`
2. `在新的浏览器标签页中打开`
3. `重新加载` (`Ctrl+R`), `复制链接`
4. `添加到书签`
5. `关闭其他标签页`

**Step 4:** Add tab-strip callback plumbing so each tab item opens the menu at the pointer location without activating the tab or changing its width.

**Step 5:** Run focused UI tests.

### Task 3: Add the optional secondary reading panel

**Files:**
- Modify: `src/ui/layout-controller.ts`
- Modify: `src/ui/styles.ts`
- Modify: `src/app.ts`
- Test: `tests/layout-shell.test.ts`
- Test: `tests/browser/smoke.test.ts`

**Step 1:** Add failing tests for creating/removing exactly one secondary panel, two/three-pane grid areas with a second reading column, independent tab strips, and no duplicate panel after repeated mount.

**Step 2:** Generalize panel creation to primary/secondary ids while preserving the existing toolbar, tab strip, content host, and resize handles. Add `setSecondaryOpen`, secondary getters, and a close-secondary action host.

**Step 3:** Add responsive CSS grid tracks: two-pane mode keeps list before both reading panels; three-pane mode keeps both reading panels before the list; each reading track receives half of the saved reading share. Keep the narrow native fallback.

**Step 4:** Create a second `TopicFramePool` only while the secondary panel is open. Display the session's secondary-owned tabs there, forward preview/config/interaction messages through the same handlers, and destroy the pool when the panel closes.

**Step 5:** Implement the context-menu callback for split view: capture the selected frame state, move the tab id from the primary ownership set into `secondaryTabIds`, transfer or restore its frame in the secondary pool, choose valid active tabs in both panels, persist session, and render both strips. Closing the secondary panel moves its tabs back to the primary panel in order and does not discard them.

**Step 6:** Run layout and browser smoke tests.

### Task 4: Implement tab actions and forum-native bookmark integration

**Files:**
- Modify: `src/app.ts`
- Modify: `src/tabs/frame-pool.ts`
- Modify: `src/frame-bridge.ts`
- Test: `tests/browser/smoke.test.ts`
- Test: `tests/frame-bridge.test.ts`

**Step 1:** Write failing tests for reloading a selected frame, opening a URL with a new browser tab target, copying a URL through the clipboard adapter/fallback, adding the selected topic through the native bookmark button, and closing all non-selected topic tabs.

**Step 2:** Implement reload without creating a second iframe or changing the selected tab; suspended tabs are reactivated before reload.

**Step 3:** Implement new-browser-tab opening with a user-gesture anchor (`target=_blank`, `rel=noopener noreferrer`) and no parent route change.

**Step 4:** Implement copy-link with `navigator.clipboard.writeText` and a temporary textarea fallback; do not log or persist the URL elsewhere.

**Step 5:** Implement bookmark command handling in the embedded topic bridge. Prefer the topic footer bookmark trigger; otherwise open the nearest post's `show-more-actions` and click its bookmark action after the menu renders. Never call the forum bookmark endpoint directly.

**Step 6:** Implement close-other-tabs within the target tab's owning panel, matching browser-tab expectations; preserve tabs in the other reading panel and repair the affected panel's active reference in one render cycle.

### Task 5: Verify, document, and release

**Files:**
- Modify: `README.md`
- Modify: `docs/technical-guide.md`
- Modify: `docs/architecture.md`
- Modify: `dist/linuxdo-ultimate.user.js`

**Step 1:** Document the menu labels, secondary reading panel behavior, forum-native bookmark behavior, and session persistence.

**Step 2:** Run `pnpm test`, `pnpm check`, `pnpm build`, and `git diff --check`.

**Step 3:** Install the build in the logged-in real Chrome（谷歌浏览器）extension（扩展） instance and verify right-click placement, both layout preferences, secondary panel refresh restoration, reload/copy/new-browser-tab actions, bookmark UI, and close-other-tabs. Capture desktop screenshots.

**Step 4:** Commit the feature branch and push after real verification; do not include credentials or unrelated browser artifacts.
