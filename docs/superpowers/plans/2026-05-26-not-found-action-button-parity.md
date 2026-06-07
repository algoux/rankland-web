# Not Found Action Button Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React Ant Design primary small Back-to-Home buttons on migrated Not Found states.

**Architecture:** Keep each route's existing Not Found branch and stable `data-id` link. Replace the plain link text with an Ant Design Vue `<a-button type="primary" size="small">` child so navigation and test selectors remain stable.

**Tech Stack:** Vue 3 Options API templates, Ant Design Vue Button, Playwright full-chain E2E.

---

### Task 1: Red Tests

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `tests/e2e/full-chain/live.spec.ts`
- Modify: `tests/e2e/full-chain/collection.spec.ts`

- [x] **Step 1: Assert ranklist Not Found Ant Design button**

In `renders the Not Found page when the backend returns missing ranklist`, add:

```ts
await expect(page.locator('[data-id="ranklist-not-found"] h3')).toHaveText('Ranklist Not Found');
await expect(page.locator('[data-id="ranklist-not-found-home-link"] .ant-btn')).toHaveClass(/ant-btn-primary/);
await expect(page.locator('[data-id="ranklist-not-found-home-link"] .ant-btn')).toHaveClass(/ant-btn-sm/);
```

- [x] **Step 2: Assert live Not Found Ant Design button**

In `renders the Not Found page when the backend returns missing live contest info`, add:

```ts
await expect(page.locator('[data-id="live-not-found"] h3')).toHaveText('Ranklist Not Found');
await expect(page.locator('[data-id="live-not-found-home-link"] .ant-btn')).toHaveClass(/ant-btn-primary/);
await expect(page.locator('[data-id="live-not-found-home-link"] .ant-btn')).toHaveClass(/ant-btn-sm/);
```

- [x] **Step 3: Assert collection Not Found Ant Design button**

In `renders collection not found for a missing collection`, add:

```ts
await expect(page.locator('[data-id="collection-not-found"] h3')).toHaveText('Collection Not Found');
await expect(page.locator('[data-id="collection-not-found-home-link"] .ant-btn')).toHaveClass(/ant-btn-primary/);
await expect(page.locator('[data-id="collection-not-found-home-link"] .ant-btn')).toHaveClass(/ant-btn-sm/);
```

- [x] **Step 4: Run focused full-chain tests and confirm RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/live.spec.ts tests/e2e/full-chain/collection.spec.ts
```

Expected: fail because current Vue Not Found links are plain text and headings are `h1`.

### Task 2: Vue Not Found UI

**Files:**
- Modify: `src/client/modules/ranklist/ranklist.view.vue`
- Modify: `src/client/modules/live/live.view.vue`
- Modify: `src/client/modules/collection/collection.view.vue`

- [x] **Step 1: Restore ranklist Not Found button**

Change the ranklist Not Found branch to:

```vue
<section v-if="isNotFound" data-id="ranklist-not-found" class="ranklist-state">
  <h3>Ranklist Not Found</h3>
  <router-link to="/" data-id="ranklist-not-found-home-link">
    <a-button type="primary" size="small">Back to Home</a-button>
  </router-link>
</section>
```

Add scoped CSS:

```less
.ranklist-state {
  padding-top: 64px;
  text-align: center;
}

.ranklist-state h3 {
  margin: 0 0 16px;
}
```

- [x] **Step 2: Restore live Not Found button**

Change the live Not Found branch to:

```vue
<section v-if="isNotFound" data-id="live-not-found" class="live-state">
  <h3>Ranklist Not Found</h3>
  <router-link to="/" data-id="live-not-found-home-link">
    <a-button type="primary" size="small">Back to Home</a-button>
  </router-link>
</section>
```

Add `.live-state h3 { margin: 0 0 16px; }` to the scoped style.

- [x] **Step 3: Restore collection Not Found button**

Change the collection Not Found branch to:

```vue
<section v-if="isNotFound" data-id="collection-not-found" class="collection-state">
  <h3>Collection Not Found</h3>
  <router-link to="/" data-id="collection-not-found-home-link">
    <a-button type="primary" size="small">Back to Home</a-button>
  </router-link>
</section>
```

Add `.collection-state h3 { margin: 0 0 16px; }` to the scoped style.

- [x] **Step 4: Run focused verification**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/live.spec.ts tests/e2e/full-chain/collection.spec.ts
```

Expected: pass.

### Task 3: Gates, Docs, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/superpowers/plans/2026-05-26-not-found-action-button-parity.md`

- [x] **Step 1: Run required gates**

Run:

```bash
corepack pnpm run gen:client-router
corepack pnpm test:migration
git diff --check
```

Expected: all pass.

- [x] **Step 2: Update migration docs**

Record Not Found Ant Design action parity for ranklist, collection, and live.

- [x] **Step 3: Commit the slice**

Run:

```bash
git status --short
git add src/client/modules/ranklist/ranklist.view.vue src/client/modules/live/live.view.vue src/client/modules/collection/collection.view.vue tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/live.spec.ts tests/e2e/full-chain/collection.spec.ts docs/migration/status.md docs/superpowers/specs/2026-05-26-not-found-action-button-parity-design.md docs/superpowers/plans/2026-05-26-not-found-action-button-parity.md
git commit -m "feat: 收口未找到状态按钮一致性"
```

Expected: commit succeeds with only this slice's files.
