# SRK Controls Extra Action Gap Parity Implementation Plan

**Goal:** Remove Vue-only SRK controls root gap and extra-action wrapper inline-flex/gap chrome so Live controls match the old React `StyledRanklistRenderer` layout.

**Architecture:** Keep the shared `RanklandRanklist` component, old utility class tokens, and Live toggle styling. Add focused full-chain coverage on `/live/:id`, then remove only the scoped CSS that creates the Vue-only gap.

**Tech Stack:** Vue 3 SFC, Playwright full-chain E2E, RankLand migration docs.

---

## File Ownership

- Create: `docs/superpowers/specs/2026-05-27-srk-controls-extra-action-gap-parity-design.md`
- Create: `docs/superpowers/plans/2026-05-27-srk-controls-extra-action-gap-parity.md`
- Modify: `tests/e2e/full-chain/live.spec.ts`
- Modify: `src/client/components/rankland-ranklist.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

### Task 1: Document The Slice

- [x] **Step 1: Save the design spec**

Record old React controls/extra-action layout, current Vue-only gap, decision, test strategy, and acceptance criteria.

- [x] **Step 2: Save this implementation plan**

Record file ownership, RED/GREEN steps, migration docs, full gate, and commit boundary.

### Task 2: Add The Failing Test

- [x] **Step 1: Add a Live controls chrome helper**

Add a helper to `tests/e2e/full-chain/live.spec.ts` that reads:

- controls root classes and computed flex/justify/align/gap;
- extra-action wrapper computed display/gap;
- live toggle computed display/gap.

- [x] **Step 2: Assert old no-gap chrome**

In the primary Live full-chain route test, assert:

- controls classes include `mt-3`, `mx-4`, `flex`, `justify-between`, `items-center`;
- controls root has `column-gap: normal` and `row-gap: normal`;
- extra-action wrapper has `display: block`, `column-gap: normal`, and `row-gap: normal`;
- `.live-scroll-toggle` keeps computed `display: inline-flex` and `column-gap: 4px`.

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hydrates the CSR live page, preserves queries, polls live ranklist, and guards WebSocket setup"
```

Expected: FAIL because current Vue CSS still applies a 16px controls gap and inline-flex/8px extra-action wrapper gap.

Result: FAIL reproduced the old React parity gap. The controls root reported `16px` column/row gap, and the extra-action wrapper reported `flex` display with `8px` column/row gap.

### Task 3: Restore Legacy Controls Chrome

- [x] **Step 1: Remove controls root gap**

Remove `gap: 16px` from `.rankland-ranklist-controls`.

- [x] **Step 2: Restore plain extra-action wrapper**

Remove `.rankland-ranklist-extra-action` from the shared inline-flex/gap rule so only `.rankland-ranklist-filter` keeps that internal alignment.

- [x] **Step 3: Run focused GREEN**

Run the same focused Live full-chain command and expect it to pass.

Result: PASS. The focused Live full-chain test verified old controls utility classes, no declared controls gap, plain block extra-action wrapper, and the existing 4px Live toggle gap.

### Task 4: Update Migration Records

- [x] **Step 1: Record the slice**

Update current focus, route/SRK wrapper coverage, manual checklist, final review, and this plan's checkbox states.

- [x] **Step 2: Run the full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: PASS with generated 8 client routes, full migration tests green, and whitespace check clean.

Result: PASS with Node `v24.11.1`, pnpm `8.15.9`, 8 generated client routes, build, 35 unit files / 151 unit tests, 1 SSR smoke test, 1 shallow Playwright test, 58 passed / 1 skipped default full-chain Playwright tests, and `git diff --check`.

### Task 5: Commit The Slice

- [x] **Step 1: Review diff**

Review all files changed by this plan.

Result: Reviewed the code, test, spec/plan, and migration-doc diff; changes are limited to this slice.

- [x] **Step 2: Commit**

Commit with:

```bash
git commit -m "fix: 还原 SRK 控件额外操作间距"
```

Result: Commit created with message `fix: 还原 SRK 控件额外操作间距`.

- [x] **Step 3: Verify committed state**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean worktree on `migration/live-page-foundation`, commit check passes, and no whitespace errors.

Result: `git status --short --branch`, `git show --check --oneline HEAD`, and `git diff --check` passed for the committed state.
