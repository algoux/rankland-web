# Collection Empty Heading Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React `h3.pt-16.text-center` class contract for the collection empty-selection state.

**Architecture:** Keep the existing Vue collection wrapper and migrated hooks, adding only the old utility tokens to the empty-state heading. Verify through the full-chain collection route because this is public DOM behavior.

**Tech Stack:** Vue 3 SFC, Playwright full-chain E2E, RankLand mock backend.

---

### Task 1: Add RED Assertion

**Files:**
- Modify: `tests/e2e/full-chain/collection.spec.ts`

- [ ] **Step 1: Write the failing full-chain assertion**

In `renders collection empty state when no rankId is selected`, add:

```ts
await expect(page.locator('[data-id="collection-empty-state"] h3')).toHaveClass(/(^|\s)pt-16(\s|$)/);
await expect(page.locator('[data-id="collection-empty-state"] h3')).toHaveClass(/(^|\s)text-center(\s|$)/);
```

- [ ] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "renders collection empty state when no rankId is selected"
```

Expected: FAIL because the current empty-state `h3` has no `pt-16` class token.

### Task 2: Restore Empty Heading Class Tokens

**Files:**
- Modify: `src/client/modules/collection/collection.view.vue`

- [ ] **Step 1: Add the old utility classes**

Change:

```vue
<h3>请展开左侧边栏并选择一个榜单</h3>
```

To:

```vue
<h3 class="pt-16 text-center">请展开左侧边栏并选择一个榜单</h3>
```

- [ ] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/collection.spec.ts -g "renders collection empty state when no rankId is selected"
```

Expected: PASS and existing computed spacing assertions remain green.

### Task 3: Document, Gate, Commit

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [ ] **Step 1: Update migration docs**

Record that collection empty-selection `h3.pt-16.text-center` is now verified as DOM/class parity, not only computed style parity.

- [ ] **Step 2: Run full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: PASS with Node `v24.11.1`, pnpm `8.15.9`, generated 8 client routes, build, unit, SSR, shallow E2E, full-chain E2E, and no whitespace errors.

- [ ] **Step 3: Commit**

Run:

```bash
git add src/client/modules/collection/collection.view.vue tests/e2e/full-chain/collection.spec.ts docs/superpowers/specs/2026-05-27-collection-empty-heading-class-parity-design.md docs/superpowers/plans/2026-05-27-collection-empty-heading-class-parity.md docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md
git commit -m "fix: 还原合集空状态标题类名"
```

Expected: commit succeeds on `migration/live-page-foundation`.
