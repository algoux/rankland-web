# SRK Renderer Top-Level Wrapper DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Vue-only SRK renderer top-level and header wrapper DOM while preserving the old React visual behavior already covered by full-chain tests.

**Architecture:** Add a full-chain assertion for the old React direct-child DOM contract, then convert `rankland-ranklist.vue` from a wrapper root to a fragment-style template. Move styles that depended on the removed wrappers to stable direct selectors and existing `data-id` hooks.

**Tech Stack:** Vue 3 fragment templates, scoped Less, Playwright full-chain E2E, RankLand migration docs.

---

### Task 1: Add RED Top-Level DOM Assertions

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [ ] **Step 1: Add a helper that reads direct SRK renderer children**

Add this helper near the existing Ranklist DOM helper functions:

```ts
async function getRanklistRendererTopLevelDom(page: Page) {
  return page.locator('[data-id="ranklist-content"]').evaluate((content) => (
    Array.from(content.children)
      .filter((child) => child.getAttribute('data-id') !== 'ranklist-hydrated')
      .map((child) => ({
        tagName: child.tagName,
        dataId: child.getAttribute('data-id'),
        classList: Array.from(child.classList),
      }))
  ));
}
```

- [ ] **Step 2: Assert no Vue-only renderer wrappers**

In the main Ranklist full-chain test, after `getRanklistLoadedWrapperDom(page)` is asserted, add:

```ts
await expect(page.locator('.rankland-ranklist')).toHaveCount(0);
await expect(page.locator('.rankland-ranklist-header')).toHaveCount(0);
```

- [ ] **Step 3: Assert old top-level renderer child order**

In the same test, add:

```ts
expect(await getRanklistRendererTopLevelDom(page)).toEqual([
  {
    tagName: 'DIV',
    dataId: null,
    classList: ['flex', 'items-center', 'justify-center'],
  },
  {
    tagName: 'H1',
    dataId: 'rankland-ranklist-title',
    classList: ['text-center', 'mb-1'],
  },
  {
    tagName: 'DIV',
    dataId: 'rankland-ranklist-header-meta',
    classList: ['text-center', 'mt-1'],
  },
  {
    tagName: 'P',
    dataId: 'rankland-ranklist-time',
    classList: ['rankland-ranklist-time', 'text-center', 'mb-0'],
  },
  {
    tagName: 'DIV',
    dataId: 'rankland-ranklist-progress',
    classList: ['rankland-ranklist-progress', 'mx-4'],
  },
  {
    tagName: 'DIV',
    dataId: 'rankland-ranklist-controls',
    classList: ['rankland-ranklist-controls', 'mt-3', 'mx-4', 'flex', 'justify-between', 'items-center'],
  },
  {
    tagName: 'DIV',
    dataId: 'rankland-ranklist-table-spacer',
    classList: ['mt-6'],
  },
  {
    tagName: 'DIV',
    dataId: 'rankland-ranklist-table-wrapper',
    classList: ['ml-4'],
  },
  {
    tagName: 'FOOTER',
    dataId: 'rankland-ranklist-footer',
    classList: ['rankland-ranklist-footer', 'text-center', 'mt-8'],
  },
]);
```

- [ ] **Step 4: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
```

Expected: the test fails because `.rankland-ranklist` and `.rankland-ranklist-header` are still rendered.

### Task 2: Remove Wrapper DOM And Preserve Styles

**Files:**
- Modify: `src/client/components/rankland-ranklist.vue`

- [ ] **Step 1: Convert the template root to a fragment**

Replace:

```vue
<template>
  <div class="rankland-ranklist">
    ...
  </div>
</template>
```

with a template whose root children are the existing check-error `div`, render-error `div`, and normal-path `template`.

- [ ] **Step 2: Replace the header wrapper with a fragment**

Replace:

```vue
<header v-if="showHeader" class="rankland-ranklist-header">
  ...
</header>
```

with:

```vue
<template v-if="showHeader">
  ...
</template>
```

- [ ] **Step 3: Move wrapper-dependent styles**

Delete:

```less
.rankland-ranklist {
  width: 100%;
  overflow-x: auto;
}

.rankland-ranklist-header {
  margin-bottom: 0;
  text-align: center;
}

.rankland-ranklist-header h1 {
  margin: 0 0 4px;
  font-size: 32px;
  font-weight: 500;
}
```

Replace:

```less
.rankland-ranklist a,
.rankland-ranklist-footer :deep(.contact-us-trigger) {
  color: var(--rankland-link-color);
}

.rankland-ranklist a:hover,
.rankland-ranklist-footer :deep(.contact-us-trigger:hover) {
  color: var(--rankland-link-hover-color);
}
```

with:

```less
a,
.rankland-ranklist-footer :deep(.contact-us-trigger) {
  color: var(--rankland-link-color);
}

a:hover,
.rankland-ranklist-footer :deep(.contact-us-trigger:hover) {
  color: var(--rankland-link-hover-color);
}
```

Add:

```less
[data-id='rankland-ranklist-title'].text-center.mb-1 {
  margin: 0 0 4px;
  font-size: 32px;
  font-weight: 500;
}
```

- [ ] **Step 4: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend"
```

Expected: the focused Ranklist test passes.

### Task 3: Widen Shared Renderer Regression And Update Docs

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`

- [ ] **Step 1: Run shared renderer route regressions**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts
```

Expected: all four shared-renderer route files pass.

- [ ] **Step 2: Update migration docs**

Record that SRK renderer top-level wrapper DOM parity is verified: the shared renderer no longer emits Vue-only `.rankland-ranklist` or `.rankland-ranklist-header` wrappers, while existing header, controls, table, modal, footer, and viewport assertions remain green.

- [ ] **Step 3: Run full completed-slice gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node `v24.11.1`, pnpm `8.15.9`, router generation completes, migration tests pass, and `git diff --check` has no output.

### Task 4: Commit And Post-Check

**Files:**
- Commit all changed files for this slice only.

- [ ] **Step 1: Commit**

Run:

```bash
git add src/client/components/rankland-ranklist.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/final-integration-review.md docs/migration/manual-acceptance-checklist.md docs/superpowers/specs/2026-05-28-srk-renderer-top-level-wrapper-dom-parity-design.md docs/superpowers/plans/2026-05-28-srk-renderer-top-level-wrapper-dom-parity.md
git commit -m "fix: 还原榜单渲染器顶层结构"
```

- [ ] **Step 2: Post-check**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: branch clean, latest commit is `fix: 还原榜单渲染器顶层结构`, and whitespace checks have no output.
