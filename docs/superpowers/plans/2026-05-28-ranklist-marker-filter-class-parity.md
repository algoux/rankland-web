# Ranklist Marker Filter Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Vue-only `.rankland-ranklist-marker-filter` product class from the SRK marker Radio.Group while preserving old React `ml-5 inline-flex items-center` behavior.

**Architecture:** Keep the shared Vue ranklist wrapper, stable `data-id` hook, and existing full-chain ranklist filter-controls test. Assert the old marker class contract first, then move marker styling from the product class selector to a stable `data-id` selector.

**Tech Stack:** Vue 3 SFC, scoped LESS, Ant Design Vue Radio.Group, Playwright full-chain E2E, bwcx/vite-ssr route harness.

---

### Task 1: RED - Capture Marker Radio.Group Contract

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Assert old marker class contract**

In `renders legacy Ant Design filter controls and preserves filtering behavior`, assert:

- marker Radio.Group classes contain `ml-5`, `inline-flex`, and `items-center`;
- marker Radio.Group classes do not contain `rankland-ranklist-marker-filter`;
- existing computed spacing, mobile layout, direct child DOM, and marker filtering behavior remain asserted.

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders legacy Ant Design filter controls and preserves filtering behavior"
```

Expected: FAIL because current Vue still renders `.rankland-ranklist-marker-filter`.

Observed: FAIL because current Vue reported marker classes including `rankland-ranklist-marker-filter`.

### Task 2: GREEN - Remove Vue-Only Marker Class

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Remove marker product class**

Change marker `<a-radio-group>` to:

```vue
class="ml-5 inline-flex items-center"
```

- [x] **Step 2: Preserve marker layout with stable selector**

Replace the `.rankland-ranklist-marker-filter` style selector with:

```less
[data-id='rankland-ranklist-marker-filter'].ml-5 {
  display: inline-flex;
  align-items: center;
  margin-left: 20px;
  white-space: nowrap;
}
```

- [x] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders legacy Ant Design filter controls and preserves filtering behavior"
```

Expected: PASS.

Observed: PASS with 1 focused ranklist filter-controls test.

- [x] **Step 4: Run ranklist full-chain regression**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: PASS, including marker filtering and mobile layout checks.

Observed: PASS with 9 ranklist full-chain tests.

### Task 3: Document, Gate, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/superpowers/plans/2026-05-28-ranklist-marker-filter-class-parity.md`

- [x] **Step 1: Update migration docs**

Record:

- slice name: `Ranklist marker filter class parity`;
- RED evidence for the Vue-only marker class;
- GREEN evidence for focused ranklist filter-controls test;
- ranklist full-chain regression and full gate evidence.

- [x] **Step 2: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, generated client routes, build/unit/SSR/shallow/full-chain migration tests green, and no whitespace errors.

Observed: PASS with Node `v24.11.1`, pnpm `8.15.9`, generated 8 client routes, build success, 35 unit files / 152 unit tests, 1 SSR smoke test, 1 shallow Playwright test, 60 passed / 1 skipped default full-chain Playwright tests, and no `git diff --check` output.

- [x] **Step 3: Commit the completed slice**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-ranklist-marker-filter-class-parity-design.md docs/superpowers/plans/2026-05-28-ranklist-marker-filter-class-parity.md
git diff --cached --check
git commit -m "fix: 还原榜单分组筛选类名"
```
