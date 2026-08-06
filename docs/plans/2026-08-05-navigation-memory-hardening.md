# Navigation and Memory Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Keep an existing split reader open across all non-topic forum navigation, make direct topic startup reliable, and remove avoidable listener and retry leaks without reducing normal tab capacity.

**Architecture:** Separate “should the current split remain visible” from “should an old session be restored”. A mounted split with current tabs remains open on every non-topic route, while topic routes are converted through a bounded handoff and retried until the real list host is mounted. Lifecycle cleanup removes redundant per-activation listeners and bounds route retries and temporary state.

**Tech Stack:** TypeScript, Discourse SPA（单页应用）routes, sessionStorage（会话存储）, iframe（内嵌页面）, Vitest/jsdom.

---

### Task 1: Lock down route-state invariants

**Files:**
- Modify: `tests/browser/smoke.test.ts`
- Create: `tests/app-routing.test.ts`

**Steps:**
1. Add failing tests for retaining the topic panel when a current tab exists and the route changes to a category or user page.
2. Add a failing test for retrying pending direct-topic consumption after an initially unavailable layout host.
3. Run the focused tests and confirm failure against the current `restoreSession`-coupled logic.

### Task 2: Separate current tabs from restoration and broaden list-host routing

**Files:**
- Modify: `src/app.ts`
- Modify: `src/discourse/routes.ts` only if route helper coverage is required

**Steps:**
1. Track whether tabs were loaded from an old session separately from whether the current session has tabs.
2. Keep the split panel open for all non-topic routes when tabs exist; do not close it merely because `restoreSession` is false.
3. Remove the split-route gate from ordinary topic-link interception when the current page is a non-topic forum route.
4. Preserve native controls, sidebar operation, chat controls, and modified/new-tab clicks through the existing exclusions.
5. Add a bounded retry path for direct-topic handoff until `#main-outlet-wrapper` and `#main-outlet` are available; consume the handoff only after successful mount.

### Task 3: Remove avoidable per-activation listeners

**Files:**
- Modify: `src/app.ts`
- Test: `tests/app-routing.test.ts` or `tests/frame-pool.test.ts`

**Steps:**
1. Add a regression assertion that activating an already loaded tab does not add another load listener.
2. Remove the redundant scroll-restoration load listener; use the existing `ldu:frame-ready` state path for restoration.
3. Verify suspended frames are restored once and active frames remain bounded by `maxLiveFrames`.

### Task 4: Memory and event lifecycle audit

**Files:**
- Modify: `src/app.ts`
- Modify: `src/ui/settings-panel.ts` only if lifecycle teardown is needed
- Modify: `src/preview/preview-controller.ts` only if request/cache cleanup evidence requires it

**Steps:**
1. Ensure route retry timers, topic tracking timers, persistence timers, and observers cannot multiply across route changes.
2. Ensure preview requests are aborted and bounded cache entries are released on close.
3. Add focused assertions for timer cleanup and bounded caches where practical; do not reduce user-configured tab capacity.

### Task 5: Release and real-page verification

**Files:**
- Modify: `package.json` if the patch increments the release version
- Build: `dist/linuxdo-ultimate.user.js`

**Steps:**
1. Run `pnpm test`, `pnpm check`, `pnpm build`, and `git diff --check`.
2. Ask the user to install the new build and refresh the real Linux Do page.
3. Verify category/sidebar navigation, user-page navigation, direct topic URL, topic links opened from the list and embedded post, preview in newly opened tabs, and layout screenshots.
4. Inspect console errors and tab/iframe counts after repeated open, switch, close, and navigation cycles.
