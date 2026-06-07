# User Modal Team Members Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore old `mt-2` class token on the shared SRK user modal team-members container.

**Architecture:** Add the old class token to the existing team-members `<div>`. Keep `.rankland-user-modal-team-members` as the scoped style source for the verified `8px` top spacing.

**Tech Stack:** Vue 3 SFC, SRK Vue Modal, Playwright full-chain E2E.

---

### Task 1: Restore User Modal Team Members Class

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `src/client/components/rankland-ranklist.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Write the failing test**

Add this assertion after the team-members text/separator assertions:

```ts
await expect(teamMembers).toHaveClass(/(^|\s)mt-2(\s|$)/);
```

Also include the existing `8px` top margin in the computed style assertion.

- [x] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Result: FAIL because the Vue team-members container did not carry `mt-2`.

- [x] **Step 3: Restore old team-members class**

Change the team-members container class to:

```vue
class="rankland-user-modal-team-members user-modal-info-team-members mt-2"
```

- [x] **Step 4: Run focused verification**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Result: PASS.

- [x] **Step 5: Update migration docs**

Record user-modal team-members `mt-2` class parity in the migration dashboard, manual checklist, and final integration review.

- [x] **Step 6: Run full gate and commit**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Result: Node 24, pnpm 8, route generation succeeded, all migration tests passed, and `git diff --check` exited cleanly.

Commit:

```bash
git add tests/e2e/full-chain/ranklist.spec.ts src/client/components/rankland-ranklist.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-user-modal-team-members-class-parity-design.md docs/superpowers/plans/2026-05-27-user-modal-team-members-class-parity.md
git commit -m "fix: 还原用户弹窗旧版团队成员类名"
```
