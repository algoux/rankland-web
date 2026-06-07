# Live Route Wrapper Chrome Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React live route wrapper chrome by removing Vue-only live page padding, max-width capping, auto-centering, and extra scroll-solution right margin.

**Architecture:** Keep the change isolated to the live route CSS and full-chain route test. The public contract is measured through Playwright computed styles on the real route with the mock backend and stub WebSocket, while the SRK wrapper, Toastify, and data flow remain unchanged.

**Tech Stack:** Vue 3 SFC scoped LESS, Playwright full-chain E2E, bwcx/vite-ssr route harness.

---

### Task 1: RED - capture old live wrapper chrome

**Files:**
- Modify: `tests/e2e/full-chain/live.spec.ts`

- [x] **Step 1: Add helper for wrapper chrome**

Add this helper near `getRouteContentSpacing()`:

```ts
async function getLiveWrapperChrome(page: Page) {
  return page.evaluate(() => {
    const pageElement = document.querySelector<HTMLElement>('[data-id="live-page"]');
    const contentElement = document.querySelector<HTMLElement>('[data-id="live-ranklist-content"]');
    if (!pageElement || !contentElement) {
      throw new Error('Missing live page or content element');
    }
    const pageStyle = window.getComputedStyle(pageElement);
    const contentStyle = window.getComputedStyle(contentElement);
    return {
      pagePaddingTop: pageStyle.paddingTop,
      pagePaddingRight: pageStyle.paddingRight,
      pagePaddingBottom: pageStyle.paddingBottom,
      pagePaddingLeft: pageStyle.paddingLeft,
      contentMaxWidth: contentStyle.maxWidth,
      contentMarginLeft: contentStyle.marginLeft,
      contentMarginRight: contentStyle.marginRight,
    };
  });
}
```

- [x] **Step 2: Add assertion to the first live full-chain test**

After the existing `getRouteContentSpacing()` assertion for `/live/live-test-key?token=t0&scrollSolution=1&focus=yes`, add:

```ts
expect(await getLiveWrapperChrome(page)).toMatchObject({
  pagePaddingTop: '0px',
  pagePaddingRight: '0px',
  pagePaddingBottom: '0px',
  pagePaddingLeft: '0px',
  contentMaxWidth: 'none',
  contentMarginLeft: '250px',
  contentMarginRight: '0px',
});
```

- [x] **Step 3: Run the focused full-chain test to verify RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hydrates the CSR live page"
```

Observed RED: the assertion failed because current Vue reported `24px`/`16px` page padding, `1280px` max-width, and `16px` right margin.

### Task 2: GREEN - remove Vue-only live route chrome

**Files:**
- Modify: `src/client/modules/live/live.view.vue`

- [x] **Step 1: Update live route scoped CSS**

Change the CSS so it keeps old margins and removes Vue-only chrome:

```less
.live-page {
  min-height: 70vh;
}

.live-state,
.live-content {
  margin-right: 0;
  margin-left: 0;
}

.live-content-with-scroll-solution {
  margin-left: 250px;
  margin-right: 0;
}
```

Keep the existing mobile media rule that returns scroll-solution content to `margin-left: auto` / `margin-right: auto` on narrow screens.

- [x] **Step 2: Run the focused full-chain test to verify GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "hydrates the CSR live page"
```

Observed GREEN: the focused live full-chain test passed.

- [x] **Step 3: Run live full-chain route file**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts
```

Observed GREEN: all 10 live full-chain tests passed, including existing desktop/mobile no-overflow checks.

### Task 3: Full gate, docs, commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Run the migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Observed: Node `v24.11.1`, pnpm `8.15.9`, generated 8 routes, `test:migration` passed, and `git diff --check` passed.

- [x] **Step 2: Update migration docs**

Record:

- slice name: `Live route wrapper chrome parity`
- focused RED/GREEN evidence
- full gate evidence
- `/live/:id` now preserves old loaded wrapper no-padding/no-width-cap/no-auto-centering contract while retaining scroll-solution `250px` offset and mobile bounds.

- [ ] **Step 3: Stage and commit**

Run:

```bash
git add src/client/modules/live/live.view.vue tests/e2e/full-chain/live.spec.ts docs/superpowers/specs/2026-05-27-live-route-wrapper-chrome-parity-design.md docs/superpowers/plans/2026-05-27-live-route-wrapper-chrome-parity.md docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md
git diff --cached --check
git commit -m "fix: 还原实时页面外层布局"
```
