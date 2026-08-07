# Soft Freeze Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Quiesce hidden live topic frames without unloading their documents, while preserving the existing hard-suspension limit.

**Architecture:** `TopicFramePool` remains the lifecycle authority and sends an idempotent active/inactive message whenever a live frame changes visibility. The topic frame bridge disconnects only project-owned observers and pending timers while inactive, then reconnects and emits one current state on resume. Existing frame removal, routing, preview, bookmarking, reading tracking, and session persistence remain unchanged.

**Tech Stack:** TypeScript, Vitest, jsdom, pnpm.

---

### Task 1: Parent frame lifecycle messages

**Files:**
- Modify: `src/tabs/frame-pool.ts`
- Test: `tests/frame-pool.test.ts`

**Steps:**
1. Add failing tests that switching tabs freezes the previous frame and resumes the selected frame without replacing either iframe.
2. Add a desired soft-frozen flag to each live frame record.
3. Send lifecycle state after visibility changes and after frame readiness so early messages cannot be lost.
4. Run `pnpm test -- tests/frame-pool.test.ts`.

### Task 2: Topic bridge quiescence

**Files:**
- Modify: `src/frame-bridge.ts`
- Test: `tests/frame-bridge.test.ts`

**Steps:**
1. Add failing tests for idempotent freeze/resume, cancelled delayed reports, retained iframe content, and resumed metadata reporting.
2. Retain the metadata observer so it can be disconnected and reconnected.
3. On freeze, cancel project-owned timers and pause currently running media/animations; on resume, restore those resources and emit one fresh state.
4. Keep bookmark and preview configuration messages available while frozen.
5. Run `pnpm test -- tests/frame-bridge.test.ts tests/frame-pool.test.ts`.

### Task 3: Release verification

**Files:**
- Modify: `package.json`
- Modify: `CHANGELOG.md`
- Modify: `dist/linuxdo-ultimate.user.js`

**Steps:**
1. Bump the patch version and document the two-level lifecycle.
2. Run `pnpm build`, `pnpm test`, `pnpm check`, and `git diff --check`.
3. Commit and push the maintenance branch.
