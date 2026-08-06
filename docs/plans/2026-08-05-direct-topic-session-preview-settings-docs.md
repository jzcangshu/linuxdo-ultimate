# Direct Topic, Session, Preview, Settings, and Docs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make every direct topic visit enter split reading reliably, make session restoration opt-in, harden preview configuration for newly created embedded pages, refine settings hierarchy, and publish user and maintainer documentation.

**Architecture:** A short-lived `sessionStorage` handoff converts a top-level topic route into the forum home list plus the originally requested topic tab. Settings migrate to schema version 2 so old installations adopt the new non-restoring default once, while explicit later choices remain stable. The embedded-page preview bridge uses a child-ready/parent-config handshake instead of relying only on iframe load timing.

**Tech Stack:** TypeScript, Tampermonkey userscript APIs, Discourse DOM and routes, Vitest with jsdom, esbuild, CSS.

---

### Task 1: Settings defaults and migration

**Files:**
- Modify: `src/core/types.ts`
- Modify: `src/core/defaults.ts`
- Test: `tests/storage.test.ts`

**Steps:**
1. Add failing tests proving fresh and schema-version-1 settings disable session restoration and re-enable the internal script flag.
2. Run `pnpm test -- tests/storage.test.ts` and confirm the new assertions fail.
3. Upgrade settings schema to version 2 and implement one-time migration while preserving explicit version-2 choices.
4. Run the focused test and confirm it passes.

### Task 2: Direct topic startup handoff

**Files:**
- Create: `src/discourse/direct-topic-handoff.ts`
- Modify: `src/app.ts`
- Test: `tests/direct-topic-handoff.test.ts`

**Steps:**
1. Add failing tests for writing, consuming, expiring, and rejecting malformed pending-topic handoffs.
2. Run `pnpm test -- tests/direct-topic-handoff.test.ts` and confirm failure.
3. Implement a short-lived session handoff and integrate it before normal top-level app initialization.
4. On a direct topic route with split mode enabled, store the topic, replace the top-level route with `/`, then consume and open it after the real list layout mounts.
5. Ensure the directly requested topic is appended and activated whether or not optional restoration is enabled.
6. Run focused route, storage, and handoff tests.

### Task 3: Embedded preview handshake

**Files:**
- Modify: `src/tabs/frame-pool.ts`
- Test: `tests/frame-pool.test.ts`
- Verify: `tests/frame-bridge.test.ts`

**Steps:**
1. Add a failing test proving a managed iframe receives the current preview configuration whenever it sends `ldu:frame-ready`.
2. Run the focused test and confirm failure.
3. Reply to the validated ready message before forwarding it to application state handling.
4. Run both preview bridge test files and confirm single-click, double-click, image-lightbox, and topic-link behavior remains correct.

### Task 4: Settings information architecture

**Files:**
- Modify: `src/ui/settings-panel.ts`
- Modify: `src/ui/styles.ts`
- Test: `tests/settings-panel.test.ts`
- Test: `tests/styles.test.ts`

**Steps:**
1. Add failing assertions for the requested title, section names, labels, removal of the visible master switch, and dependent-row visibility.
2. Run focused settings tests and confirm failure.
3. Move “启用分屏模式” into layout, revise all requested labels, and add stable dependency markers.
4. Synchronize dependent rows after mounting, external setting updates, resets, and user changes.
5. Increase section-title typography above setting-row typography and preserve responsive, non-wrapping controls.
6. Run focused settings and style tests.

### Task 5: User and maintainer documentation

**Files:**
- Modify: `README.md`
- Create: `docs/technical-guide.md`

**Steps:**
1. Rewrite the README for ordinary users with only core behavior, installation, settings, privacy, acknowledgements, and a link to the technical guide.
2. Credit the reading-count repair script, floating-link-preview script, and `LINUX DO Credit 积分` script by `@Chenyme` without claiming authorship of their mechanisms.
3. Document architecture, direct-topic startup, schemas and migration, iframe protocol, preview boundaries, tracking, credit requests, scrolling constraints, testing, release, extension points, limitations, and troubleshooting in the technical guide.

### Task 6: Release verification

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Build: `dist/linuxdo-ultimate.user.js`

**Steps:**
1. Bump the release version to 0.1.9.
2. Run `pnpm test`, `pnpm check`, `pnpm build`, and `git diff --check`.
3. Install the built userscript in the user's connected Chrome session, then test direct topic entry, both restoration states, and fresh-tab preview behavior on real Linux Do pages.
4. Capture screenshots of split layout and the settings panel at desktop size and inspect typography, spacing, conditionals, wrapping, and overlap.
5. Report any browser-only limitation honestly; do not trigger posts, reactions, or donation payments during verification.
