# User Modal Slogan Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old `.slogan` class on the shared SRK user modal slogan element.

**Architecture:** Add the legacy class to the existing slogan `<p>`. Keep the current `.rankland-user-modal-slogan` class and `data-id` hook as the migration-specific test/style anchors.

**Tech Stack:** Vue 3 SFC, SRK Vue Modal, Playwright full-chain E2E.

---

### Task 1: Restore User Modal Slogan Class

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `src/client/components/rankland-ranklist.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Write the failing test**

Add this assertion after the slogan text assertion in the main ranklist full-chain user-modal coverage:

```ts
await expect(slogan).toHaveClass(/slogan/);
```

- [x] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Result: FAIL because the Vue slogan element did not carry `.slogan`. The first loose `/slogan/` assertion was tightened to `/(^|\s)slogan(\s|$)/` after it falsely matched `.rankland-user-modal-slogan`.

- [x] **Step 3: Restore old slogan class**

Change the slogan class to:

```vue
class="rankland-user-modal-slogan slogan"
```

- [x] **Step 4: Run focused verification**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Result: PASS.

- [x] **Step 5: Update migration docs**

Record user-modal `.slogan` class parity in the migration dashboard, manual checklist, and final integration review.

- [x] **Step 6: Run full gate and commit**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Result: Node 24, pnpm 8, route generation succeeded, all migration tests passed, and `git diff --check` exited cleanly.

Commit:

```bash
git add tests/e2e/full-chain/ranklist.spec.ts src/client/components/rankland-ranklist.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-user-modal-slogan-class-parity-design.md docs/superpowers/plans/2026-05-27-user-modal-slogan-class-parity.md
git commit -m "fix: 还原用户弹窗旧版标语类名"
```
