# Collection Nav Legacy Chrome Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the collection page's old navigation chrome color tokens and hidden-title DOM.

**Architecture:** Keep the existing Vue collection view and Ant Design Vue menu implementation. Make a focused template/CSS parity adjustment and prove it through the full-chain collection route.

**Tech Stack:** Vue 3 SFC, Ant Design Vue, Playwright full-chain E2E, RankLand mock backend.

---

### Task 1: Add Failing Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/collection.spec.ts`

- [ ] **Step 1: Extend the existing menu/chrome test**

Add assertions to `renders the legacy Ant Design collection menu with category icons`:

```ts
const nav = page.locator('[data-id="collection-nav"]');
await expect(nav).toHaveCSS('background-color', 'rgb(244, 244, 244)');
await expect(page.locator('.srk-collection-hidden-header')).toBeVisible();
await expect(page.locator('.srk-collection-hidden-header h3.mb-0')).toHaveText('榜单合集');

await page.emulateMedia({ colorScheme: 'dark' });
await expect(page.locator('html')).toHaveClass('dark');
await expect(nav).toHaveCSS('background-color', 'rgb(17, 17, 17)');
await expect(nav).toHaveCSS('border-right-color', 'rgb(67, 67, 67)');
```

- [ ] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts --grep "legacy Ant Design collection menu"
```

Expected: FAIL because the current Vue page uses `rgb(247, 247, 247)` and `.collection-hidden-header h2`.

### Task 2: Restore Collection Nav Chrome

**Files:**
- Modify: `src/client/modules/collection/collection.view.vue`

- [ ] **Step 1: Update hidden header DOM**

Render the wrapper with the legacy class and the title as `h3.mb-0`:

```vue
<div class="srk-collection-hidden-header collection-hidden-header" :style="hiddenHeaderStyle">
  <img :src="logo" alt="RankLand" width="32" height="32">
  <h3 class="mb-0">榜单合集</h3>
</div>
```

- [ ] **Step 2: Update nav colors and h3 selectors**

Set `.collection-nav` light background to `#f4f4f4`, add the dark override as `html.dark .collection-nav`, and update hidden-header heading selectors from `h2` to `h3`. Do not use `:global(html.dark) .collection-nav`: Vue 3.2 scoped LESS compiles that form into an `html.dark` rule instead of a nav rule.

- [ ] **Step 3: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts --grep "legacy Ant Design collection menu"
```

Expected: PASS.

### Task 3: Document, Gate, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [ ] **Step 1: Update migration docs**

Record the collection nav legacy chrome parity slice, including hidden header DOM and light/dark nav color tokens.

- [ ] **Step 2: Run full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: PASS.

- [ ] **Step 3: Commit**

Run:

```bash
git add tests/e2e/full-chain/collection.spec.ts src/client/modules/collection/collection.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-collection-nav-legacy-chrome-parity-design.md docs/superpowers/plans/2026-05-27-collection-nav-legacy-chrome-parity.md
git commit -m "fix: 还原合集页导航旧版色值"
```

Expected: commit succeeds with a clean worktree afterward.
