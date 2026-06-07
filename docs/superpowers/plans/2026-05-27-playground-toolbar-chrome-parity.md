# Playground Toolbar Chrome Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Vue-only visible Playground toolbar chrome so the page starts with the editor/preview surface like old React.

**Architecture:** This is a small Playground template/CSS parity slice backed by a full-chain Playwright regression. The hydration probe remains in the DOM but becomes layout-hidden; Monaco, preview, docs link, welcome modal, and data flow stay unchanged.

**Tech Stack:** Vue 3 SFC scoped LESS, Playwright full-chain E2E, RankLand migration docs.

---

### Task 1: Write the Failing Full-Chain Test

**Files:**
- Modify: `tests/e2e/full-chain/playground.spec.ts`

- [ ] **Step 1: Add no-toolbar assertions**

In `hydrates the CSR playground and previews bundled SRK without upstream calls`, after the existing hydration marker CSS assertions, add:

```ts
await expect(page.locator('[data-id="playground-hydrated"]')).toHaveCSS('position', 'absolute');
await expect(page.locator('.playground-toolbar')).toHaveCount(0);
await expect(page.getByRole('heading', { name: 'Playground' })).toHaveCount(0);
```

- [ ] **Step 2: Verify RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts --grep "hydrates the CSR playground"
```

Expected: FAIL because the marker currently computes as `position: static` and `.playground-toolbar h1` still exists.

### Task 2: Remove the Toolbar Chrome

**Files:**
- Modify: `src/client/modules/playground/playground.view.vue`

- [ ] **Step 1: Move the hydration marker out of the toolbar**

Replace:

```vue
<section class="playground-toolbar">
  <div data-id="playground-hydrated" class="playground-hydrated">{{ hydrated ? 'hydrated' : 'csr' }}</div>
  <h1>Playground</h1>
</section>
```

with:

```vue
<div data-id="playground-hydrated" class="playground-hydrated">{{ hydrated ? 'hydrated' : 'csr' }}</div>
```

- [ ] **Step 2: Remove toolbar CSS and make the marker layout-hidden**

Delete `.playground-toolbar` and its nested `h1` rule. Update `.playground-hydrated`:

```less
.playground-hydrated {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  color: transparent;
}
```

- [ ] **Step 3: Verify GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts --grep "hydrates the CSR playground"
```

Expected: PASS.

### Task 3: Update Migration Records and Gate

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [ ] **Step 1: Record the verified slice**

Mention that `/playground` no longer renders the Vue-only visible toolbar/heading and keeps hidden hydration/editor-ready probes.

- [ ] **Step 2: Run the completed-slice gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node 24, pnpm 8, router generation succeeds, migration tests pass, and whitespace check passes.

- [ ] **Step 3: Commit**

Run:

```bash
git add src/client/modules/playground/playground.view.vue tests/e2e/full-chain/playground.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-playground-toolbar-chrome-parity-design.md docs/superpowers/plans/2026-05-27-playground-toolbar-chrome-parity.md
git commit -m "fix: 移除演练场旧版不存在的标题栏"
```
