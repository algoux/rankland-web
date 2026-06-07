# Playground Preview Filter Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `SrkPlayground` preview filter behavior in the Vue Playground route.

**Architecture:** Keep the shared `RanklandRanklist` wrapper unchanged and use its existing `name` and `showFilter` props from `playground.view.vue`. Verify through full-chain Playwright because the behavior depends on Monaco readiness and real browser rendering.

**Tech Stack:** Vue 3 Options API, Ant Design Vue filter controls, Playwright full-chain E2E.

---

### Task 1: Red Test

**Files:**
- Modify: `tests/e2e/full-chain/playground.spec.ts`

- [x] **Step 1: Add preview filter assertions**

In the `hydrates the CSR playground and previews bundled SRK without upstream calls` test, assert:

```ts
await expect(page.locator('[data-id="rankland-ranklist-filters"]')).toBeVisible();
await expect(page.locator('[data-id="rankland-ranklist-organization-filter"]')).toHaveClass(/ant-select/);
await expect(page.locator('[data-id="rankland-ranklist-official-filter"]')).toHaveClass(/ant-switch/);
```

- [x] **Step 2: Run focused Playground full-chain and confirm RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts
```

Expected: FAIL because the Playground preview currently does not pass `show-filter`.

### Task 2: Vue Integration

**Files:**
- Modify: `src/client/modules/playground/playground.view.vue`

- [x] **Step 1: Restore old preview wrapper props**

Change:

```vue
<RanklandRanklist :ranklist="parseState.data" />
```

to:

```vue
<RanklandRanklist :ranklist="parseState.data" name="playground" show-filter />
```

- [x] **Step 2: Run focused Playground full-chain**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts
```

Expected: PASS.

### Task 3: Gates, Docs, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/superpowers/plans/2026-05-26-playground-preview-filter-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration docs**

Record Playground preview filter parity and updated full-gate counts.

- [x] **Step 3: Commit the slice**

Run:

```bash
git status --short
git add src/client/modules/playground/playground.view.vue tests/e2e/full-chain/playground.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-26-playground-preview-filter-parity-design.md docs/superpowers/plans/2026-05-26-playground-preview-filter-parity.md
git commit -m "feat: 收口演练场预览筛选一致性"
```

Expected: commit succeeds with only this slice's files.
