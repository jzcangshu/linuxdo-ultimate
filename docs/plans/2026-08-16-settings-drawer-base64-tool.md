# Settings Drawer And Base64 Tool Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the settings popover into a scrollable right-side drawer and add a persistent draggable Base64 utility launched from Discourse's selected-text toolbar with the current selection prefilled.

**Architecture:** Keep the settings markup and state logic intact while changing only its shell geometry: the panel becomes a fixed right drawer, its body owns vertical scrolling, and its header/footer remain visible. Add a focused `Base64ToolController` that observes the native `post-text-selection-toolbar`, injects one native-style button, remembers the latest non-empty selection, and owns one independent draggable dialog per document; install it through the existing topic-tools runtime so both direct topics and embedded topic frames receive the feature.

**Tech Stack:** TypeScript, DOM APIs, CSS, Vitest, jsdom, esbuild.

---

### Task 1: Specify the settings drawer contract

**Files:**
- Modify: `tests/settings-panel.test.ts`
- Modify: `tests/styles.test.ts`

**Step 1:** Add a settings-panel test that verifies the panel identifies itself as a right-side drawer and continues to use the existing icon toggle, close button, and Escape behavior.

**Step 2:** Replace the old compact-popover style assertions with exact drawer guarantees: fixed top/right/bottom edges, viewport-safe width, hidden horizontal overflow, scrollable `.dc-body`, and non-scrolling header/footer.

**Step 3:** Run the focused tests and confirm they fail against the current popover implementation.

### Task 2: Implement the settings drawer

**Files:**
- Modify: `src/ui/settings-panel.ts`
- Modify: `src/ui/styles.ts`

**Step 1:** Add drawer semantics to the existing panel without changing settings controls or persistence.

**Step 2:** Convert the shell to a right-edge drawer using transform and opacity entry motion under 300ms, make `.dc-modal` fill the drawer, give `.dc-body` `min-height: 0` and `overflow-y: auto`, and keep header/footer at `flex: none`.

**Step 3:** Add mobile-safe width and reduced-motion handling, then rerun the focused settings/style tests.

### Task 3: Specify Base64 behavior

**Files:**
- Create: `tests/base64-tool.test.ts`

**Step 1:** Add tests for injecting exactly one `Base64工具` button into the native selection toolbar after Discourse rerenders it.

**Step 2:** Add tests that opening the tool prefills the latest selected text, stays open after unrelated page clicks, closes only through its close button or Escape, and never creates duplicate dialogs.

**Step 3:** Add Unicode round-trip tests, invalid Base64 decode feedback, clear/copy controls, and pointer-drag clamping within the viewport.

**Step 4:** Run the focused test and confirm the module is missing.

### Task 4: Build and integrate the Base64 utility

**Files:**
- Create: `src/ui/base64-tool.ts`
- Modify: `src/discourse/topic-tools.ts`
- Modify: `src/ui/styles.ts`
- Modify: `tests/topic-tools.test.ts`

**Step 1:** Implement UTF-8-safe encode/decode helpers using `TextEncoder`, `TextDecoder`, `btoa`, and `atob`; reject malformed input rather than silently returning damaged text.

**Step 2:** Implement a controller that caches non-empty selections on `selectionchange` and pointer/keyboard completion, observes the native toolbar, injects a Discourse-compatible flat button, and opens a single persistent dialog.

**Step 3:** Build the dialog with a draggable header, input/output text areas, segmented encode/decode actions, copy, clear, status feedback, focus handling, and viewport clamping. Outside pointer events must not close it.

**Step 4:** Add shared host/embedded styles that visually follow the inspected Discourse toolbar and current theme variables, while keeping the dialog readable on narrow screens and respecting reduced motion.

**Step 5:** Start/stop the controller through `TopicToolsController` so direct topic pages and split-view topic iframes share the same lifecycle.

**Step 6:** Run Base64, topic-tools, styles, and settings tests.

### Task 5: Verify the deliverable

**Files:**
- Modify: `README.md`
- Modify: `docs/technical-guide.md`
- Modify: `CHANGELOG.md`

**Step 1:** Document the right-side settings drawer and selected-text Base64 workflow in concise user-facing language.

**Step 2:** Run `pnpm test`, `pnpm check`, `pnpm build:all`, and `git diff --check`.

**Step 3:** Review the built output for secret-like values and ensure no `.env` file or browser state is included.

**Step 4:** Load the local extension build in the connected Chrome session only if it is already installed as a development extension; otherwise verify with the repository's fixture/browser tests and report the remaining manual-install check.
