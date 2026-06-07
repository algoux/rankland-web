# Live Root Wrapper DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `/live/:id` loaded root wrapper DOM by replacing Vue-only `main.live-page` with a plain `div` and removing the route-local min-height.

**Architecture:** Keep the stable `[data-id="live-page"]` test hook but align the product DOM and computed style with old React. Use the existing Live full-chain route test to cover tag name, class list, and computed min-height while leaving data loading and SRK rendering unchanged.

**Tech Stack:** Vue 3 SFC scoped LESS, Playwright full-chain E2E, Node 24, pnpm 8.

---

### Task 1: RED - capture old Live root wrapper DOM

**Files:**
- Modify: `tests/e2e/full-chain/live.spec.ts`

- [x] **Step 1: Extend `getLiveWrapperChrome()`**

Add root DOM fields to the helper return object:

```ts
return {
  pageTagName: pageElement.tagName,
  pageClasses: Array.from(pageElement.classList),
  pageMinHeight: pageStyle.minHeight,
  pagePaddingTop: pageStyle.paddingTop,
  pagePaddingRight: pageStyle.paddingRight,
  pagePaddingBottom: pageStyle.paddingBottom,
  pagePaddingLeft: pageStyle.paddingLeft,
  contentMaxWidth: contentStyle.maxWidth,
  contentMarginLeft: contentStyle.marginLeft,
  contentMarginRight: contentStyle.marginRight,
};
```

- [x] **Step 2: Assert the old root DOM contract**

In the first Live full-chain test, extend the existing wrapper assertion:

```ts
expect(await getLiveWrapperChrome(page)).toMatchObject({
  pageTagName: 'DIV',
  pageClasses: [],
  pageMinHeight: '0px',
  pagePaddingTop: '0px',
  pagePaddingRight: '0px',
  pagePaddingBottom: '0px',
  pagePaddingLeft: '0px',
  contentMaxWidth: 'none',
  contentMarginLeft: '250px',
  contentMarginRight: '0px',
});
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hydrates the CSR live page"
```

Observed RED: FAIL because current Vue returned `MAIN`, included `live-page`, and computed `pageMinHeight: "504px"` in the focused viewport.

### Task 2: GREEN - restore old root wrapper

**Files:**
- Modify: `src/client/modules/live/live.view.vue`

- [x] **Step 1: Change the template root**

Change:

```vue
<main data-id="live-page" class="live-page">
```

to:

```vue
<div data-id="live-page">
```

and change the closing root tag from `</main>` to `</div>`.

- [x] **Step 2: Remove unused `.live-page` CSS**

Delete:

```less
.live-page {
  min-height: 70vh;
}
```

- [x] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hydrates the CSR live page"
```

Observed GREEN: PASS.

### Task 3: Migration docs, full gate, commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Update migration docs**

Record this slice as `Live root wrapper DOM parity`, including:

- old React root `div` evidence;
- no Vue-only `.live-page` class;
- no route-local `70vh` min-height;
- focused RED/GREEN evidence;
- full gate evidence.

- [x] **Step 2: Run full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Observed: PASS twice after implementation and after migration docs updates. Node `v24.11.1`, pnpm `8.15.9`, generated 8 client routes, build passed, 35 unit files / 152 unit tests passed, 1 SSR smoke test passed, 1 shallow Playwright test passed, 60 full-chain tests passed with 1 conditional beian skip, and `git diff --check` produced no output.

- [ ] **Step 3: Commit**

Run:

```bash
git add src/client/modules/live/live.view.vue tests/e2e/full-chain/live.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-live-root-wrapper-dom-parity-design.md docs/superpowers/plans/2026-05-28-live-root-wrapper-dom-parity.md
git commit -m "fix: 还原 Live 根节点 DOM"
```

- [ ] **Step 4: Run post-checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean branch status and no whitespace errors.
