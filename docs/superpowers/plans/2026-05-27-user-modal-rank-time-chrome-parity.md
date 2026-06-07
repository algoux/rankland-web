# User Modal Rank-Time Chrome Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React user-modal rank-time chrome by removing Vue-only text/chip wrappers while preserving the verified G2 chart.

**Architecture:** This is a focused SRK wrapper template/CSS parity slice. The data and chart component stay unchanged; the parent modal returns to the old `div.mt-4` visual contract.

**Tech Stack:** Vue 3 SFC, LESS, Playwright full-chain E2E, RankLand migration docs.

---

### Task 1: Write the Failing Full-Chain Test

**Files:**
- Modify: `tests/e2e/full-chain/live.spec.ts`

- [ ] **Step 1: Replace Vue-only chrome assertions**

In the user modal rank-time section, assert that old React did not render unit text, summary text, or solved-event chips, and assert the wrapper spacing:

```ts
await expect(userModal.locator('[data-id="rankland-rank-time-panel"]')).toBeVisible();
await expect(userModal.locator('[data-id="rankland-rank-time-unit"]')).toHaveCount(0);
await expect(userModal.locator('[data-id="rankland-rank-time-summary"]')).toHaveCount(0);
await expect(userModal.locator('[data-id="rankland-rank-time-event"]')).toHaveCount(0);
expect(
  await userModal.locator('[data-id="rankland-rank-time-panel"]').evaluate((element) => {
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

- [ ] **Step 2: Verify RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts --grep "renders realtime ranklist updates"
```

Expected: FAIL because `rankland-rank-time-unit` and `rankland-rank-time-event` still exist, or because the panel still computes `20px`/`16px`/`1px`.

### Task 2: Restore the Vue Template and CSS

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [ ] **Step 1: Remove Vue-only rank-time DOM**

Replace the current panel content with only the chart component:

```vue
<div
  v-if="activeUserRankTimeData"
  data-id="rankland-rank-time-panel"
  class="rankland-rank-time-panel"
>
  <RanklandRankTimeChart :rank-time-data="activeUserRankTimeData" />
</div>
```

- [ ] **Step 2: Restore old wrapper spacing**

Set `.rankland-rank-time-panel` to:

```less
.rankland-rank-time-panel {
  margin-top: 16px;
}
```

Delete `.rankland-rank-time-header`, `.rankland-rank-time-summary`, `.rankland-rank-time-events`, and `.rankland-rank-time-event` rules because their DOM no longer exists.

- [ ] **Step 3: Verify GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts --grep "renders realtime ranklist updates"
```

Expected: PASS.

### Task 3: Update Migration Records and Gate

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [ ] **Step 1: Record the verified slice**

Mention that the user modal rank-time panel now matches old React chrome: chart-only `mt-4` wrapper, no extra unit/summary/event chrome, G2 chart behavior preserved.

- [ ] **Step 2: Run the completed-slice gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node 24, pnpm 8, router generation succeeds, migration tests pass, and whitespace check passes.

- [ ] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/live.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-user-modal-rank-time-chrome-parity-design.md docs/superpowers/plans/2026-05-27-user-modal-rank-time-chrome-parity.md
git commit -m "fix: 还原用户弹窗排名时间图表外壳"
```
