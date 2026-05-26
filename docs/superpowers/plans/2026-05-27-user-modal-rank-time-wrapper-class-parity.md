# User Modal Rank-Time Wrapper Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React `mt-4` class token on the user modal rank-time panel in the Vue SRK wrapper.

**Architecture:** Keep the existing migrated `.rankland-rank-time-panel` hook and chart-only rank-time implementation. Add only the missing utility class token and verify it through the existing live full-chain user modal rank-time scenario.

**Tech Stack:** Vue 3 SFC, Playwright full-chain E2E, RankLand migration docs.

---

### Task 1: Capture RED Coverage

**Files:**
- Modify: `tests/e2e/full-chain/live.spec.ts`

- [ ] **Step 1: Add rank-time panel class assertion**

```ts
const rankTimePanel = userModal.locator('[data-id="rankland-rank-time-panel"]');
await expect(rankTimePanel).toBeVisible();
await expect(rankTimePanel).toHaveClass(/(^|\s)mt-4(\s|$)/);
```

- [ ] **Step 2: Reuse the same locator for computed style coverage**

```ts
expect(
  await rankTimePanel.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      marginTop: style.marginTop,
      paddingTop: style.paddingTop,
      borderTopWidth: style.borderTopWidth,
    };
  }),
).toEqual({
  marginTop: '16px',
  paddingTop: '0px',
  borderTopWidth: '0px',
});
```

- [ ] **Step 3: Run the focused full-chain test and verify RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts --grep "hydrates the CSR live page"
```

Expected: FAIL because the rank-time panel class is currently `rankland-rank-time-panel` and does not include `mt-4`.

### Task 2: Restore Vue Class Token

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [ ] **Step 1: Add the old utility class to the rank-time panel**

```vue
class="rankland-rank-time-panel mt-4"
```

- [ ] **Step 2: Run the focused full-chain test and verify GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts --grep "hydrates the CSR live page"
```

Expected: PASS.

### Task 3: Update Migration Records And Gate

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [ ] **Step 1: Record the verified rank-time wrapper class parity slice**

Update the dashboard, acceptance checklist, and final review to mention old rank-time `mt-4` wrapper class parity and computed chart-only spacing coverage.

- [ ] **Step 2: Run the full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: PASS with Node 24, pnpm 8, generated client routes, migration test suite, and whitespace check.

- [ ] **Step 3: Commit the verified slice**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/live.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-user-modal-rank-time-wrapper-class-parity-design.md docs/superpowers/plans/2026-05-27-user-modal-rank-time-wrapper-class-parity.md
git commit -m "fix: 还原用户弹窗旧版排名曲线外壳类名"
```
