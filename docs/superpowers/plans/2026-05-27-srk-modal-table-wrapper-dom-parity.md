# SRK Modal Table Wrapper DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React SRK modal wrapper placement by rendering user and solution modal nodes inside the table wrapper.

**Architecture:** Add a full-chain DOM regression helper to the existing ranklist modal coverage, then move the existing Vue modal wrapper blocks into `[data-id="rankland-ranklist-table-wrapper"]` after `<Ranklist />`. Keep footer after the table wrapper.

**Tech Stack:** Vue 3 SFC, SRK Vue Modal, Playwright full-chain E2E.

---

### Task 1: RED - capture modal wrapper ancestry

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add a DOM helper**

Add this helper near the other DOM helper functions:

```ts
async function getModalTableWrapperDomParity(page: Page) {
  return page.evaluate(() => {
    const tableWrapper = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-table-wrapper"]');
    const userModal = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-user-modal"]');
    const solutionModal = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-solution-modal"]');
    const footer = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-footer"]');
    if (!tableWrapper || !userModal || !solutionModal || !footer) {
      throw new Error('Missing ranklist modal table-wrapper DOM targets');
    }

    return {
      userModalInsideTableWrapper: tableWrapper.contains(userModal),
      solutionModalInsideTableWrapper: tableWrapper.contains(solutionModal),
      footerInsideTableWrapper: tableWrapper.contains(footer),
    };
  });
}
```

- [x] **Step 2: Assert old modal placement**

After the table wrapper / footer existence checks in the main ranklist full-chain test, add:

```ts
expect(await getModalTableWrapperDomParity(page)).toEqual({
  userModalInsideTableWrapper: true,
  solutionModalInsideTableWrapper: true,
  footerInsideTableWrapper: false,
});
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page"
```

Expected: FAIL because current Vue renders the modal wrapper nodes after the footer and outside the table wrapper.

Result: FAIL reproduced the parity gap. The helper reported `userModalInsideTableWrapper: false` and `solutionModalInsideTableWrapper: false`, while `footerInsideTableWrapper` was already false.

### Task 2: GREEN - move modal wrappers into table wrapper

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Move existing modal wrapper blocks**

Move the existing:

```vue
<div data-id="rankland-ranklist-user-modal">...</div>
<div data-id="rankland-ranklist-solution-modal">...</div>
```

into the existing `[data-id="rankland-ranklist-table-wrapper"]` block immediately after `<Ranklist />` and before the table wrapper closing tag. Keep the footer after the table wrapper.

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page"
```

Expected: PASS.

Result: PASS. The focused full-chain ranklist route verified modal wrapper ancestry while preserving existing user modal, solution modal, footer, and rank-time behavior.

### Task 3: Full verification, docs, commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, route generation succeeds, migration tests pass, and whitespace check passes.

Result: PASS. Full gate used Node `v24.11.1`, pnpm `8.15.9`, generated 8 client routes, passed build, 35 unit files / 151 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 59 passed / 1 skipped full-chain tests; `git diff --check` passed.

- [x] **Step 2: Update migration docs**

Record SRK modal table-wrapper DOM parity in the current focus, route/SRK wrapper coverage, manual checklist, and final integration review.

- [ ] **Step 3: Commit**

Run:

```bash
git add tests/e2e/full-chain/ranklist.spec.ts src/client/components/rankland-ranklist.vue docs/superpowers/specs/2026-05-27-srk-modal-table-wrapper-dom-parity-design.md docs/superpowers/plans/2026-05-27-srk-modal-table-wrapper-dom-parity.md docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md
git commit -m "fix: 还原 SRK 弹窗表格容器 DOM"
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: commit succeeds on `migration/live-page-foundation`, post-checks pass.
