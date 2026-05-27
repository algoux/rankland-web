# Ranklist Organization Select Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Vue-only `.rankland-ranklist-select` product class from the SRK organization filter Select while preserving old React `ml-2` + inline `width: 160px` behavior.

**Architecture:** Keep the shared Vue ranklist wrapper, stable `data-id` hooks, and existing full-chain ranklist filter-controls test. Assert the old class/inline-style contract first, then move the Select width inline and keep margin via a `data-id`-scoped style selector.

**Tech Stack:** Vue 3 SFC, scoped LESS, Ant Design Vue Select, Playwright full-chain E2E, bwcx/vite-ssr route harness.

---

### Task 1: RED - Capture Organization Select Contract

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Extend DOM parity helper**

Return `organizationFilterClasses` and `organizationFilterInlineWidth` from `getFilterControlDomParity`.

- [x] **Step 2: Assert old React class/style contract**

In `renders legacy Ant Design filter controls and preserves filtering behavior`, assert:

- organization Select classes contain `ml-2`;
- organization Select classes do not contain `rankland-ranklist-select`;
- organization Select inline width is `160px`;
- existing computed spacing, width, direct child DOM, and behavior remain asserted.

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders legacy Ant Design filter controls and preserves filtering behavior"
```

Expected: FAIL because current Vue still renders `.rankland-ranklist-select` and does not set inline width on the Select root.

Observed: FAIL because current Vue reported `organizationFilterInlineWidth: ""` instead of old React inline `160px`; source comparison also confirmed the Vue-only `.rankland-ranklist-select` class remained on the Select root.

### Task 2: GREEN - Remove Vue-Only Select Class

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Restore old inline width**

Change the organization `<a-select>` to:

```vue
class="ml-2"
style="width: 160px"
```

- [x] **Step 2: Preserve spacing with stable selector**

Remove `.rankland-ranklist-select` style rules and replace the margin rule with:

```less
[data-id='rankland-ranklist-organization-filter'].ml-2 {
  margin-left: 8px;
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

Expected: PASS, including selected tag, spacing, and mobile layout checks.

Observed: PASS with 9 ranklist full-chain tests.

### Task 3: Document, Gate, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/superpowers/plans/2026-05-28-ranklist-organization-select-class-parity.md`

- [x] **Step 1: Update migration docs**

Record:

- slice name: `Ranklist organization Select class parity`;
- RED evidence for the Vue-only class and missing inline width;
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
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-ranklist-organization-select-class-parity-design.md docs/superpowers/plans/2026-05-28-ranklist-organization-select-class-parity.md
git diff --cached --check
git commit -m "fix: 还原榜单组织筛选类名"
```
