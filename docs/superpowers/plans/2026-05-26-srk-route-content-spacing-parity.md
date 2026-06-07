# SRK Route Content Spacing Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React route-level spacing around SRK ranklist content containers.

**Architecture:** Keep the existing route components and stable `data-id` values. Add narrow route-scoped classes/styles that reproduce old Tailwind `mt-8 mb-8` and `pb-8` semantics without touching shared SRK rendering or app shell layout.

**Tech Stack:** Vue 3 Options API, scoped LESS, Playwright full-chain E2E.

---

### Task 1: Red Tests

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `tests/e2e/full-chain/live.spec.ts`
- Modify: `tests/e2e/full-chain/collection.spec.ts`

- [x] **Step 1: Add route content computed-style helpers**

Add a local helper in each spec that reads computed spacing from the route content selector:

```ts
async function getRouteContentSpacing(page: Page, selector: string) {
  return page.evaluate((selector) => {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) {
      throw new Error(`Missing route content element: ${selector}`);
    }
    const style = window.getComputedStyle(element);
    return {
      marginTop: style.marginTop,
      marginBottom: style.marginBottom,
      paddingBottom: style.paddingBottom,
    };
  }, selector);
}
```

- [x] **Step 2: Assert standalone ranklist route spacing**

In the first `/ranklist/:id` full-chain test, assert:

```ts
expect(await getRouteContentSpacing(page, '[data-id="ranklist-content"]')).toMatchObject({
  marginTop: '32px',
  marginBottom: '32px',
});
```

- [x] **Step 3: Assert live route spacing**

In the first `/live/:id` full-chain test, assert:

```ts
expect(await getRouteContentSpacing(page, '[data-id="live-ranklist-content"]')).toMatchObject({
  marginTop: '32px',
  marginBottom: '32px',
});
```

- [x] **Step 4: Assert collection selected-ranklist spacing**

In the first `/collection/:id` selected-ranklist test, assert:

```ts
expect(await getRouteContentSpacing(page, '[data-id="collection-ranklist-content"]')).toMatchObject({
  paddingBottom: '32px',
});
```

- [x] **Step 5: Run focused full-chain tests and confirm RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/live.spec.ts tests/e2e/full-chain/collection.spec.ts
```

Expected: fail because current Vue route containers do not restore the old `mt-8 mb-8` / `pb-8` spacing.

### Task 2: Vue Route Spacing

**Files:**
- Modify: `src/client/modules/ranklist/ranklist.view.vue`
- Modify: `src/client/modules/live/live.view.vue`
- Modify: `src/client/modules/collection/collection.view.vue`

- [x] **Step 1: Restore ranklist content margin**

Add `class="ranklist-content"` to the `data-id="ranklist-content"` section and add scoped CSS:

```less
.ranklist-content {
  margin: 32px 0;
}
```

- [x] **Step 2: Restore live content margin while preserving horizontal layout**

Change `.live-content` from:

```less
margin: 0 auto;
```

to:

```less
margin: 32px auto;
```

- [x] **Step 3: Restore collection selected-ranklist bottom padding**

Add `class="collection-ranklist-content"` to the `data-id="collection-ranklist-content"` element and add scoped CSS:

```less
.collection-ranklist-content {
  padding-bottom: 32px;
}
```

- [x] **Step 4: Run focused verification**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/live.spec.ts tests/e2e/full-chain/collection.spec.ts
```

Expected: pass.

### Task 3: Gates, Docs, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/superpowers/plans/2026-05-26-srk-route-content-spacing-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration docs**

Record route content spacing parity for ranklist/live/collection while keeping remaining lower-level SRK table pixel parity scoped to product-review-driven renderer details.

- [x] **Step 3: Commit the slice**

Run:

```bash
git status --short
git add src/client/modules/ranklist/ranklist.view.vue src/client/modules/live/live.view.vue src/client/modules/collection/collection.view.vue tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/live.spec.ts tests/e2e/full-chain/collection.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-26-srk-route-content-spacing-parity-design.md docs/superpowers/plans/2026-05-26-srk-route-content-spacing-parity.md
git commit -m "feat: 收口榜单路由内容间距一致性"
```

Expected: commit succeeds with only this slice's files.
