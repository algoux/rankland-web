# Live Content Wrapper DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `/live/:id` loaded content wrapper DOM by rendering `div.mt-8.mb-8` with the scroll-solution offset as inline style.

**Architecture:** Keep the existing Live Vue route and stable `data-id` hooks. Extend the existing Live full-chain wrapper helper to assert tag/class/style contracts, then remove only the Vue-only content classes and CSS selector while leaving Live behavior intact.

**Tech Stack:** Vue 3 SFC, scoped LESS, Playwright full-chain E2E, bwcx/vite-ssr route harness.

---

### Task 1: RED - Capture Live Content Wrapper DOM

**Files:**
- Modify: `tests/e2e/full-chain/live.spec.ts`

- [x] **Step 1: Extend `getLiveWrapperChrome()`**

Add loaded content DOM fields to the helper return object:

```ts
return {
  pageTagName: pageElement.tagName,
  pageClasses: Array.from(pageElement.classList),
  pageMinHeight: pageStyle.minHeight,
  pagePaddingTop: pageStyle.paddingTop,
  pagePaddingRight: pageStyle.paddingRight,
  pagePaddingBottom: pageStyle.paddingBottom,
  pagePaddingLeft: pageStyle.paddingLeft,
  contentTagName: contentElement.tagName,
  contentClasses: Array.from(contentElement.classList),
  contentMaxWidth: contentStyle.maxWidth,
  contentMarginLeft: contentStyle.marginLeft,
  contentMarginRight: contentStyle.marginRight,
};
```

- [x] **Step 2: Assert exact old loaded content wrapper DOM**

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
  contentTagName: 'DIV',
  contentClasses: ['mt-8', 'mb-8'],
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

Observed: FAIL because current Vue rendered `SECTION` and included `live-content` / `live-content-with-scroll-solution` classes.

### Task 2: GREEN - Restore Old Content Wrapper

**Files:**
- Modify: `src/client/modules/live/live.view.vue`

- [x] **Step 1: Change the loaded content wrapper**

Replace:

```vue
<section
  v-else
  data-id="live-ranklist-content"
  class="live-content mt-8 mb-8"
  :data-ranklist-id="id"
  :data-live-id="liveId"
  :data-row-count="rowCount"
  :data-focus="focusQuery"
  :class="{ 'live-content-with-scroll-solution': scrollSolutionEnabled }"
>
```

with:

```vue
<div
  v-else
  data-id="live-ranklist-content"
  class="mt-8 mb-8"
  :data-ranklist-id="id"
  :data-live-id="liveId"
  :data-row-count="rowCount"
  :data-focus="focusQuery"
  :style="{ marginLeft: scrollSolutionEnabled ? '250px' : undefined }"
>
```

Change the matching closing tag from `</section>` to `</div>`.

- [x] **Step 2: Remove unused content wrapper CSS**

Delete these selectors:

```less
.live-state,
.live-content {
  margin-right: 0;
  margin-left: 0;
}

.live-content-with-scroll-solution {
  margin-left: 250px;
  margin-right: 0;
}

@media (max-width: 767px) {
  .live-content-with-scroll-solution {
    margin-right: auto;
    margin-left: auto;
  }
}
```

Keep `.live-state` as its own selector if needed:

```less
.live-state {
  margin-right: 0;
  margin-left: 0;
  margin-top: 64px;
  margin-bottom: 32px;
  text-align: center;
}
```

- [x] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hydrates the CSR live page"
```

Observed: PASS.

- [x] **Step 4: Run Live full-chain regression**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts
```

Observed: initially failed because the existing mobile realtime bounds assertion expected `content.left < 250`, while old React keeps the inline `250px` content offset on mobile when `scrollSolution=1`. After aligning that assertion to `content.left === 250` and retaining panel/progress viewport checks, the Live full-chain regression passed with 11 tests.

### Task 3: Document, Gate, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-28-live-content-wrapper-dom-parity.md`

- [x] **Step 1: Update migration docs**

Record:

- slice name: `Live content wrapper DOM parity`;
- RED evidence for old React `DIV.mt-8.mb-8` wrapper and inline scroll-solution offset;
- GREEN evidence for the focused Live route test;
- full Live regression and full gate evidence;
- route progress updates for `/live/:id`.

- [x] **Step 2: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Observed: PASS with Node `v24.11.1`, pnpm `8.15.9`, generated 8 client routes, build success, 35 unit files / 152 unit tests, 1 SSR smoke test, 1 shallow Playwright test, 60 passed / 1 skipped default full-chain Playwright tests, and no `git diff --check` output.

- [x] **Step 3: Commit the completed slice**

Run:

```bash
git add src/client/modules/live/live.view.vue tests/e2e/full-chain/live.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-live-content-wrapper-dom-parity-design.md docs/superpowers/plans/2026-05-28-live-content-wrapper-dom-parity.md
git diff --cached --check
git commit -m "fix: 还原 Live 内容外层 DOM"
```

Observed: commit succeeded with message `fix: 还原 Live 内容外层 DOM`.

- [x] **Step 4: Run post-commit checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean branch status, HEAD patch check passes, and no whitespace errors.
