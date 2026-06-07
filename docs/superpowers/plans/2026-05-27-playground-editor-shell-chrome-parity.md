# Playground Editor Shell Chrome Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Vue-only border and rounded-corner chrome from the Playground Monaco editor wrapper.

**Architecture:** Keep the existing Vue wrapper as the stable data-id host for E2E and Monaco sizing. Change only the wrapper CSS so it no longer adds border or radius that old React did not render.

**Tech Stack:** Vue 3 SFC, scoped Less, Monaco editor wrapper, Playwright full-chain E2E.

---

### Task 1: Remove Editor Wrapper Chrome

**Files:**
- Modify: `tests/e2e/full-chain/playground.spec.ts`
- Modify: `src/client/modules/playground/playground.view.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [ ] **Step 1: Write the failing test**

Add these assertions to the existing Playground hydration test after the editor diagnostics assertions:

```ts
await expect(page.locator('[data-id="playground-editor"]')).toHaveCSS('border-top-width', '0px');
await expect(page.locator('[data-id="playground-editor"]')).toHaveCSS('border-radius', '0px');
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts --grep "hydrates the CSR playground"
```

Expected: FAIL because the Vue wrapper currently has `border: 1px solid #cbd5e1` and `border-radius: 4px`.

- [ ] **Step 3: Remove Vue-only chrome**

Change `src/client/modules/playground/playground.view.vue` by deleting these declarations from `.playground-editor`:

```less
border: 1px solid #cbd5e1;
border-radius: 4px;
```

Keep `box-sizing`, `width`, `min-height`, and `overflow` unchanged.

- [ ] **Step 4: Run focused verification**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts --grep "hydrates the CSR playground"
```

Expected: PASS.

- [ ] **Step 5: Update migration docs**

Record that the Playground editor host no longer adds Vue-only border/radius chrome.

- [ ] **Step 6: Run full gate and commit**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node 24, pnpm 8, route generation succeeds, all migration tests pass, and `git diff --check` exits cleanly.

Commit:

```bash
git add tests/e2e/full-chain/playground.spec.ts src/client/modules/playground/playground.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-playground-editor-shell-chrome-parity-design.md docs/superpowers/plans/2026-05-27-playground-editor-shell-chrome-parity.md
git commit -m "fix: 移除演练场编辑器外壳边框"
```
