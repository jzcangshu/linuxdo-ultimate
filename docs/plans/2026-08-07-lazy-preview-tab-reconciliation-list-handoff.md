# Lazy Preview, Tab Reconciliation, and List Handoff Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce idle preview work and repeated tab DOM creation while making the first native-list-to-split transition visually continuous.

**Architecture:** Keep the existing v0.2 host, list iframe, and topic iframe architecture. Delay installation of the vendored preview runtime until the feature is enabled, reconcile tab nodes by stable tab ID, and temporarily move the existing top-level list outlet into the split list pane until the new list iframe is ready or a short fallback deadline expires.

**Tech Stack:** TypeScript, DOM, same-origin iframe, Vitest, jsdom, esbuild.

---

### Task 1: Lazy preview initialization

**Files:**
- Modify: `src/preview/upstream-preview-controller.ts`
- Modify: `src/app.ts`
- Test: `tests/upstream-preview.test.ts`

**Steps:**
1. Add a regression test proving that `mount()` does not install the upstream runtime while preview is disabled, then installs it once after enablement.
2. Guard preview installation with the current enabled setting and make frame-open and click-mode synchronization initialize it on demand.
3. In settings application, mount the preview runtime when preview changes to enabled.
4. Run the focused preview tests.

### Task 2: Keyed tab-strip reconciliation

**Files:**
- Modify: `src/tabs/tab-strip.ts`
- Test: `tests/tab-strip.test.ts`

**Steps:**
1. Add a regression test proving repeated renders preserve existing tab and button node identity while updating title, active state, colors, callbacks, and order.
2. Store current tab data and callbacks per strip in a `WeakMap`.
3. Create listeners only for new tab nodes; make them resolve current state at event time.
4. Remove stale nodes, create missing nodes, move nodes only when order changed, and update attributes in place.
5. Run tab-strip tests, including drag ordering and keyboard navigation.

### Task 3: Native list handoff during first split

**Files:**
- Modify: `src/ui/layout-controller.ts`
- Modify: `src/ui/styles.ts`
- Modify: `src/app.ts`
- Test: `tests/layout-shell.test.ts`
- Test: `tests/browser/smoke.test.ts`

**Steps:**
1. Add layout tests proving the current `#main-outlet` can be temporarily hosted in the list pane and is restored to its exact original DOM position.
2. Add a layout-owned handoff record containing the outlet, original parent, next sibling, and scroll position.
3. During the first user-initiated topic open from a split-capable non-topic route, save top-level scroll, start the list iframe and topic iframe in parallel, move the live original outlet into the list pane, and open the split shell immediately.
4. Keep the list iframe hidden only during handoff; complete the handoff on `ldu:list-ready` after requesting scroll restoration.
5. Add a three-second fallback that restores the original outlet and reveals the list iframe even if readiness never arrives.
6. Ensure split teardown always cancels the timer and restores a pending outlet.
7. Run layout and browser smoke tests.

### Task 4: Release verification

**Files:**
- Modify: `package.json`
- Modify: `CHANGELOG.md`
- Modify: `docs/technical-guide.md`
- Rebuild: `dist/linuxdo-ultimate.user.js`

**Steps:**
1. Bump the patch version to `0.2.10` and document the three behavior-preserving optimizations.
2. Run `pnpm test`, `pnpm check`, `pnpm build`, and `git diff --check`.
3. Confirm the distribution contains no credentials or environment files.
4. Commit and push the maintenance branch.
