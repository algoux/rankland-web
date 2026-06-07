# Collection Selected Ranklist pb-8 Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React `pb-8` class token on the `/collection/:id` selected ranklist content wrapper.

**Architecture:** Keep the change route-local in `collection.view.vue`. Full-chain tests assert the DOM class token and existing computed 32px bottom spacing on the real mock-backed collection route.

**Tech Stack:** Vue 3 SFC scoped LESS, Playwright full-chain E2E, bwcx/vite-ssr route harness.

---

### Task 1: RED - capture selected ranklist class token

**Files:**
- Modify: `tests/e2e/full-chain/collection.spec.ts`

- [x] **Step 1: Add selected ranklist `pb-8` assertion**

In `tests/e2e/full-chain/collection.spec.ts`, immediately after the existing visible assertion for `[data-id="collection-ranklist-content"][data-ranklist-id="test-key"][data-row-count="2"]`, add:

```ts
await expect(page.locator('[data-id="collection-ranklist-content"]')).toHaveClass(/(^|\s)pb-8(\s|$)/);
```

- [x] **Step 2: Run focused test to verify RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "renders selected ranklist"
```

Observed RED: failed because the wrapper class was `collection-ranklist-content` and did not include `pb-8`.

### Task 2: GREEN - restore class token and spacing contract

**Files:**
- Modify: `src/client/modules/collection/collection.view.vue`

- [x] **Step 1: Update selected ranklist wrapper class**

Change:

```vue
class="collection-ranklist-content"
```

to:

```vue
class="collection-ranklist-content pb-8"
```

- [x] **Step 2: Keep route-local utility spacing explicit**

Replace the route-specific padding declaration:

```less
.collection-ranklist-content {
  padding-bottom: 32px;
}
```

with:

```less
.pb-8 {
  padding-bottom: 32px;
}
```

- [x] **Step 3: Run focused test to verify GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "renders selected ranklist"
```

Observed GREEN: focused collection full-chain test passed with `pb-8` class token and 32px bottom padding.

### Task 3: Full gate, docs, commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Run full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Observed: Node `v24.11.1`, pnpm `8.15.9`, generated 8 routes, `test:migration` passed, and `git diff --check` passed.

- [x] **Step 2: Update migration docs**

Record:

- slice name: `Collection selected-ranklist pb-8 class parity`
- RED/GREEN evidence for the collection selected ranklist wrapper
- full gate evidence
- route progress updates for `/collection/:id`

- [x] **Step 3: Stage and commit**

Run:

```bash
git add src/client/modules/collection/collection.view.vue tests/e2e/full-chain/collection.spec.ts docs/superpowers/specs/2026-05-27-collection-ranklist-pb8-class-parity-design.md docs/superpowers/plans/2026-05-27-collection-ranklist-pb8-class-parity.md docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md
git diff --cached --check
git commit -m "fix: 还原合集选中榜单底部间距类名"
```
