# Playground Shell DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `/playground` shell DOM by replacing Vue-only `main.playground-page` and `.playground-layout` chrome with the legacy plain route `div` and `div.srk-playground-container`.

**Architecture:** Keep stable `data-id` selectors for migration coverage while removing product-only Vue classes from the route shell. Retarget scoped layout CSS to the old `.srk-playground-container` class so the visual layout stays unchanged.

**Tech Stack:** Vue 3 SFC scoped LESS, Playwright full-chain E2E, Node 24, pnpm 8.

---

### Task 1: RED - capture old Playground shell DOM

**Files:**
- Modify: `tests/e2e/full-chain/playground.spec.ts`

- [x] **Step 1: Add `getPlaygroundShellChrome()`**

Add a helper that returns the route wrapper tag/class/min-height and core container tag/class/display:

```ts
async function getPlaygroundShellChrome(page: Page) {
  return page.evaluate(() => {
    const pageElement = document.querySelector<HTMLElement>('[data-id="playground-page"]');
    const container = document.querySelector<HTMLElement>('.srk-playground-container');
    if (!pageElement || !container) {
      throw new Error('Missing playground shell target');
    }

    const pageStyle = window.getComputedStyle(pageElement);
    const containerStyle = window.getComputedStyle(container);
    return {
      pageTagName: pageElement.tagName,
      pageClasses: Array.from(pageElement.classList),
      pageMinHeight: pageStyle.minHeight,
      containerTagName: container.tagName,
      containerClasses: Array.from(container.classList),
      containerDisplay: containerStyle.display,
    };
  });
}
```

- [x] **Step 2: Assert the old shell contract**

In the first loaded Playground full-chain test, replace `.playground-layout` positive assertions with:

```ts
await expect(page.locator('.playground-layout')).toHaveCount(0);
expect(await getPlaygroundShellChrome(page)).toMatchObject({
  pageTagName: 'DIV',
  pageClasses: [],
  pageMinHeight: '0px',
  containerTagName: 'DIV',
  containerClasses: ['srk-playground-container'],
  containerDisplay: 'flex',
});
await expect(page.locator('.srk-playground-container')).toHaveCSS('display', 'flex');
await expect(page.locator('.srk-playground-container')).toHaveCSS('max-width', 'none');
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts -g "hydrates the CSR playground"
```

Observed RED: FAIL because current Vue still rendered `.playground-layout`; this confirmed the new shell assertion catches the Vue-only playground container chrome.

### Task 2: GREEN - restore old shell tags/classes

**Files:**
- Modify: `src/client/modules/playground/playground.view.vue`

- [x] **Step 1: Change the route wrapper**

Change:

```vue
<main data-id="playground-page" class="playground-page">
```

to:

```vue
<div data-id="playground-page">
```

and change the closing root tag from `</main>` to `</div>`.

- [x] **Step 2: Change the core container**

Change:

```vue
<section class="playground-layout srk-playground-container" :style="{ height: `${remainingHeight}px` }">
```

to:

```vue
<div class="srk-playground-container" :style="{ height: `${remainingHeight}px` }">
```

and change the matching closing `</section>` to `</div>`.

- [x] **Step 3: Retarget CSS to old class**

Delete:

```less
.playground-page {
  box-sizing: border-box;
  min-height: 70vh;
}
```

Change:

```less
.playground-layout {
  display: flex;
}
```

to:

```less
.srk-playground-container {
  display: flex;
}
```

Change the mobile media query selector from `.playground-layout` to `.srk-playground-container`.

- [x] **Step 4: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts -g "hydrates the CSR playground"
```

Observed GREEN: PASS with `1 passed`.

### Task 3: Migration docs, full gate, commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Update migration docs**

Record this slice as `Playground shell DOM parity`, including:

- route root old `DIV` evidence;
- no Vue-only `.playground-page` class;
- no route-local `70vh` min-height;
- core container exact `div.srk-playground-container` with no `.playground-layout`;
- focused RED/GREEN evidence;
- full gate evidence.

- [x] **Step 2: Run full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Observed: PASS. Node `v24.11.1`, pnpm `8.15.9`, generated 6 client routes, build passed, 36 unit files / 154 unit tests passed, 1 SSR smoke test passed, 1 shallow Playwright test passed, 60 full-chain tests passed with 1 conditional skip, and `git diff --check` produced no output.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/modules/playground/playground.view.vue tests/e2e/full-chain/playground.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-playground-shell-dom-parity-design.md docs/superpowers/plans/2026-05-28-playground-shell-dom-parity.md
git commit -m "fix: 还原 Playground 外壳 DOM"
```

- [x] **Step 4: Run post-checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Observed: clean branch status and no whitespace errors; `git show --check --oneline HEAD` reported the slice commit `fix: 还原 Playground 外壳 DOM`.
