# Playground Legacy Shell Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React `srk-playground-container` and `srk-playground-preview` class tokens in the Vue Playground route.

**Architecture:** Keep the existing Vue Playground layout hooks and styles. Add full-chain coverage for the old class tokens, then append the legacy classes beside the existing `.playground-layout` and `.playground-preview-pane` hooks.

**Tech Stack:** Vue 3 SFC, Playwright full-chain tests, pnpm migration gates.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/playground.spec.ts`

- [x] **Step 1: Add legacy shell class assertions**

In `hydrates the CSR playground and previews bundled SRK without upstream calls`, after the existing `.playground-layout` style assertions, add:

```ts
await expect(page.locator('.playground-layout')).toHaveClass(/(^|\s)srk-playground-container(\s|$)/);
await expect(page.locator('.playground-preview-pane')).toHaveClass(/(^|\s)srk-playground-preview(\s|$)/);
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts --grep "hydrates the CSR playground"
```

Expected: FAIL because the current Vue layout and preview pane do not carry the old class tokens.

### Task 2: Restore Legacy Shell Classes

**Files:**
- Modify: `src/client/modules/playground/playground.view.vue`

- [x] **Step 1: Add old classes beside existing Vue hooks**

Change the layout section and preview pane to:

```vue
<section class="playground-layout srk-playground-container" :style="{ height: `${remainingHeight}px` }">
```

```vue
<div class="playground-preview-pane srk-playground-preview">
```

Do not remove existing classes or change any CSS rules.

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts --grep "hydrates the CSR playground"
```

Expected: PASS.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-27-playground-legacy-shell-class-parity.md`

- [x] **Step 1: Update migration docs**

Record Playground legacy shell class parity in the route coverage, manual checklist notes, and final integration review.

- [x] **Step 2: Run the full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: all commands pass.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/modules/playground/playground.view.vue tests/e2e/full-chain/playground.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-playground-legacy-shell-class-parity-design.md docs/superpowers/plans/2026-05-27-playground-legacy-shell-class-parity.md
git commit -m "fix: 还原演练场旧版外壳类名"
```
