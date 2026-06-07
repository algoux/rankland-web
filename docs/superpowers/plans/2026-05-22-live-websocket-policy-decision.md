# Live WebSocket Policy Decision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record the `/live/:id` WebSocket reconnect policy decision so the migration no longer carries it as an unknown risk.

**Architecture:** This is a documentation-only decision slice. It compares old React and current Vue source behavior, then updates the migration dashboard to mark automatic reconnect as intentionally deferred product work rather than parity debt.

**Tech Stack:** Markdown migration docs, source inspection, git diff verification.

---

## File Structure

- Create `docs/superpowers/specs/2026-05-22-live-websocket-policy-decision-design.md` for the decision.
- Create `docs/superpowers/plans/2026-05-22-live-websocket-policy-decision.md` for execution evidence.
- Modify `docs/migration/status.md` to close the reconnect-policy risk.

## Tasks

### Task 1: Confirm Source Behavior

**Files:**
- Read: `rankland-fe/src/pages/live/[id].tsx`
- Read: `src/client/modules/live/live.view.vue`
- Read: `tests/e2e/full-chain/live.spec.ts`

- [x] **Step 1: Inspect old React WebSocket lifecycle**

Confirm the old React page opens one WebSocket when `scrollSolution=1`, sets `wsError` on `close`/`error`, closes during cleanup, and does not schedule reconnect.

- [x] **Step 2: Inspect current Vue WebSocket lifecycle**

Confirm the Vue page opens one WebSocket when `scrollSolution=1`, maps `close`/`error` to `error`, closes during teardown, and keeps the ranklist visible.

- [x] **Step 3: Inspect existing full-chain coverage**

Confirm the live full-chain spec covers success, browser error, unexpected close, and app-driven close.

### Task 2: Document The Decision

**Files:**
- Create: `docs/superpowers/specs/2026-05-22-live-websocket-policy-decision-design.md`
- Create: `docs/superpowers/plans/2026-05-22-live-websocket-policy-decision.md`

- [x] **Step 1: Write the decision spec**

Record that automatic reconnect is not part of migration parity because the old React page did not reconnect after close/error.

- [x] **Step 2: Write this implementation plan**

Record the source evidence, doc-only verification strategy, and commit boundary.

### Task 3: Update Migration Dashboard

**Files:**
- Modify: `docs/migration/status.md`

- [x] **Step 1: Update current focus**

Set the current slice to `live WebSocket reconnect policy decision`.

- [x] **Step 2: Update live route remaining risk**

Remove `realtime reconnect policy` from the `/live/:id` route remaining-risk cell and replace it with remaining product review/realtime visual polish.

- [x] **Step 3: Update known risks**

Replace the unreviewed reconnect-policy risk with a documented product enhancement deferral for automatic reconnect/backoff.

### Task 4: Verify And Commit

**Files:**
- Add/modify all files from Tasks 2-3.

- [x] **Step 1: Verify reconnect search evidence**

Run:

```bash
rg -n "reconnect|retry|backoff|new WebSocket|addEventListener\\('close'|addEventListener\\('error'" '/Users/cooper/Projects/RankLand/rankland-fe/src/pages/live/[id].tsx' src/client/modules/live/live.view.vue tests/e2e/full-chain/live.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-22-live-websocket-policy-decision-design.md
```

Result: source evidence shows WebSocket construction and close/error handling, with reconnect/backoff only appearing in the new documentation/status as an explicitly deferred product enhancement.

- [x] **Step 2: Check whitespace and diff**

Run:

```bash
git diff --check
git diff -- docs/migration/status.md docs/superpowers/specs/2026-05-22-live-websocket-policy-decision-design.md docs/superpowers/plans/2026-05-22-live-websocket-policy-decision.md
```

Result: `git diff --check` passed; the tracked diff only changes `docs/migration/status.md`, with this new plan and the new decision spec included in the commit scope.

- [x] **Step 3: Commit**

Run:

```bash
git add docs/migration/status.md docs/superpowers/specs/2026-05-22-live-websocket-policy-decision-design.md docs/superpowers/plans/2026-05-22-live-websocket-policy-decision.md
git commit -m "docs: 确认实时榜单 WebSocket 重连策略"
```
