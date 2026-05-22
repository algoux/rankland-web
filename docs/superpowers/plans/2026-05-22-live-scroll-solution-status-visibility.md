# Live Scroll-Solution Status Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the `/live/:id` scroll-solution status label from the visible panel while retaining it as a testable DOM state marker.

**Architecture:** Add a full-chain visibility assertion first, then make a scoped CSS-only change in `live-scroll-solution.vue`. No WebSocket lifecycle, event parsing, queue timing, or route behavior changes are needed.

**Tech Stack:** Vue 3 SFC, scoped Less, Playwright full-chain E2E.

---

## File Structure

- Modify `tests/e2e/full-chain/live.spec.ts` to assert that the status marker is hidden while retaining text.
- Modify `src/client/modules/live/live-scroll-solution.vue` to hide `.live-scroll-solution-status`.
- Modify `docs/migration/status.md` to record the verified slice.

## Tasks

### Task 1: Add failing full-chain visibility coverage

**Files:**
- Modify: `tests/e2e/full-chain/live.spec.ts`

- [x] **Step 1: Assert status text is hidden**

In the main desktop live route test, keep the existing text assertion and add:

```ts
    await expect(page.locator('[data-id="live-scroll-solution-status"]')).toBeHidden();
```

immediately after:

```ts
    await expect(page.locator('[data-id="live-scroll-solution-status"]')).toHaveText('connected');
```

- [x] **Step 2: Run the live full-chain file and confirm red**

Run:

```bash
FULL_CHAIN_APP_PORT=3210 FULL_CHAIN_MOCK_PORT=3211 corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/live.spec.ts
```

Result: failed as expected because the status row was visible.

### Task 2: Hide the status row

**Files:**
- Modify: `src/client/modules/live/live-scroll-solution.vue`

- [x] **Step 1: Apply the minimal CSS change**

Replace the visible status style with:

```less
.live-scroll-solution-status {
  display: none;
}
```

- [x] **Step 2: Re-run the live full-chain file**

Run:

```bash
FULL_CHAIN_APP_PORT=3210 FULL_CHAIN_MOCK_PORT=3211 corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/live.spec.ts
```

Result: passed 5 `/live/:id` full-chain tests, including existing status text assertions.

### Task 3: Update docs and commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/superpowers/plans/2026-05-22-live-scroll-solution-status-visibility.md`

- [x] **Step 1: Update migration status**

Set the current slice to `live scroll-solution status visibility polish`, record the live full-chain gate, and keep the next recommended focus on remaining live product review or app shell/layout parity.

- [x] **Step 2: Check off completed plan tasks**

Result: completed after updating `docs/migration/status.md`.

- [x] **Step 3: Verify diff and commit**

Run:

```bash
git diff --check
git diff -- tests/e2e/full-chain/live.spec.ts src/client/modules/live/live-scroll-solution.vue docs/migration/status.md docs/superpowers/specs/2026-05-22-live-scroll-solution-status-visibility-design.md docs/superpowers/plans/2026-05-22-live-scroll-solution-status-visibility.md
git add tests/e2e/full-chain/live.spec.ts src/client/modules/live/live-scroll-solution.vue docs/migration/status.md docs/superpowers/specs/2026-05-22-live-scroll-solution-status-visibility-design.md docs/superpowers/plans/2026-05-22-live-scroll-solution-status-visibility.md
git commit -m "fix: 隐藏实时榜单内部状态行"
```

Result: `git diff --check` passed and the reviewed diff contained only this slice's test, CSS, and documentation changes.
