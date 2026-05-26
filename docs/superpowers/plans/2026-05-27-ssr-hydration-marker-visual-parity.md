# SSR Hydration Marker Visual Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide `/ranklist/:id` and `/collection/:id` hydration probes from product UI while preserving full-chain test selectors.

**Architecture:** Keep probes in the route components and add route-local scoped CSS classes that match existing hidden marker behavior on other migrated pages. Prove behavior with full-chain Playwright CSS assertions before touching production code.

**Tech Stack:** Vue 3 single-file components, Less scoped styles, Playwright full-chain tests, pnpm migration gates.

---

### Task 1: Add RED Full-Chain Assertions

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `tests/e2e/full-chain/collection.spec.ts`

- [ ] **Step 1: Write the failing tests**

Add CSS assertions after the existing `toHaveText('hydrated')` checks in the main ranklist and collection route tests:

```ts
await expect(page.locator('[data-id="ranklist-hydrated"]')).toHaveCSS('width', '1px');
await expect(page.locator('[data-id="ranklist-hydrated"]')).toHaveCSS('height', '1px');
await expect(page.locator('[data-id="ranklist-hydrated"]')).toHaveCSS('overflow', 'hidden');
await expect(page.locator('[data-id="ranklist-hydrated"]')).toHaveCSS('color', 'rgba(0, 0, 0, 0)');
```

```ts
await expect(page.locator('[data-id="collection-hydrated"]')).toHaveCSS('width', '1px');
await expect(page.locator('[data-id="collection-hydrated"]')).toHaveCSS('height', '1px');
await expect(page.locator('[data-id="collection-hydrated"]')).toHaveCSS('overflow', 'hidden');
await expect(page.locator('[data-id="collection-hydrated"]')).toHaveCSS('color', 'rgba(0, 0, 0, 0)');
```

- [ ] **Step 2: Verify RED**

Run:

```bash
corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/collection.spec.ts
```

Expected: FAIL because both probe widths are not `1px` before the Vue styles are added.

### Task 2: Hide SSR Probe Nodes

**Files:**
- Modify: `src/client/modules/ranklist/ranklist.view.vue`
- Modify: `src/client/modules/collection/collection.view.vue`

- [ ] **Step 1: Implement minimal Vue changes**

Update the probe nodes:

```vue
<div data-id="ranklist-hydrated" class="ranklist-hydrated">{{ hydrated ? 'hydrated' : 'ssr' }}</div>
```

```vue
<div data-id="collection-hydrated" class="collection-hydrated">{{ hydrated ? 'hydrated' : 'ssr' }}</div>
```

Add scoped styles:

```less
.ranklist-hydrated {
  width: 1px;
  height: 1px;
  overflow: hidden;
  color: transparent;
}
```

```less
.collection-hydrated {
  width: 1px;
  height: 1px;
  overflow: hidden;
  color: transparent;
}
```

- [ ] **Step 2: Verify GREEN**

Run:

```bash
corepack pnpm test:e2e:full-chain -- tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/collection.spec.ts
```

Expected: PASS.

### Task 3: Update Migration Docs And Full Gate

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [ ] **Step 1: Record the verified slice**

Update the dashboard and acceptance documents to mention SSR hydration marker visual parity for ranklist and collection.

- [ ] **Step 2: Run the full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: all commands pass.

- [ ] **Step 3: Commit**

Run:

```bash
git add tests/e2e/full-chain/ranklist.spec.ts tests/e2e/full-chain/collection.spec.ts src/client/modules/ranklist/ranklist.view.vue src/client/modules/collection/collection.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-ssr-hydration-marker-visual-parity-design.md docs/superpowers/plans/2026-05-27-ssr-hydration-marker-visual-parity.md
git commit -m "fix: 隐藏榜单合集水合测试标记"
```
