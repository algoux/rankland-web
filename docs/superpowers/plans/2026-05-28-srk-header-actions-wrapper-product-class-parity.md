# SRK Header Actions Wrapper Product Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Vue-only SRK header actions wrapper product class while preserving the old React header action chrome.

**Architecture:** Keep the existing shared Vue `RanklandRanklist` wrapper and its stable `data-id`. Move styles from the product class selector to the `data-id` selector, then verify ranklist and live routes still render the same trigger classes, display, gaps, colors, and dropdown behavior.

**Tech Stack:** Vue 3, ant-design-vue, Playwright full-chain E2E, RankLand mock backend.

---

### Task 1: RED Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `tests/e2e/full-chain/live.spec.ts`

- [x] **Step 1: Assert header action wrapper has no product class**

Add `actionsClasses: Array.from(actions.classList)` to the ranklist header action display helper and assert `actionsClasses: []`. Add the same empty class-list assertion in the live route header action coverage.

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
```

Expected: FAIL because the current wrapper class list contains `rankland-ranklist-header-actions`.

Observed: FAIL as expected. Playwright reported `actionsClasses: ["rankland-ranklist-header-actions"]` while `metaDisplay` stayed `block` and `actionsDisplay` stayed `inline`.

### Task 2: Remove Product Class

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Remove wrapper class**

Change:

```vue
<div data-id="rankland-ranklist-header-actions" class="rankland-ranklist-header-actions">
```

to:

```vue
<div data-id="rankland-ranklist-header-actions">
```

- [x] **Step 2: Move scoped selectors to data-id**

Replace `.rankland-ranklist-header-actions` selectors with `[data-id='rankland-ranklist-header-actions']`, including button, trigger, hover, icon, and border selectors.

- [x] **Step 3: Run focused GREEN**

Run the same focused ranklist command.

Expected: PASS with empty wrapper class list and unchanged existing header action assertions.

Observed: PASS. The focused ranklist full-chain test passed with the empty wrapper class list and existing header action trigger/display/gap assertions intact.

### Task 3: Broaden Verification And Docs

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Run shared route verification**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/live.spec.ts
```

Expected: both route files pass.

Observed: PASS. `tests/e2e/full-chain/ranklist.spec.ts` and `tests/e2e/full-chain/live.spec.ts` passed 20 tests.

- [x] **Step 2: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node 24, pnpm 8, generated routes valid, migration tests pass, and whitespace check passes.

Observed: PASS. Node `v24.11.1`, pnpm `8.15.9`, `gen:client-router` generated 6 client routes, `test:migration` passed with build, 36 unit files / 154 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 60 passed / 1 skipped full-chain Playwright tests; `git diff --check` passed.

- [x] **Step 3: Update migration docs**

Record this slice as current verified focus, including RED/GREEN, shared route verification, full gate evidence, and remaining recommended next slice.

- [x] **Step 4: Commit**

Commit as:

```bash
git commit -m "fix: 还原 SRK 头部操作容器类名"
```
