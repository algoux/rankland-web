# Route State Utility Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old React utility class tokens on migrated route state DOM for ranklist, live, and collection pages.

**Architecture:** Keep current Vue route state hooks and `data-id` selectors, but add old utility classes to the actual state wrapper/spinner DOM. Use full-chain E2E for public DOM behavior and focused unit source checks for loading spinner templates.

**Tech Stack:** Vue 3 SFC templates, Ant Design Vue, Playwright full-chain tests, Vitest source-level unit tests.

---

### Task 1: Add RED Assertions

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `tests/e2e/full-chain/live.spec.ts`
- Modify: `tests/e2e/full-chain/collection.spec.ts`
- Modify: `tests/unit/ranklist-loading.spec.ts`
- Modify: `tests/unit/collection-loading.spec.ts`
- Modify: `tests/unit/collection-ranklist-loading.spec.ts`

- [ ] **Step 1: Assert route state utility classes in full-chain tests**

Add class-token assertions next to the existing NotFound and generic-error checks:

```ts
await expect(page.locator('[data-id="ranklist-not-found"]')).toHaveClass(/(^|\s)mt-16(\s|$)/);
await expect(page.locator('[data-id="ranklist-not-found"]')).toHaveClass(/(^|\s)text-center(\s|$)/);
await expect(page.locator('[data-id="ranklist-not-found"] h3')).toHaveClass(/(^|\s)mb-4(\s|$)/);
await expect(page.locator('[data-id="ranklist-error"]')).toHaveClass(/(^|\s)mt-16(\s|$)/);
await expect(page.locator('[data-id="ranklist-error"]')).toHaveClass(/(^|\s)text-center(\s|$)/);

await expect(page.locator('[data-id="live-not-found"]')).toHaveClass(/(^|\s)mt-16(\s|$)/);
await expect(page.locator('[data-id="live-not-found"]')).toHaveClass(/(^|\s)text-center(\s|$)/);
await expect(page.locator('[data-id="live-not-found"] h3')).toHaveClass(/(^|\s)mb-4(\s|$)/);
await expect(page.locator('[data-id="live-error"]')).toHaveClass(/(^|\s)mt-16(\s|$)/);
await expect(page.locator('[data-id="live-error"]')).toHaveClass(/(^|\s)text-center(\s|$)/);

await expect(page.locator('[data-id="collection-not-found"]')).toHaveClass(/(^|\s)pt-16(\s|$)/);
await expect(page.locator('[data-id="collection-not-found"]')).toHaveClass(/(^|\s)text-center(\s|$)/);
await expect(page.locator('[data-id="collection-not-found"] h3')).toHaveClass(/(^|\s)mb-4(\s|$)/);
await expect(page.locator('[data-id="collection-error"]')).toHaveClass(/(^|\s)pt-16(\s|$)/);
await expect(page.locator('[data-id="collection-error"]')).toHaveClass(/(^|\s)text-center(\s|$)/);
await expect(page.locator('[data-id="collection-ranklist-error"]')).toHaveClass(/(^|\s)pt-16(\s|$)/);
await expect(page.locator('[data-id="collection-ranklist-error"]')).toHaveClass(/(^|\s)text-center(\s|$)/);
```

- [ ] **Step 2: Assert loading spinner utility classes in unit tests**

Update source assertions to expect:

```ts
class="ranklist-state mt-16 text-center"
class="collection-state pt-16 text-center"
```

- [ ] **Step 3: Verify RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the Not Found page when the backend returns missing ranklist"
```

Expected: FAIL because `[data-id="ranklist-not-found"]` lacks `mt-16`.

Run:

```bash
corepack pnpm exec vitest run tests/unit/ranklist-loading.spec.ts tests/unit/collection-loading.spec.ts tests/unit/collection-ranklist-loading.spec.ts
```

Expected: FAIL because loading templates still use only `ranklist-state` / `collection-state`.

### Task 2: Restore Vue Route State Utility Classes

**Files:**
- Modify: `src/client/modules/ranklist/ranklist.view.vue`
- Modify: `src/client/modules/live/live.view.vue`
- Modify: `src/client/modules/collection/collection.view.vue`

- [ ] **Step 1: Add ranklist utility tokens**

Use:

```vue
class="ranklist-state mt-16 text-center"
<h3 class="mb-4">Ranklist Not Found</h3>
```

- [ ] **Step 2: Add live utility tokens**

Use:

```vue
class="live-state mt-16 text-center"
<h3 class="mb-4">Ranklist Not Found</h3>
```

- [ ] **Step 3: Add collection utility tokens**

Use:

```vue
class="collection-state pt-16 text-center"
<h3 class="mb-4">Collection Not Found</h3>
```

- [ ] **Step 4: Verify GREEN narrowly**

Run:

```bash
corepack pnpm exec vitest run tests/unit/ranklist-loading.spec.ts tests/unit/collection-loading.spec.ts tests/unit/collection-ranklist-loading.spec.ts
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts -g "renders the Not Found page when the backend returns missing ranklist"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/live.spec.ts -g "renders the Not Found page when the backend returns missing live contest info|renders the legacy live load error state"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "renders collection not found|renders the legacy collection load error state|renders the legacy selected ranklist error state"
```

Expected: PASS.

### Task 3: Document, Gate, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [ ] **Step 1: Update migration docs**

Record route-state utility-class parity for ranklist/live/collection, including NotFound heading `mb-4`, route state `mt-16 text-center`, and collection state `pt-16 text-center`.

- [ ] **Step 2: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: PASS with Node `v24.11.1`, pnpm `8.15.9`, generated client routes, build/unit/SSR/E2E/full-chain gate success, and no whitespace errors.

- [ ] **Step 3: Commit**

Run:

```bash
git add src/client/modules/ranklist/ranklist.view.vue src/client/modules/live/live.view.vue src/client/modules/collection/collection.view.vue tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/live.spec.ts tests/e2e/full-chain/collection.spec.ts tests/unit/ranklist-loading.spec.ts tests/unit/collection-loading.spec.ts tests/unit/collection-ranklist-loading.spec.ts docs/superpowers/specs/2026-05-27-route-state-utility-class-parity-design.md docs/superpowers/plans/2026-05-27-route-state-utility-class-parity.md docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md
git commit -m "fix: 还原路由状态工具类"
```

Expected: commit succeeds on `migration/live-page-foundation`.
