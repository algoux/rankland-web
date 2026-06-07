# User Modal Markers Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React `mt-2` class token on the user modal markers row in the Vue SRK wrapper.

**Architecture:** Keep the existing migrated `.rankland-user-modal-markers` hook and old `.user-modal-info-markers` hook. Add only the missing utility class token and verify it through the existing Ranklist full-chain user modal scenario.

**Tech Stack:** Vue 3 SFC, Playwright full-chain E2E, RankLand migration docs.

---

### Task 1: Capture RED Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [ ] **Step 1: Add marker-row assertions before marker label assertions**

```ts
const markerRow = userModal.locator('.user-modal-info-markers');
await expect(markerRow).toHaveClass(/(^|\s)mt-2(\s|$)/);
const markerRowStyle = await markerRow.evaluate((element) => {
  const style = window.getComputedStyle(element);
  return {
    display: style.display,
    marginTop: style.marginTop,
  };
});
expect(markerRowStyle).toMatchObject({
  display: 'block',
  marginTop: '8px',
});
```

- [ ] **Step 2: Run the focused full-chain test and verify RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Expected: FAIL because the marker-row class is currently `rankland-user-modal-markers user-modal-info-markers` and does not include `mt-2`.

### Task 2: Restore Vue Class Token

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [ ] **Step 1: Add the old utility class to the marker-row container**

```vue
<div v-if="activeUserMarkerLabels.length > 0" class="rankland-user-modal-markers user-modal-info-markers mt-2">
```

- [ ] **Step 2: Run the focused full-chain test and verify GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Expected: PASS.

### Task 3: Update Migration Records And Gate

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [ ] **Step 1: Record the verified marker-row class parity slice**

Update the dashboard, acceptance checklist, and final review to mention old `user-modal-info-markers mt-2` marker-row class parity and its computed spacing coverage.

- [ ] **Step 2: Run the full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: PASS with Node 24, pnpm 8, generated client routes, migration test suite, and whitespace check.

- [ ] **Step 3: Commit the verified slice**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-user-modal-markers-class-parity-design.md docs/superpowers/plans/2026-05-27-user-modal-markers-class-parity.md
git commit -m "fix: 还原用户弹窗旧版标记行类名"
```
