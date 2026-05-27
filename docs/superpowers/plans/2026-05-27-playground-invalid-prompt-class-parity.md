# Playground Invalid Prompt Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React `h3.mt-16.text-center` class contract for the Playground invalid JSON prompt.

**Architecture:** Keep the Vue Playground parse/editor flow unchanged. Add focused full-chain assertions to the existing invalid JSON scenario, then add the old utility classes to the prompt heading.

**Tech Stack:** Vue 3 SFC, Ant Design Vue Tag, Playwright full-chain tests, pnpm migration gates.

---

### Task 1: RED Full-Chain Coverage

**Files:**
- Modify: `tests/e2e/full-chain/playground.spec.ts`

- [x] **Step 1: Add invalid prompt h3 class assertions**

In `shows invalid JSON state after previewing malformed source`, after the existing text assertion, add:

```ts
await expect(page.locator('[data-id="playground-invalid-json"] h3')).toHaveClass(/(^|\s)mt-16(\s|$)/);
await expect(page.locator('[data-id="playground-invalid-json"] h3')).toHaveClass(/(^|\s)text-center(\s|$)/);
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts --grep "shows invalid JSON state"
```

Expected: FAIL because the current invalid JSON `h3` has no old utility class tokens.

### Task 2: Restore h3 Utility Classes

**Files:**
- Modify: `src/client/modules/playground/playground.view.vue`

- [x] **Step 1: Add old classes to the invalid JSON heading**

Change the invalid prompt heading to:

```vue
<h3 class="mt-16 text-center">
  Input valid srk JSON and press
  <a-tag color="blue" class="playground-shortcut-tag">Ctrl/Cmd + S</a-tag>
  to preview
</h3>
```

Do not change parse state logic, Monaco hooks, the shortcut tag, or preview behavior.

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/playground.spec.ts --grep "shows invalid JSON state"
```

Expected: PASS.

### Task 3: Verify, Document, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-27-playground-invalid-prompt-class-parity.md`

- [x] **Step 1: Update migration docs**

Record Playground invalid prompt `h3.mt-16.text-center` parity in the route coverage, manual checklist notes, and final integration review.

- [x] **Step 2: Run the full gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: all commands pass.

- [x] **Step 3: Commit**

Run:

```bash
git add src/client/modules/playground/playground.view.vue tests/e2e/full-chain/playground.spec.ts docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-playground-invalid-prompt-class-parity-design.md docs/superpowers/plans/2026-05-27-playground-invalid-prompt-class-parity.md
git commit -m "fix: 还原演练场无效提示旧版类名"
```
