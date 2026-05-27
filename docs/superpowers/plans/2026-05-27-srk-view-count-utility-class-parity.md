# SRK View Count Utility Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React `mr-2` utility class token on the shared SRK header view-count span.

**Architecture:** Keep the existing Vue wrapper structure and stable `rankland-ranklist-view-count` hook. Add one full-chain assertion first, then minimally append the old `mr-2` token to the existing class list without changing header spacing CSS.

**Tech Stack:** Vue 3 SFC, Playwright full-chain tests, pnpm, migration docs.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add the failing class assertion**

Add this assertion next to the existing view-count text and icon checks in the main ranklist detail scenario:

```ts
await expect(page.locator('[data-id="rankland-ranklist-view-count"]')).toHaveClass(/(^|\s)mr-2(\s|$)/);
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Expected: FAIL because `[data-id="rankland-ranklist-view-count"]` has `rankland-ranklist-view-count` but not `mr-2`.

### Task 2: Restore the Old Class Token

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Append `mr-2` to the view-count span**

Change:

```vue
<span v-if="hasViewCount" data-id="rankland-ranklist-view-count" class="rankland-ranklist-view-count">
```

to:

```vue
<span v-if="hasViewCount" data-id="rankland-ranklist-view-count" class="rankland-ranklist-view-count mr-2">
```

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Expected: PASS.

### Task 3: Document, Verify, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-27-srk-view-count-utility-class-parity.md`

- [x] **Step 1: Mark plan tasks complete after implementation**

Update this plan's checkbox states to match the executed RED/GREEN and gate results.

- [x] **Step 2: Update migration docs**

Record `SRK view-count utility-class parity`, the focused RED/GREEN evidence, and the full gate result in the migration dashboard, manual checklist, and final integration review.

- [x] **Step 3: Run full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, generated routes complete, migration tests pass, and `git diff --check` has no output.

- [x] **Step 4: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/superpowers/specs/2026-05-27-srk-view-count-utility-class-parity-design.md docs/superpowers/plans/2026-05-27-srk-view-count-utility-class-parity.md docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md
git diff --cached --check
git commit -m "fix: 还原 SRK 浏览量旧版工具类"
git status --short --branch
```

Expected: commit succeeds and worktree is clean.
