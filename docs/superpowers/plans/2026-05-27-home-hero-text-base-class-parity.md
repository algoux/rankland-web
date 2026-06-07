# Home Hero Text Base Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old React `text-base` class token on the RankLand home hero paragraph.

**Architecture:** Keep the existing Vue home structure and scoped paragraph styles. Add a focused full-chain assertion before implementation, then add the minimal DOM class needed to satisfy old React parity.

**Tech Stack:** Vue 3, Playwright full-chain E2E, RankLand migration docs.

---

## File Ownership

- Create: `docs/superpowers/specs/2026-05-27-home-hero-text-base-class-parity-design.md`
- Create: `docs/superpowers/plans/2026-05-27-home-hero-text-base-class-parity.md`
- Modify: `tests/e2e/full-chain/home.spec.ts`
- Modify: `src/client/modules/home/home.view.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

### Task 1: Document The Slice

**Files:**
- Create: `docs/superpowers/specs/2026-05-27-home-hero-text-base-class-parity-design.md`
- Create: `docs/superpowers/plans/2026-05-27-home-hero-text-base-class-parity.md`

- [x] **Step 1: Save the design spec**

Record the old React `p.text-base` behavior, the Vue missing-class gap, test strategy, and acceptance criteria in the design spec.

- [x] **Step 2: Save this implementation plan**

Record file ownership, RED/GREEN steps, migration doc updates, full gate command, and commit boundary.

### Task 2: Add The Failing Test

**Files:**
- Modify: `tests/e2e/full-chain/home.spec.ts`

- [x] **Step 1: Write the failing assertion**

Add this assertion beside the existing hero paragraph color check:

```ts
await expect(page.locator('[data-id="home-hero"] p')).toHaveClass(/(^|\s)text-base(\s|$)/);
```

- [x] **Step 2: Run focused RED**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts -g "renders the RankLand home page through SSR"
```

Expected: FAIL because the current Vue paragraph has no `text-base` class.

### Task 3: Restore The Class Token

**Files:**
- Modify: `src/client/modules/home/home.view.vue`

- [x] **Step 1: Add the old class token**

Change the hero copy paragraph to:

```vue
<p class="text-base">
```

- [x] **Step 2: Run focused GREEN**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/home.spec.ts -g "renders the RankLand home page through SSR"
```

Expected: PASS, including the new class assertion and existing visual assertions.

### Task 4: Update Migration Records

**Files:**
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`
- Modify: `docs/superpowers/plans/2026-05-27-home-hero-text-base-class-parity.md`

- [x] **Step 1: Record the slice**

Update the current focus, home route evidence, manual checklist home section, final review home evidence, final gate result, and this plan's checkbox states.

- [x] **Step 2: Run the full migration gate**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: PASS with generated 8 client routes, full migration tests green, and whitespace check clean.

### Task 5: Commit The Slice

**Files:**
- Commit all files changed by this plan.

- [x] **Step 1: Review diff**

Run:

```bash
git diff -- tests/e2e/full-chain/home.spec.ts src/client/modules/home/home.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-home-hero-text-base-class-parity-design.md docs/superpowers/plans/2026-05-27-home-hero-text-base-class-parity.md
```

- [x] **Step 2: Commit**

Run:

```bash
git add tests/e2e/full-chain/home.spec.ts src/client/modules/home/home.view.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-home-hero-text-base-class-parity-design.md docs/superpowers/plans/2026-05-27-home-hero-text-base-class-parity.md
git commit -m "fix: 还原首页 Hero 文案类名"
```

- [x] **Step 3: Verify committed state**

Run:

```bash
git status --short --branch
git show --check --oneline HEAD
git diff --check
```

Expected: clean worktree on `migration/live-page-foundation`, commit check passes, and no whitespace errors.
