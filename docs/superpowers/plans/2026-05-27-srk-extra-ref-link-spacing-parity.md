# SRK Extra Ref Link Spacing Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Vue-only extra left margin from the hidden reference-link trigger so it matches old React spacing.

**Architecture:** Keep the shared `RanklandRanklist` template and stable `data-id` hooks. Add one focused full-chain style assertion first, then minimally remove the `margin-left: 4px` declaration while keeping `cursor: pointer`.

**Tech Stack:** Vue 3 SFC scoped LESS, Playwright full-chain tests, pnpm, migration docs.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add the failing spacing assertion**

Add this assertion next to the existing extra ref-link text and caret checks in the main ranklist detail scenario:

```ts
await expect(page.locator('[data-id="rankland-ranklist-ref-link-extra-action"]')).toHaveCSS(
  'margin-left',
  '0px',
);
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Expected: FAIL because `[data-id="rankland-ranklist-ref-link-extra-action"]` computes `margin-left: 4px`.

### Task 2: Restore Old Trigger Spacing

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Remove the Vue-only margin**

Change:

```less
.rankland-ranklist-ref-link-extra-action {
  margin-left: 4px;
  cursor: pointer;
}
```

to:

```less
.rankland-ranklist-ref-link-extra-action {
  cursor: pointer;
}
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
- Modify: `docs/superpowers/plans/2026-05-27-srk-extra-ref-link-spacing-parity.md`

- [x] **Step 1: Mark plan tasks complete after implementation**

Update this plan's checkbox states to match the executed RED/GREEN and gate results.

- [x] **Step 2: Update migration docs**

Record `SRK extra ref-link spacing parity`, the focused RED/GREEN evidence, and the full gate result in the migration dashboard, manual checklist, and final integration review.

- [x] **Step 3: Run full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, generated routes complete, migration tests pass, and `git diff --check` has no output.

- [x] **Step 4: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/superpowers/specs/2026-05-27-srk-extra-ref-link-spacing-parity-design.md docs/superpowers/plans/2026-05-27-srk-extra-ref-link-spacing-parity.md docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md
git diff --cached --check
git commit -m "fix: 还原 SRK 隐藏链接触发间距"
git status --short --branch
```

Expected: commit succeeds and worktree is clean.
