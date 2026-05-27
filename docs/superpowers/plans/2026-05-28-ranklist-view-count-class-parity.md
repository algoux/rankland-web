# Ranklist View Count Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the SRK header view-count node to the old React exact `mr-2` class contract while preserving visual and fallback behavior.

**Architecture:** This is a narrow renderer-wrapper parity slice. The E2E test owns the product DOM contract; the Vue component removes the Vue-only class and retargets the local color rule to the stable `data-id` selector.

**Tech Stack:** Vue 3 SFC, Ant Design Vue icons, Playwright full-chain E2E, RankLand migration docs.

---

### Task 1: RED Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add exact class-list assertions**

Insert this assertion immediately after the existing view-count `mr-2` check in the primary ranklist detail test:

```ts
expect(await page.locator('[data-id="rankland-ranklist-view-count"]').evaluate((element) => (
  Array.from(element.classList)
))).toEqual(['mr-2']);
expect(await page.locator('[data-id="rankland-ranklist-view-count"]').evaluate((element) => (
  Array.from(element.classList)
))).not.toContain('rankland-ranklist-view-count');
```

- [x] **Step 2: Verify RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
```

Expected: FAIL because the current Vue element still has `rankland-ranklist-view-count mr-2`.

### Task 2: GREEN Implementation

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Remove the Vue-only class**

Change:

```vue
<span v-if="hasViewCount" data-id="rankland-ranklist-view-count" class="rankland-ranklist-view-count mr-2">
```

to:

```vue
<span v-if="hasViewCount" data-id="rankland-ranklist-view-count" class="mr-2">
```

- [x] **Step 2: Retarget the color rule**

Change:

```less
.rankland-ranklist-view-count {
  color: var(--rankland-legacy-text-color);
}
```

to:

```less
[data-id='rankland-ranklist-view-count'].mr-2 {
  color: var(--rankland-legacy-text-color);
}
```

- [x] **Step 3: Verify focused GREEN**

Run the same focused command from Task 1.

Expected: PASS with 1 test passed.

- [x] **Step 4: Verify ranklist regression**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
```

Expected: PASS with 9 tests passed.

### Task 3: Migration Docs And Gate

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/superpowers/plans/2026-05-28-ranklist-view-count-class-parity.md`

- [x] **Step 1: Update migration docs**

Record the verified slice as `Ranklist view-count class parity`, including the exact old `mr-2` class contract, no Vue-only `.rankland-ranklist-view-count`, and focused RED/GREEN evidence.

- [x] **Step 2: Run the full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, generated 8 client routes, unit/build/SSR/E2E migration gate pass, and no whitespace errors.

- [x] **Step 3: Commit the slice**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-ranklist-view-count-class-parity-design.md docs/superpowers/plans/2026-05-28-ranklist-view-count-class-parity.md
git diff --cached --check
git commit -m "fix: 还原榜单浏览量类名"
```

Expected: Commit succeeds with only this slice's files.

- [x] **Step 4: Run post-checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean branch, latest commit check clean, and no whitespace errors.
