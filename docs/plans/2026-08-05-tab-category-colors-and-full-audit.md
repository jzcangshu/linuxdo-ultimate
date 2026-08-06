# Tab Category Colors and Full Audit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Color topic tabs from the forum's live sidebar category palette, reconcile all earlier fixes, and verify common and uncommon Linux Do routes plus reading-count behavior.

**Architecture:** Resolve a topic's category by matching its final document title against current sidebar category labels, then read the category icon's computed color and expose it as a per-tab CSS variable. Keep the tint presentation-only so no session schema migration is needed. Audit prior requirements from documentation and tests, then exercise the installed 0.1.10 build on real pages before validating the new color build automatically.

**Tech Stack:** TypeScript, CSS color-mix, Discourse DOM, Vitest/jsdom, Chrome extension browser session.

---

### Task 1: Category color resolver

**Files:**
- Modify: `src/tabs/tab-strip.ts`
- Test: `tests/tab-strip.test.ts`

**Steps:**
1. Add failing tests for exact parent-category matching, longest-name preference, and missing-category fallback.
2. Run the focused test and confirm failure.
3. Read `.sidebar-section-link-prefix.icon` computed color from the matching `/c/` sidebar link.
4. Apply the result as `--ldu-tab-category-color` without storing color values.

### Task 2: Semi-transparent tab styling

**Files:**
- Modify: `src/ui/styles.ts`
- Test: `tests/styles.test.ts`

**Steps:**
1. Add failing style assertions for category-tinted normal and active tabs.
2. Use `color-mix` with transparent/surface fallbacks and a restrained category edge indicator.
3. Preserve active state, text contrast, hover feedback, stable dimensions, and reduced-motion behavior.

### Task 3: Previous checklist reconciliation

**Files:**
- Modify: `docs/requirements-audit.md`
- Verify: all existing tests and implementation modules

**Steps:**
1. Cross-reference the former 11-item hardening plan and later bug table with current code and regression tests.
2. Mark each item complete, partially verified, or requiring real-page confirmation; do not claim unsupported results.
3. Include the newer direct-topic, sidebar-navigation, preview-handshake, settings, and memory fixes.

### Task 4: Full automated and real-page audit

**Files:**
- Verify: `tests/*`, `src/*`, `dist/linuxdo-ultimate.user.js`

**Steps:**
1. Run all tests, type checking, build, and whitespace checks.
2. Test the installed 0.1.10 build on homepage, category, search, user activity, bookmarks/read lists, direct topic entry, sidebar transitions, multiple topic tabs, embedded topic links, preview controls, image lightbox exclusions, and settings dependencies.
3. Inspect console errors, iframe count, tab count, route stability, and repeated navigation behavior.
4. Verify the reading-count request algorithm automatically and inspect real-page requests without manually replaying or fabricating pageviews.
5. Report newly discovered corner cases separately from completed checklist items.
