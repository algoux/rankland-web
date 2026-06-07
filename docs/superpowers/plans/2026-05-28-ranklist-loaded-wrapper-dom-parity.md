# Ranklist Loaded Wrapper DOM Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `/ranklist/:id` loaded wrapper DOM by replacing Vue-only `main` / `section.ranklist-content` with plain `div` wrappers while preserving spacing and SSR behavior.

**Architecture:** Keep the change route-local to `ranklist.view.vue` and the Ranklist full-chain test. The stable `data-id="ranklist-content"` selector remains; product DOM parity is checked through tag names, exact class list, and computed spacing on the real mock-backed SSR route.

**Tech Stack:** Vue 3 SFC scoped LESS, Playwright full-chain E2E, bwcx/vite-ssr SSR route harness, Node 24, pnpm 8.

---

### Task 1: RED - capture old loaded wrapper DOM

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`

- [x] **Step 1: Add `getRanklistLoadedWrapperDom()` helper**

Add this helper near the existing route/content helper functions:

```ts
async function getRanklistLoadedWrapperDom(page: Page) {
  return page.evaluate(() => {
    const content = document.querySelector<HTMLElement>('[data-id="ranklist-content"]');
    if (!content || !(content.parentElement instanceof HTMLElement)) {
      throw new Error('Missing ranklist content wrapper');
    }

    const contentStyle = window.getComputedStyle(content);
    return {
      rootTagName: content.parentElement.tagName,
      rootClasses: Array.from(content.parentElement.classList),
      contentTagName: content.tagName,
      contentClasses: Array.from(content.classList),
      contentMarginTop: contentStyle.marginTop,
      contentMarginBottom: contentStyle.marginBottom,
    };
  });
}
```

- [x] **Step 2: Assert old loaded wrapper DOM in the first Ranklist full-chain test**

After the existing `getRouteContentSpacing(page, '[data-id="ranklist-content"]')` assertion, add:

```ts
expect(await getRanklistLoadedWrapperDom(page)).toMatchObject({
  rootTagName: 'DIV',
  rootClasses: [],
  contentTagName: 'DIV',
  contentClasses: ['mt-8', 'mb-8'],
  contentMarginTop: '32px',
  contentMarginBottom: '32px',
});
```

- [x] **Step 3: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page"
```

Observed RED: FAIL because current Vue returned root `MAIN`, content `SECTION`, and content classes `['ranklist-content', 'mt-8', 'mb-8']`.

### Task 2: GREEN - restore loaded wrapper DOM

**Files:**
- Modify: `src/client/modules/ranklist/ranklist.view.vue`

- [x] **Step 1: Change route root tag**

Change:

```vue
<main>
```

to:

```vue
<div>
```

and change the matching closing `</main>` to `</div>`.

- [x] **Step 2: Change loaded content wrapper**

Change:

```vue
<section
  v-else
  data-id="ranklist-content"
  class="ranklist-content mt-8 mb-8"
```

to:

```vue
<div
  v-else
  data-id="ranklist-content"
  class="mt-8 mb-8"
```

and change the matching closing `</section>` to `</div>`.

- [x] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the ranklist detail page"
```

Observed GREEN: PASS.

### Task 3: Migration docs, full gate, commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Update migration docs**

Record this slice as `Ranklist loaded wrapper DOM parity`, including:

- old React root/content `div` evidence;
- removal of Vue-only `ranklist-content` product class;
- focused RED/GREEN evidence;
- full gate evidence.

- [x] **Step 2: Run full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Observed: PASS. Node `v24.11.1`, pnpm `8.15.9`, generated 8 client routes, build passed, 35 unit files / 152 unit tests passed, 1 SSR smoke test passed, 1 shallow Playwright test passed, 60 full-chain tests passed with 1 conditional beian skip, and `git diff --check` produced no output.

- [ ] **Step 3: Commit**

Run:

```bash
git add src/client/modules/ranklist/ranklist.view.vue tests/e2e/full-chain/ranklist.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-28-ranklist-loaded-wrapper-dom-parity-design.md docs/superpowers/plans/2026-05-28-ranklist-loaded-wrapper-dom-parity.md
git commit -m "fix: 还原榜单详情 loaded 外层 DOM"
```

- [ ] **Step 4: Run post-checks**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean branch status and no whitespace errors.
