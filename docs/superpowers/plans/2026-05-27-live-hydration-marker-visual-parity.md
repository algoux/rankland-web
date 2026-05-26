# Live Hydration Marker Visual Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the `/live/:id` CSR hydration marker from the product UI while preserving the test probe contract.

**Architecture:** Keep the existing marker element and `hydrated` text, then constrain its CSS to the hidden marker pattern already used by migrated CSR pages. Use Playwright computed-style assertions to prevent the marker from reappearing.

**Tech Stack:** Vue 3 SFC, ant-design-vue live page, Playwright full-chain tests, RankLand migration docs.

---

### Task 1: Focused Failing Test

**Files:**
- Modify: `tests/e2e/full-chain/live.spec.ts`

- [x] Add computed-style assertions after the existing `live-hydrated` text assertion in the main hydration test:

```ts
await expect(page.locator('[data-id="live-hydrated"]')).toHaveCSS('width', '1px');
await expect(page.locator('[data-id="live-hydrated"]')).toHaveCSS('height', '1px');
await expect(page.locator('[data-id="live-hydrated"]')).toHaveCSS('overflow', 'hidden');
await expect(page.locator('[data-id="live-hydrated"]')).toHaveCSS('color', 'rgba(0, 0, 0, 0)');
```

- [x] Run the focused test and verify RED:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts --grep "hydrates the CSR live page"
```

Expected: FAIL because the current marker has visible dimensions or visible gray text.

### Task 2: Minimal Vue Style Fix

**Files:**
- Modify: `src/client/modules/live/live.view.vue`

- [x] Change `.live-hydrated` to the hidden marker style:

```less
.live-hydrated {
  width: 1px;
  height: 1px;
  overflow: hidden;
  color: transparent;
}
```

- [x] Run the focused test and verify GREEN:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts --grep "hydrates the CSR live page"
```

Expected: PASS.

- [x] Run the full live full-chain spec:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts
```

Expected: PASS.

### Task 3: Migration Documentation

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] Update the dashboard current slice and latest slice commit target to `live hydration marker visual parity` / `fix: 隐藏实时榜单水合标记`.
- [x] Add `/live/:id` hidden hydration marker coverage to route status and coverage.
- [x] Add the live checklist item: `测试用 hydration marker 不作为可见产品文本展示`.
- [x] Refresh final gate wording after verification.

### Task 4: Final Verification And Commit

**Files:**
- All modified files in this slice.

- [x] Run the full migration gate:

```bash
node -v
corepack pnpm -v
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, route generation clean, migration tests pass, whitespace check passes.

- [x] Stage and verify the staged diff:

```bash
git add tests/e2e/full-chain/live.spec.ts src/client/modules/live/live.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-live-hydration-marker-visual-parity-design.md docs/superpowers/plans/2026-05-27-live-hydration-marker-visual-parity.md
git diff --cached --check
```

Expected: PASS.

- [x] Commit:

```bash
git commit -m "fix: 隐藏实时榜单水合标记"
```
