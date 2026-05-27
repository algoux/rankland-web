# SRK Header Action Display Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React block/inline display semantics for the SRK header meta/action row while keeping stable Vue hooks.

**Architecture:** Keep the `RanklandRanklist` template and `data-id` hooks. Add full-chain computed-style coverage first, then split the current shared CSS rule so the meta row is block and the action wrapper is inline.

**Tech Stack:** Vue 3 SFC scoped LESS, Ant Design Vue, Playwright full-chain tests, pnpm, migration docs.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add a helper for header meta/action display**

Add this helper near `getHeaderActionGapStyle`:

```ts
async function getHeaderActionDisplayStyle(page: Page) {
  return page.evaluate(() => {
    const meta = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-header-meta"]');
    const actions = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-header-actions"]');
    if (!meta || !actions) {
      throw new Error('Missing ranklist header meta/action elements');
    }
    const metaStyle = window.getComputedStyle(meta);
    const actionsStyle = window.getComputedStyle(actions);
    return {
      metaDisplay: metaStyle.display,
      actionsDisplay: actionsStyle.display,
    };
  });
}
```

- [x] **Step 2: Assert old display behavior in the main ranklist detail scenario**

Add this assertion next to the existing header action gap assertion:

```ts
expect(await getHeaderActionDisplayStyle(page)).toEqual({
  metaDisplay: 'block',
  actionsDisplay: 'inline',
});
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Expected: FAIL because the current Vue CSS computes `display: inline-flex` for both the meta row and action wrapper.

### Task 2: Restore Old Display Semantics

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Split the shared header display rule**

Change:

```less
.rankland-ranklist-header-meta,
.rankland-ranklist-header-actions {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  margin: 4px 0 0;
  font-size: 14px;
}

.rankland-ranklist-header-actions {
  margin: 0;
}
```

to:

```less
.rankland-ranklist-header-meta {
  margin: 4px 0 0;
  font-size: 14px;
}

.rankland-ranklist-header-actions {
  display: inline;
  margin: 0;
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
- Modify: `docs/superpowers/plans/2026-05-27-srk-header-action-display-parity.md`

- [x] **Step 1: Update migration docs**

Record `SRK header action display parity`, focused RED/GREEN evidence, and the full gate result in the migration dashboard, manual checklist, and final integration review.

- [x] **Step 2: Run full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, generated routes complete, migration tests pass, and `git diff --check` has no output.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/superpowers/specs/2026-05-27-srk-header-action-display-parity-design.md docs/superpowers/plans/2026-05-27-srk-header-action-display-parity.md docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md
git diff --cached --check
git commit -m "fix: 还原 SRK 头部操作显示语义"
git status --short --branch
```

Expected: commit succeeds and worktree is clean.
