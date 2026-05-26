# Playground Shortcut Tag Spacing Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React invalid JSON prompt shortcut tag spacing in `/playground`.

**Architecture:** Keep the current Vue Playground invalid JSON prompt and Ant Design Vue `a-tag`. Change only the shortcut tag margin to match the old React `className="mr-0"` behavior.

**Tech Stack:** Vue 3 SFC, scoped Less, Ant Design Vue Tag, Playwright full-chain E2E.

---

### Task 1: Restore Shortcut Tag Margin

**Files:**
- Modify: `tests/e2e/full-chain/playground.spec.ts`
- Modify: `src/client/modules/playground/playground.view.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [ ] **Step 1: Write the failing test**

Add these assertions to the existing invalid JSON test after the prompt alignment assertions:

```ts
await expect(page.locator('[data-id="playground-invalid-json"] .playground-shortcut-tag')).toHaveCSS(
  'margin-right',
  '0px',
);
await expect(page.locator('[data-id="playground-invalid-json"] .playground-shortcut-tag')).toHaveCSS(
  'margin-left',
  '0px',
);
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts --grep "shows invalid JSON state"
```

Expected: FAIL because `.playground-shortcut-tag` currently uses `margin: 0 4px`.

- [ ] **Step 3: Restore old tag spacing**

Change `src/client/modules/playground/playground.view.vue` from:

```less
.playground-shortcut-tag {
  margin: 0 4px;
}
```

to:

```less
.playground-shortcut-tag {
  margin-left: 0;
  margin-right: 0;
}
```

- [ ] **Step 4: Run focused verification**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts --grep "shows invalid JSON state"
```

Expected: PASS.

- [ ] **Step 5: Update migration docs**

Record that Playground invalid JSON prompt now preserves the old `Tag.mr-0` shortcut spacing.

- [ ] **Step 6: Run full gate and commit**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node 24, pnpm 8, route generation succeeds, all migration tests pass, and `git diff --check` exits cleanly.

Commit:

```bash
git add tests/e2e/full-chain/playground.spec.ts src/client/modules/playground/playground.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-playground-shortcut-tag-spacing-parity-design.md docs/superpowers/plans/2026-05-27-playground-shortcut-tag-spacing-parity.md
git commit -m "fix: 还原演练场快捷键标签间距"
```
