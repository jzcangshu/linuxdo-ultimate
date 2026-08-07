# Embedded Style Split and Category Map Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the full host stylesheet from managed list/topic iframes and use a stable primary-category color map without changing page behavior.

**Architecture:** Keep the existing host stylesheet intact for the top-level split shell. Add a small embedded stylesheet containing only shared variables and list/topic document rules, and inject it through an explicit embedded-style helper. Replace repeated sidebar computed-style scanning with a static primary-category lookup; persisted topic metadata remains authoritative when present.

**Tech Stack:** TypeScript（类型脚本语言）, Vitest（测试框架）, jsdom（浏览器环境模拟器）, pnpm（包管理器）.

---

### Task 1: Define separate host and embedded style entry points

**Files:**
- Modify: `src/ui/styles.ts`
- Modify: `src/frame-bridge.ts`
- Test: `tests/styles.test.ts`

**Step 1: Add style boundary tests**

Verify that the embedded stylesheet retains header/sidebar hiding, list scrolling, poster hiding, topic width, timeline, and footer controls, while the host stylesheet retains the split shell and settings styles.

**Step 2: Implement explicit injection**

Add a separate embedded style ID and `ensureEmbeddedStyles` helper. Use it from list/topic bridges after the embedded marker is set. The host keeps calling `ensureAppStyles`.

**Step 3: Run style and bridge tests**

Run `pnpm test -- tests/styles.test.ts tests/frame-bridge.test.ts tests/list-frame-bridge.test.ts` and expect all tests to pass.

### Task 2: Replace sidebar color scanning with a stable primary-category map

**Files:**
- Modify: `src/tabs/tab-strip.ts`
- Test: `tests/tab-strip.test.ts`

**Step 1: Add mapping tests**

Verify primary categories resolve to their fixed colors, nested category titles prefer the primary category, and unknown categories remain uncolored unless persisted metadata exists.

**Step 2: Implement the minimal lookup**

Add the current Linux Do primary category color map and match names in shortest-first order. Keep the existing title matching forms and function signature; do not read computed styles or scan the sidebar.

**Step 3: Run tab tests**

Run `pnpm test -- tests/tab-strip.test.ts` and expect all tab tests to pass.

### Task 3: Version and verify the release

**Files:**
- Modify: `package.json`
- Modify: `CHANGELOG.md`
- Modify: `dist/linuxdo-ultimate.user.js`

**Step 1: Bump the patch version**

Change `0.2.6` to `0.2.7` and document the style split and fixed primary-category lookup.

**Step 2: Run the full verification suite**

Run `pnpm build`, `pnpm test`, `pnpm check`, and `git diff --check`. Expect all tests and the build header check to pass.

**Step 3: Commit the release**

Commit the focused changes. Do not change routing, iframe navigation, preview loading, view tracking, or session persistence.
