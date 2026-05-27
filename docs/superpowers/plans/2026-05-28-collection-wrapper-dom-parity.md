# Collection Wrapper DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React collection loaded wrapper DOM and exact wrapper class contract.

**Architecture:** Keep all behavior in the existing collection Vue route. Replace Vue-only product wrapper tags/classes with the old React wrapper DOM, then retarget scoped LESS to legacy classes and inline styles so collapse/mobile behavior stays unchanged without state classes in the product DOM.

**Tech Stack:** Vue 3 SFC, scoped LESS, Ant Design Vue, Playwright full-chain E2E, bwcx/vite-ssr route harness.

---

### Task 1: RED - Capture Collection Wrapper DOM Parity

**Files:**
- Modify: `tests/e2e/full-chain/collection.spec.ts`

- [x] **Step 1: Add a wrapper DOM helper**

Add this helper after `getRouteContentSpacing`:

```ts
async function getCollectionLoadedWrapperDom(page: Page) {
  return page.evaluate(() => {
    const content = document.querySelector<HTMLElement>('[data-id="collection-content"]');
    const nav = document.querySelector<HTMLElement>('[data-id="collection-nav"]');
    const hiddenHeader = document.querySelector<HTMLElement>('.srk-collection-hidden-header');
    const panel = document.querySelector<HTMLElement>('[data-id="collection-ranklist-panel"]');
    const ranklistContent = document.querySelector<HTMLElement>('[data-id="collection-ranklist-content"]');

    if (!content || !(content.parentElement instanceof HTMLElement)) {
      throw new Error('Missing collection content wrapper');
    }

    if (!nav) {
      throw new Error('Missing collection nav wrapper');
    }

    if (!hiddenHeader) {
      throw new Error('Missing collection hidden header');
    }

    if (!panel) {
      throw new Error('Missing collection ranklist panel');
    }

    if (!ranklistContent) {
      throw new Error('Missing collection ranklist content');
    }

    const ranklistContentStyle = window.getComputedStyle(ranklistContent);

    return {
      rootTagName: content.parentElement.tagName,
      rootClasses: Array.from(content.parentElement.classList),
      contentTagName: content.tagName,
      contentClasses: Array.from(content.classList),
      navTagName: nav.tagName,
      navClasses: Array.from(nav.classList),
      hiddenHeaderTagName: hiddenHeader.tagName,
      hiddenHeaderClasses: Array.from(hiddenHeader.classList),
      panelTagName: panel.tagName,
      panelClasses: Array.from(panel.classList),
      ranklistContentTagName: ranklistContent.tagName,
      ranklistContentClasses: Array.from(ranklistContent.classList),
      ranklistContentPaddingBottom: ranklistContentStyle.paddingBottom,
    };
  });
}
```

- [x] **Step 2: Assert exact old wrapper DOM in the selected-ranklist test**

In `renders selected ranklist through SSR, hydration, RanklandApiService, and the mock backend`, immediately after the existing `getRouteContentSpacing` assertion, add:

```ts
expect(await getCollectionLoadedWrapperDom(page)).toMatchObject({
  rootTagName: 'DIV',
  rootClasses: [],
  contentTagName: 'DIV',
  contentClasses: ['srk-collection-container'],
  navTagName: 'DIV',
  navClasses: ['srk-collection-nav'],
  hiddenHeaderTagName: 'DIV',
  hiddenHeaderClasses: ['srk-collection-hidden-header'],
  panelTagName: 'DIV',
  panelClasses: ['srk-collection-ranklist'],
  ranklistContentTagName: 'DIV',
  ranklistContentClasses: ['pb-8'],
  ranklistContentPaddingBottom: '32px',
});
```

- [x] **Step 3: Remove state-class assertions that no longer describe old React DOM**

Replace state-class checks in mobile/collapse tests with behavior assertions:

```ts
await expect(page.locator('[data-id="collection-collapse-button"] .anticon-menu-unfold')).toBeVisible();
await expect(page.locator('[data-id="collection-collapse-button"] .anticon-menu-fold')).toBeVisible();
await expect(page.locator('[data-id="collection-ranklist-panel"]')).toBeHidden();
await expect(page.locator('[data-id="collection-ranklist-panel"]')).toBeVisible();
```

- [x] **Step 4: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "renders selected ranklist"
```

Observed: FAIL because current Vue rendered `MAIN`, `SECTION`, `ASIDE`, and Vue-only wrapper classes including `collection-page`, `collection-nav`, `collection-hidden-header`, `collection-ranklist-panel`, and `collection-ranklist-content`.

### Task 2: GREEN - Restore Collection Wrapper DOM

**Files:**
- Modify: `src/client/modules/collection/collection.view.vue`

- [x] **Step 1: Replace product wrapper tags and classes**

Change the root and loaded wrappers to old React-compatible tags/classes:

```vue
<template>
  <div>
```

```vue
<div
  v-else
  data-id="collection-content"
  class="srk-collection-container"
>
```

```vue
<div class="srk-collection-hidden-header" :style="hiddenHeaderStyle">
```

```vue
<div
  data-id="collection-ranklist-panel"
  class="srk-collection-ranklist"
  :style="ranklistPanelStyle"
>
```

```vue
<div
  v-else-if="ranklist"
  data-id="collection-ranklist-content"
  class="pb-8"
  :data-ranklist-id="rankId"
  :data-row-count="rowCount"
>
```

Close the affected wrappers with matching `</div>` tags.

- [x] **Step 2: Preserve hidden-header collapsed styling through inline style**

Extend `hiddenHeaderStyle()` so it carries the old collapse-dependent style without requiring Vue-only state classes:

```ts
hiddenHeaderStyle(): Record<string, string> {
  return {
    width: `${this.navWidth}px`,
    transition: COLLECTION_WIDTH_TRANSITION,
    flexDirection: this.collapsed ? 'column' : 'row',
  };
}
```

Set the collapsed image and heading styles inline in the template:

```vue
<img
  :src="logo"
  alt="RankLand"
  :width="collapsed ? 24 : 32"
  :height="collapsed ? 24 : 32"
>
<h3
  class="mb-0"
  :style="{ fontSize: collapsed ? '14px' : undefined, marginLeft: collapsed ? '0px' : '8px', marginTop: collapsed ? '4px' : '0px' }"
>
```

- [x] **Step 3: Retarget scoped LESS to legacy classes**

Replace Vue-only wrapper selectors:

```less
.srk-collection-container {
  position: relative;
  min-height: 70vh;
}

.srk-collection-nav {
  position: fixed;
  top: 64px;
  left: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  overflow: hidden;
  background: #f4f4f4;
  border-right: 1px solid #d9d9d9;
}

html.dark .srk-collection-nav {
  background: #111111;
  border-right-color: #434343;
}

.srk-collection-hidden-header {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
}

.srk-collection-hidden-header h3 {
  line-height: 1;
}

.srk-collection-ranklist {
  flex: 1;
  position: relative;
  box-sizing: border-box;
  min-width: 0;
  max-width: 100vw;
  overflow-x: auto;
  padding: 16px;
}

@media (max-width: 640px) {
  .srk-collection-nav {
    top: 56px;
    border-right: 0;
    border-bottom: 1px solid #d9d9d9;
  }

  .srk-collection-ranklist {
    padding: 12px;
  }
}
```

Remove now-unused selectors for `.collection-page`, `.collection-nav`, `.collection-hidden-header`, `.collection-ranklist-panel`, and `.collection-ranklist-content`.

- [x] **Step 4: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "renders selected ranklist"
```

Observed: PASS.

- [x] **Step 5: Run collection behavior regression**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts
```

Observed: PASS, 11 full-chain collection tests.

### Task 3: Document, Gate, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-28-collection-wrapper-dom-parity.md`

- [x] **Step 1: Update migration docs**

Record:

- slice name: `Collection wrapper DOM parity`;
- RED evidence for old React `DIV` wrappers and exact class lists;
- GREEN evidence for the focused selected-ranklist test;
- collection regression/full gate evidence;
- route progress updates for `/collection/:id`.

- [x] **Step 2: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Observed: Node `v24.11.1`, pnpm `8.15.9`, generated 8 routes, `test:migration` passed with build, 35 unit files / 152 unit tests, 1 SSR smoke test, 1 shallow Playwright test, and 60 passed / 1 skipped default full-chain tests; `git diff --check` passed.

- [ ] **Step 3: Commit the completed slice**

Run:

```bash
git add src/client/modules/collection/collection.view.vue tests/e2e/full-chain/collection.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-collection-wrapper-dom-parity-design.md docs/superpowers/plans/2026-05-28-collection-wrapper-dom-parity.md
git diff --cached --check
git commit -m "fix: 还原合集 loaded 外层 DOM"
```

Expected: commit succeeds.

- [ ] **Step 4: Run post-commit checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean branch status for this slice, HEAD patch check passes, and `git diff --check` has no output.
