# Collection Hidden Header Title Style Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React collection hidden-header title inline style and line-height behavior.

**Architecture:** Keep the existing collection Vue route and full-chain collection harness. Extend the existing collection menu test to lock the old title style contract, then remove only the Vue-only title `marginTop` binding and scoped `line-height: 1` rule.

**Tech Stack:** Vue 3 SFC, scoped LESS, Playwright full-chain E2E, bwcx/vite-ssr route harness.

---

### Task 1: RED - Capture Hidden Header Title Style Contract

**Files:**
- Modify: `tests/e2e/full-chain/collection.spec.ts`

- [x] **Step 1: Add a title style helper**

Add this helper near the existing collection helper functions:

```ts
async function getCollectionHiddenTitleStyle(page: Page) {
  return page.locator('.srk-collection-hidden-header h3.mb-0').evaluate((element) => {
    const htmlElement = element as HTMLElement;
    const style = window.getComputedStyle(htmlElement);
    return {
      inlineFontSize: htmlElement.style.fontSize,
      inlineMarginLeft: htmlElement.style.marginLeft,
      inlineMarginTop: htmlElement.style.marginTop,
      computedFontSize: style.fontSize,
      computedLineHeight: style.lineHeight,
    };
  });
}
```

- [x] **Step 2: Assert expanded and collapsed old title style**

In `renders the legacy Ant Design collection menu with category icons`, after the existing hidden title text assertion, add:

```ts
const expandedHiddenTitleStyle = await getCollectionHiddenTitleStyle(page);
expect(expandedHiddenTitleStyle.inlineFontSize).toBe('');
expect(expandedHiddenTitleStyle.inlineMarginLeft).toBe('8px');
expect(expandedHiddenTitleStyle.inlineMarginTop).toBe('');
expect(Number.parseFloat(expandedHiddenTitleStyle.computedLineHeight)).toBeGreaterThan(
  Number.parseFloat(expandedHiddenTitleStyle.computedFontSize),
);
```

After clicking the collapse button and asserting the menu-unfold icon, add:

```ts
const collapsedHiddenTitleStyle = await getCollectionHiddenTitleStyle(page);
expect(collapsedHiddenTitleStyle.inlineFontSize).toBe('14px');
expect(collapsedHiddenTitleStyle.inlineMarginLeft).toBe('0px');
expect(collapsedHiddenTitleStyle.inlineMarginTop).toBe('');
expect(Number.parseFloat(collapsedHiddenTitleStyle.computedLineHeight)).toBeGreaterThan(
  Number.parseFloat(collapsedHiddenTitleStyle.computedFontSize),
);
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "renders the legacy Ant Design collection menu with category icons"
```

Observed: FAIL because current Vue emits expanded inline `marginTop: 0px`, where old React emitted no inline `marginTop`.

### Task 2: GREEN - Remove Vue-Only Title Style

**Files:**
- Modify: `src/client/modules/collection/collection.view.vue`

- [x] **Step 1: Remove inline `marginTop` binding**

Change:

```vue
:style="{
  fontSize: collapsed ? '14px' : undefined,
  marginLeft: collapsed ? '0px' : '8px',
  marginTop: collapsed ? '4px' : '0px',
}"
```

to:

```vue
:style="{
  fontSize: collapsed ? '14px' : undefined,
  marginLeft: collapsed ? '0px' : '8px',
}"
```

- [x] **Step 2: Remove scoped title line-height override**

Delete:

```less
.srk-collection-hidden-header h3 {
  line-height: 1;
}
```

- [x] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "renders the legacy Ant Design collection menu with category icons"
```

Observed: PASS with 1 focused collection menu test.

- [x] **Step 4: Run collection full-chain regression**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts
```

Observed: PASS with 11 collection full-chain tests.

### Task 3: Document, Gate, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-28-collection-hidden-header-title-style-parity.md`

- [x] **Step 1: Update migration docs**

Record:

- slice name: `Collection hidden-header title style parity`;
- RED evidence for Vue-only title `marginTop` and `line-height: 1`;
- GREEN evidence for focused collection menu test;
- collection full-chain regression and full gate evidence;
- route progress updates for `/collection/:id`.

- [x] **Step 2: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Observed: PASS with Node `v24.11.1`, pnpm `8.15.9`, generated 8 client routes, build success, 35 unit files / 152 unit tests, 1 SSR smoke test, 1 shallow Playwright test, 60 passed / 1 skipped default full-chain Playwright tests, and no `git diff --check` output.

- [x] **Step 3: Commit the completed slice**

Run:

```bash
git add src/client/modules/collection/collection.view.vue tests/e2e/full-chain/collection.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-collection-hidden-header-title-style-parity-design.md docs/superpowers/plans/2026-05-28-collection-hidden-header-title-style-parity.md
git diff --cached --check
git commit -m "fix: 还原合集隐藏标题样式"
```

Observed: commit succeeded with message `fix: 还原合集隐藏标题样式`.

- [x] **Step 4: Run post-commit checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean branch status, HEAD patch check passes, and no whitespace errors.
