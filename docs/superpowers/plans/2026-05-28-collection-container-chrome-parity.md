# Collection Container Chrome Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Vue-only root chrome from the loaded collection container while preserving the old React collection layout behavior.

**Architecture:** Keep the old `srk-collection-container` class and stable `data-id="collection-content"` hook. Remove only the container-level `position` and `min-height` CSS rules, leaving nav, hidden header, ranklist panel, remaining-height, and mobile collapse styles untouched.

**Tech Stack:** Vue 3, ant-design-vue, Playwright full-chain E2E, RankLand mock backend.

---

### Task 1: RED Coverage

**Files:**
- Modify: `tests/e2e/full-chain/collection.spec.ts`

- [x] **Step 1: Assert loaded collection container has legacy root chrome**

In the `/collection/:id` happy-path test, after the existing `collection-content` class assertion, add:

```ts
await expect(page.locator('[data-id="collection-content"]')).toHaveCSS('position', 'static');
await expect(page.locator('[data-id="collection-content"]')).toHaveCSS('min-height', '0px');
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "renders selected ranklist through SSR, hydration, RanklandApiService, and the mock backend"
```

Observed: FAIL because the current Vue root computes `position: relative` instead of old React's default `static`.

### Task 2: Remove Root Chrome

**Files:**
- Modify: `src/client/modules/collection/collection.view.vue`

- [x] **Step 1: Remove root-only container CSS**

Delete this rule:

```css
.srk-collection-container {
  position: relative;
  min-height: 70vh;
}
```

Do not modify `.srk-collection-nav`, `.srk-collection-hidden-header`, `.srk-collection-ranklist`, or media-query styles.

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "renders selected ranklist through SSR, hydration, RanklandApiService, and the mock backend"
```

Observed: PASS with `position: static`, `min-height: 0px`, and existing loaded wrapper assertions still green.

### Task 3: Broaden Verification And Docs

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Run collection full-chain file**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts
```

Observed: all 11 collection full-chain tests passed.

- [x] **Step 2: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Observed: Node v24.11.1, pnpm 8.15.9, generated 6 client routes, migration tests passed, and whitespace check passed.

- [x] **Step 3: Update migration docs**

Record this slice as current verified focus, including RED/GREEN, collection full-chain, full gate evidence, and remaining recommended next slice.

Observed: `docs/migration/status.md`, `docs/migration/manual-acceptance-checklist.md`, and `docs/migration/final-integration-review.md` now record the collection root chrome RED/GREEN, collection full-chain 11-test evidence, full gate evidence, and unchanged review-driven next focus.

- [x] **Step 4: Commit**

Committed as:

```bash
git commit -m "fix: 还原合集容器根样式"
```
