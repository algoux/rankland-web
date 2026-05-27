# SRK Header Action Gap Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Vue-only flex gap from the SRK header meta/action row so old utility-class spacing is the only action spacing.

**Architecture:** Keep the shared `RanklandRanklist` component, stable `data-id` hooks, and Ant Design Vue dropdown triggers. Add focused full-chain style coverage first, then remove only the scoped `gap: 8px` declaration from the header meta/actions CSS.

**Tech Stack:** Vue 3 SFC scoped LESS, Ant Design Vue, Playwright full-chain tests, pnpm, migration docs.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add a helper for header meta/action gap**

Add this helper near `getHeaderActionTriggerStyle`:

```ts
async function getHeaderActionGapStyle(page: Page) {
  return page.evaluate(() => {
    const meta = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-header-meta"]');
    const actions = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-header-actions"]');
    if (!meta || !actions) {
      throw new Error('Missing ranklist header meta/action elements');
    }
    const metaStyle = window.getComputedStyle(meta);
    const actionsStyle = window.getComputedStyle(actions);
    return {
      metaColumnGap: metaStyle.columnGap,
      metaRowGap: metaStyle.rowGap,
      actionsColumnGap: actionsStyle.columnGap,
      actionsRowGap: actionsStyle.rowGap,
    };
  });
}
```

- [x] **Step 2: Assert old no-gap behavior in the main ranklist detail scenario**

Add this assertion next to the existing export/share trigger class and computed-style checks:

```ts
expect(await getHeaderActionGapStyle(page)).toEqual({
  metaColumnGap: 'normal',
  metaRowGap: 'normal',
  actionsColumnGap: 'normal',
  actionsRowGap: 'normal',
});
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Expected: FAIL because the current Vue CSS computes `8px` gaps for the header meta/actions row.

### Task 2: Restore Old Header Action Spacing

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [x] **Step 1: Remove the Vue-only header gap**

Change:

```less
.rankland-ranklist-header-meta,
.rankland-ranklist-header-actions {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 4px 0 0;
  font-size: 14px;
}
```

to:

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
- Modify: `docs/superpowers/plans/2026-05-27-srk-header-action-gap-parity.md`

- [x] **Step 1: Update migration docs**

Record `SRK header action gap parity`, the focused RED/GREEN evidence, and the full gate result in the migration dashboard, manual checklist, and final integration review.

- [x] **Step 2: Run full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, generated routes complete, migration tests pass, and `git diff --check` has no output.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/superpowers/specs/2026-05-27-srk-header-action-gap-parity-design.md docs/superpowers/plans/2026-05-27-srk-header-action-gap-parity.md docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md
git diff --cached --check
git commit -m "fix: 还原 SRK 头部操作间距"
git status --short --branch
```

Expected: commit succeeds and worktree is clean.
