# Linux.do Ultimate Userscript Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a modular userscript that adds persistent two-pane and three-pane topic reading, in-page topic tabs, reliable Discourse view tracking, and safe link previews to Linux.do.

**Architecture:** A small TypeScript core owns configuration, session state, routing and topic-view tracking. Browser-facing controllers mount one isolated application shell into Discourse, while same-origin topic frames preserve native forum behavior. Cross-origin previews are static and sanitized; arbitrary third-party scripts never execute in the Linux.do origin.

**Tech Stack:** TypeScript, pnpm, Vitest, esbuild, CSS, Tampermonkey/Violentmonkey userscript APIs, Discourse same-origin pages.

---

### Task 1: Project and build baseline

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `scripts/build.ts`
- Create: `src/main.ts`
- Create: `src/meta.ts`
- Create: `tests/build.test.ts`

**Steps:**
1. Write a failing build test requiring `dist/linuxdo-ultimate.user.js` to contain a userscript header and a bundled entrypoint.
2. Run `pnpm test tests/build.test.ts` and confirm it fails because the build output does not exist.
3. Add the build script using `Bun.build`, prepend the metadata header and write the single userscript artifact.
4. Run `pnpm build` and `pnpm test tests/build.test.ts`.
5. Run `pnpm check` and confirm type checking passes.

### Task 2: Configuration and durable session state

**Files:**
- Create: `src/core/types.ts`
- Create: `src/core/defaults.ts`
- Create: `src/core/storage.ts`
- Create: `src/core/session.ts`
- Create: `tests/session.test.ts`

**Steps:**
1. Write tests for defaults, corrupt-state recovery, version migration, tab deduplication and bounded history.
2. Run `pnpm test tests/session.test.ts` and confirm the tests fail.
3. Implement schema-versioned settings and session records using a storage adapter.
4. Add debounced persistence and a synchronous `pagehide` flush.
5. Re-run the tests and type checking.

### Task 3: Discourse route and topic identification

**Files:**
- Create: `src/discourse/routes.ts`
- Create: `src/discourse/dom.ts`
- Create: `tests/routes.test.ts`

**Steps:**
1. Write route tests for topic, latest, category, tag, search, bookmarks, user and chat URLs.
2. Implement topic ID parsing for `/t/<slug>/<id>/<post>` and `/t/topic/<id>/<post>`.
3. Implement link classification that excludes controls, current-topic links and non-topic routes.
4. Add a mutation-observer route signal with history and `popstate` fallbacks.
5. Re-run all unit tests.

### Task 4: View tracking compatibility module

**Files:**
- Create: `src/discourse/view-tracker.ts`
- Create: `tests/view-tracker.test.ts`

**Steps:**
1. Write tests for pending locks, completed locks, stale lock recovery and cross-tab deduplication.
2. Write request tests proving `/pageview` is attempted first and topic JSON is used only as fallback.
3. Implement Discourse headers, CSRF discovery, session identity and response-header confirmation.
4. Expose explicit sources for split-open, restored-tab and browser-open events.
5. Re-run tests without issuing live tracking requests.

### Task 5: Split layout and space recovery

**Files:**
- Create: `src/ui/styles.ts`
- Create: `src/ui/layout-controller.ts`
- Create: `src/ui/icons.ts`
- Create: `tests/layout.test.ts`

**Steps:**
1. Write layout tests for native, two-pane and three-pane class/state mapping.
2. Mount a single shell outside `#main-outlet` and move no Discourse-owned nodes permanently.
3. Implement three-pane order `sidebar | topic | list` and two-pane order `list group | topic`.
4. Hide the posters column in compact lists and progressively hide secondary metrics as width narrows.
5. Add pointer-captured resize handles with minimum widths and persisted ratios.
6. Respect reduced motion and avoid animation on repeated tab and keyboard actions.

### Task 6: Persistent topic tabs and frame lifecycle

**Files:**
- Create: `src/tabs/tab-store.ts`
- Create: `src/tabs/frame-pool.ts`
- Create: `src/ui/tab-strip.ts`
- Create: `tests/tab-store.test.ts`
- Create: `tests/frame-pool.test.ts`

**Steps:**
1. Write tests for open, activate, close, restore, pin and least-recently-used suspension.
2. Implement stable topic-tab identity and per-tab URL, scroll and post-number state.
3. Use same-origin frames for native Discourse behavior.
4. Keep only the configured number of live frames and rehydrate suspended tabs on demand.
5. Add compact native-looking tabs with icon buttons and accessible labels.
6. Connect topic-link interception only on supported list/search/bookmark surfaces.

### Task 7: Safe hover preview

**Files:**
- Create: `src/preview/sanitizer.ts`
- Create: `src/preview/preview-controller.ts`
- Create: `tests/sanitizer.test.ts`
- Create: `tests/preview.test.ts`

**Steps:**
1. Write sanitization tests for scripts, event attributes, forms, refresh directives and unsafe URLs.
2. Implement interactive same-origin preview and static cross-origin preview.
3. Preserve base URLs for images and links without preserving executable scripts.
4. Add bounded least-recently-used cache with abortable requests.
5. Add single/double-click policy without stealing modified clicks or editable-area input.

### Task 8: Settings and user documentation

**Files:**
- Create: `src/ui/settings-panel.ts`
- Create: `README.md`
- Create: `docs/architecture.md`
- Create: `docs/testing.md`
- Create: `docs/troubleshooting.md`

**Steps:**
1. Add one compact settings entry and an anchored panel matching Discourse colors and spacing.
2. Expose layout mode, tab management, preview policy, live-frame limit and reset controls.
3. Document installation, permissions, privacy, configuration and recovery.
4. Document module ownership and invariants for future maintenance.
5. Re-run tests, type checking and build.

### Task 9: Runtime verification

**Files:**
- Create: `fixtures/discourse-list.html`
- Create: `fixtures/discourse-topic.html`
- Create: `tests/browser/smoke.test.ts`

**Steps:**
1. Build local list and topic fixtures covering sidebar, table, composer and timeline geometry.
2. Verify both layouts, tab restoration, compact columns and narrow viewport fallback in automated browser tests.
3. Inspect screenshots at 1920x1080, 1440x900 and 1100x800.
4. Install the built script in a test userscript profile only after explicit user confirmation.
5. Verify Linux.do navigation without sending replies, reactions or manual tracking requests.

### Completion gates

- `pnpm test` passes.
- `pnpm check` passes.
- `pnpm build` emits one installable userscript.
- Refresh restores the list route, active tab, open tabs, split mode and widths.
- Three-pane and two-pane layouts remain usable at their supported breakpoints.
- View tracking retains the `/pageview` then topic-JSON fallback contract.
- External preview content cannot execute scripts or submit forms.
- Documentation explains installation, permissions, architecture and recovery.
