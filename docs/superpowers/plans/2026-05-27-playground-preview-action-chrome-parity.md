# Playground Preview Action Chrome Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Vue-only visible Playground `Preview` button so `/playground` matches the old React `SrkPlayground` chrome.

**Architecture:** Keep the current Monaco editor, E2E preview hook, welcome modal, docs link, parser, and SRK preview path. This slice only changes the rendered action chrome and the full-chain assertions that currently treat that button as a viewport-bounds target.

**Tech Stack:** Vue 3, Ant Design Vue, Playwright full-chain E2E, bwcx/vite-ssr.

---

### Task 1: Lock Old Chrome Contract

**Files:**
- Modify: `tests/e2e/full-chain/playground.spec.ts`
- Modify: `src/client/modules/playground/playground.view.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [ ] **Step 1: Write the failing test**

Add `await expect(page.locator('[data-id="playground-preview-action"]')).toHaveCount(0);` to the Playground hydration test after Monaco is visible. Replace desktop and mobile viewport-bound checks for the same selector with count-zero checks.

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts --grep "hydrates the CSR playground"
```

Expected: FAIL because the existing Vue page still renders one `[data-id="playground-preview-action"]`.

- [ ] **Step 3: Remove the visible action**

Delete the `<a-button data-id="playground-preview-action">Preview</a-button>` block from `src/client/modules/playground/playground.view.vue` and remove the `.playground-preview-action` style. Keep `previewSource()` because Monaco `Ctrl/Cmd + S` and the E2E hook still use the parser path.

- [ ] **Step 4: Run focused verification**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts --grep "hydrates the CSR playground"
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts --grep "keeps playground editor and preview within desktop and mobile viewport bounds"
```

Expected: both commands pass.

- [ ] **Step 5: Update migration docs**

Record that Playground no longer has the Vue-only visible preview button, and that the product preview path is Monaco change plus `Ctrl/Cmd + S` with the stable E2E hook for harness-only state injection.

- [ ] **Step 6: Run full gate and commit**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node 24, pnpm 8, route generation succeeds, all migration tests pass, and `git diff --check` exits cleanly.

Commit:

```bash
git add tests/e2e/full-chain/playground.spec.ts src/client/modules/playground/playground.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-playground-preview-action-chrome-parity-design.md docs/superpowers/plans/2026-05-27-playground-preview-action-chrome-parity.md
git commit -m "fix: 移除演练场旧版不存在的预览按钮"
```
