# SRK Table Offset Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `tableClass="ml-4"` behavior for standalone ranklist and live pages.

**Architecture:** Keep the existing `RanklandRanklist` `tableClass` prop. Add a stable selector to the table wrapper and scoped CSS for the old `ml-4` utility. Update only route callers that passed `tableClass="ml-4"` in `rankland-fe`; collection and playground remain unshifted.

**Tech Stack:** Vue 3 Options API, scoped LESS, Playwright full-chain E2E.

---

### Task 1: Red Tests

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `tests/e2e/full-chain/live.spec.ts`
- Modify: `tests/e2e/full-chain/collection.spec.ts`

- [x] **Step 1: Add table-wrapper margin helper**

Add a small local helper in each touched spec or inline `evaluate` expression that reads:

```ts
getComputedStyle(document.querySelector('[data-id="rankland-ranklist-table-wrapper"]')!).marginLeft
```

- [x] **Step 2: Assert old route-specific margins**

Assert:

```ts
expect(await getTableWrapperMarginLeft(page)).toBe('16px');
```

for ranklist and live.

- [x] **Step 3: Assert collection remains unshifted**

Assert:

```ts
expect(await getTableWrapperMarginLeft(page)).toBe('0px');
```

for `/collection/official?rankId=test-key`.

- [x] **Step 4: Run focused full-chain tests and confirm RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/live.spec.ts tests/e2e/full-chain/collection.spec.ts
```

Expected: fail because the shared wrapper lacks the stable `data-id`, and current route classes do not apply the old margin.

### Task 2: Vue Implementation

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`
- Modify: `src/client/modules/ranklist/ranklist.view.vue`
- Modify: `src/client/modules/live/live.view.vue`

- [x] **Step 1: Add stable table wrapper selector**

Change the table wrapper in `rankland-ranklist.vue` to:

```vue
<div data-id="rankland-ranklist-table-wrapper" :class="tableClass">
```

- [x] **Step 2: Add scoped old utility class**

Add:

```less
.ml-4 {
  margin-left: 16px;
}
```

inside `rankland-ranklist.vue` scoped styles.

- [x] **Step 3: Restore old route table class props**

Change `/ranklist/:id` and `/live/:id` callers to pass `table-class="ml-4"`.

- [x] **Step 4: Run focused verification**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/live.spec.ts tests/e2e/full-chain/collection.spec.ts
```

Expected: PASS.

### Task 3: Gates, Docs, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/superpowers/plans/2026-05-26-srk-table-offset-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration docs**

Record SRK table-wrapper offset parity and keep remaining exact table pixel parity scoped to lower-level renderer details.

- [x] **Step 3: Commit the slice**

Run:

```bash
git status --short
git add src/client/components/rankland-ranklist.vue src/client/modules/ranklist/ranklist.view.vue src/client/modules/live/live.view.vue tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/live.spec.ts tests/e2e/full-chain/collection.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-26-srk-table-offset-parity-design.md docs/superpowers/plans/2026-05-26-srk-table-offset-parity.md
git commit -m "feat: 收口榜单表格缩进一致性"
```

Expected: commit succeeds with only this slice's files.
