# Playground Flex Layout Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React Playground desktop flex layout: fixed 500px Monaco editor plus growing preview pane.

**Architecture:** Keep the existing Vue Playground component and Monaco integration. Change only the layout contract: bind `remainingHeight` to the layout container, replace grid/max-width desktop CSS with flex/500px/flex-preview CSS, and keep the current mobile column override for no-overflow verification.

**Tech Stack:** Vue 3 single-file component, scoped Less, Playwright full-chain E2E, bwcx/vite-ssr.

---

### Task 1: Lock Desktop Flex Layout

**Files:**
- Modify: `tests/e2e/full-chain/playground.spec.ts`
- Modify: `src/client/modules/playground/playground.view.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [ ] **Step 1: Write the failing test**

Add these assertions after the Playground editor diagnostics assertions in `tests/e2e/full-chain/playground.spec.ts`:

```ts
await expect(page.locator('.playground-layout')).toHaveCSS('display', 'flex');
await expect(page.locator('.playground-layout')).toHaveCSS('max-width', 'none');
await expect(page.locator('.playground-editor-pane')).toHaveCSS('width', '500px');
await expect(page.locator('.playground-preview-pane')).toHaveCSS('flex-grow', '1');
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts --grep "hydrates the CSR playground"
```

Expected: FAIL because `.playground-layout` is currently `display: grid` and has `max-width: 1280px`.

- [ ] **Step 3: Restore the layout CSS**

In `src/client/modules/playground/playground.view.vue`:

- add `:style="{ height: `${remainingHeight}px` }"` to `<section class="playground-layout">`;
- remove `padding: 24px 16px` from `.playground-page`;
- change `.playground-layout` to `display: flex;`;
- remove `grid-template-columns`, `gap`, `max-width`, and centered margin from `.playground-layout`;
- set `.playground-editor-pane` to `flex: 0 0 500px; width: 500px;`;
- set `.playground-preview-pane` to `flex: 1;`;
- update the narrow-screen media rule to `flex-direction: column; height: auto !important;` and let `.playground-editor-pane` use `width: 100%; flex-basis: auto;`.

- [ ] **Step 4: Run focused verification**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts --grep "hydrates the CSR playground"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts --grep "keeps playground editor and preview within desktop and mobile viewport bounds"
```

Expected: both commands pass.

- [ ] **Step 5: Update migration docs**

Record that Playground now restores the old desktop flex/500px/flex-preview layout while retaining the migrated mobile no-overflow guard.

- [ ] **Step 6: Run full gate and commit**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node 24, pnpm 8, route generation succeeds, all migration tests pass, and `git diff --check` exits cleanly.

Commit:

```bash
git add tests/e2e/full-chain/playground.spec.ts src/client/modules/playground/playground.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-playground-flex-layout-parity-design.md docs/superpowers/plans/2026-05-27-playground-flex-layout-parity.md
git commit -m "fix: 还原演练场旧版弹性布局"
```
