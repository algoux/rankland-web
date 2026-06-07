# Home Card Col mb-4 Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React `mb-4` class token on RankLand home recommendation/tool card columns.

**Architecture:** Keep the existing Vue home route and Ant Design Vue card grid. Add a focused full-chain helper that inspects the rendered `.ant-col` ancestors of the four card links, then add the minimal column class tokens needed for old React DOM/spacing parity.

**Tech Stack:** Vue 3, ant-design-vue, Playwright full-chain E2E, RankLand migration docs.

---

## File Ownership

- Create: `docs/superpowers/specs/2026-05-27-home-card-col-mb4-class-parity-design.md`
- Create: `docs/superpowers/plans/2026-05-27-home-card-col-mb4-class-parity.md`
- Modify: `tests/e2e/full-chain/home.spec.ts`
- Modify: `src/client/modules/home/home.view.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

### Task 1: Document The Slice

**Files:**
- Create: `docs/superpowers/specs/2026-05-27-home-card-col-mb4-class-parity-design.md`
- Create: `docs/superpowers/plans/2026-05-27-home-card-col-mb4-class-parity.md`

- [x] **Step 1: Save the design spec**

Record the old React `Col className="mb-4"` behavior, the Vue missing-class gap, test strategy, and acceptance criteria in the design spec.

- [x] **Step 2: Save this implementation plan**

Record file ownership, RED/GREEN steps, migration doc updates, full gate command, and commit boundary.

### Task 2: Add The Failing Test

**Files:**
- Modify: `tests/e2e/full-chain/home.spec.ts`

- [x] **Step 1: Add a card column presentation helper**

Add this helper near the existing home presentation helpers:

```ts
async function getHomeCardColumnPresentation(page: Page) {
  return page.evaluate(() => {
    const cardDataIds = [
      'home-recommendation-search',
      'home-recommendation-collection',
      'home-tool-paste-then-ac',
      'home-tool-algo-bootstrap',
    ];

    return cardDataIds.map((dataId) => {
      const link = document.querySelector<HTMLElement>(`[data-id="${dataId}"]`);
      const column = link?.closest<HTMLElement>('.ant-col');
      if (!link || !column) {
        throw new Error(`Missing home card column: ${dataId}`);
      }

      const style = getComputedStyle(column);
      return {
        dataId,
        classList: Array.from(column.classList),
        marginBottom: style.marginBottom,
      };
    });
  });
}
```

- [x] **Step 2: Assert old column class and spacing**

Add this assertion after the existing recommendation/tool column count checks:

```ts
expect(await getHomeCardColumnPresentation(page)).toEqual([
  {
    dataId: 'home-recommendation-search',
    classList: expect.arrayContaining(['mb-4']),
    marginBottom: '16px',
  },
  {
    dataId: 'home-recommendation-collection',
    classList: expect.arrayContaining(['mb-4']),
    marginBottom: '16px',
  },
  {
    dataId: 'home-tool-paste-then-ac',
    classList: expect.arrayContaining(['mb-4']),
    marginBottom: '16px',
  },
  {
    dataId: 'home-tool-algo-bootstrap',
    classList: expect.arrayContaining(['mb-4']),
    marginBottom: '16px',
  },
]);
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts -g "renders the RankLand home page through SSR"
```

Expected: FAIL because the current Vue columns do not include `mb-4`.

### Task 3: Restore The Column Class Tokens

**Files:**
- Modify: `src/client/modules/home/home.view.vue`

- [x] **Step 1: Add old classes to recommendation columns**

Change both recommendation columns to:

```vue
<a-col class="mb-4" :xs="24" :sm="12">
```

- [x] **Step 2: Add old classes to tool columns**

Change both tool columns to:

```vue
<a-col class="mb-4" :xs="24" :sm="12">
```

- [x] **Step 3: Restore the old utility spacing**

Add the home-local utility rule:

```less
.mb-4 {
  margin-bottom: 16px;
}
```

- [x] **Step 4: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts -g "renders the RankLand home page through SSR"
```

Expected: PASS, including the new card column assertions and existing home assertions.

### Task 4: Update Migration Records

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-27-home-card-col-mb4-class-parity.md`

- [x] **Step 1: Record the slice**

Update the current focus, home route evidence, manual checklist home section, final review home evidence, final gate result, and this plan's checkbox states.

- [x] **Step 2: Run the full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: PASS with generated 8 client routes, full migration tests green, and whitespace check clean.

### Task 5: Commit The Slice

**Files:**
- Commit all files changed by this plan.

- [x] **Step 1: Review diff**

Run:

```bash
git diff -- tests/e2e/full-chain/home.spec.ts src/client/modules/home/home.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-home-card-col-mb4-class-parity-design.md docs/superpowers/plans/2026-05-27-home-card-col-mb4-class-parity.md
```

- [x] **Step 2: Commit**

Run:

```bash
git add tests/e2e/full-chain/home.spec.ts src/client/modules/home/home.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-home-card-col-mb4-class-parity-design.md docs/superpowers/plans/2026-05-27-home-card-col-mb4-class-parity.md
git commit -m "fix: 还原首页卡片列间距类名"
```

- [x] **Step 3: Verify committed state**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean worktree on `migration/live-page-foundation`, commit check passes, and no whitespace errors.
