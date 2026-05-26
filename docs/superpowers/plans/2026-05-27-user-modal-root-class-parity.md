# User Modal Root Class Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old `.user-modal` root class on the shared SRK user modal body.

**Architecture:** Add the legacy class to the existing modal body element. Keep the current `.rankland-user-modal-body` class as the stable migration hook and styling target.

**Tech Stack:** Vue 3 SFC, SRK Vue Modal, Playwright full-chain E2E.

---

### Task 1: Restore User Modal Root Class

**Files:**
- Modify: `tests/e2e/full-chain/ranklist.spec.ts`
- Modify: `src/client/components/rankland-ranklist.vue`
- Modify: `docs/migration/status.md`
- Modify: `docs/migration/manual-acceptance-checklist.md`
- Modify: `docs/migration/final-integration-review.md`

- [x] **Step 1: Write the failing test**

Add this assertion after the modal title assertion in the main ranklist full-chain user-modal coverage:

```ts
await expect(userModal.locator('.user-modal')).toBeVisible();
```

- [x] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Expected: FAIL because the Vue modal body does not carry `.user-modal`.

- [x] **Step 3: Restore old root class**

Change the modal body root to:

```vue
<div v-if="activeUserPayload" class="rankland-user-modal-body user-modal">
```

- [x] **Step 4: Run focused verification**

Run:

```bash
corepack pnpm exec playwright test -c playwright.full-chain.config.ts tests/e2e/full-chain/ranklist.spec.ts --grep "renders the ranklist detail page"
```

Expected: PASS.

- [x] **Step 5: Update migration docs**

Record user-modal `.user-modal` root class parity in the migration dashboard, manual checklist, and final integration review.

- [x] **Step 6: Run full gate and commit**

Run:

```bash
node -v && corepack pnpm -v && corepack pnpm run gen:client-router && corepack pnpm test:migration && git diff --check
```

Expected: Node 24, pnpm 8, route generation succeeds, all migration tests pass, and `git diff --check` exits cleanly.

Commit:

```bash
git add tests/e2e/full-chain/ranklist.spec.ts src/client/components/rankland-ranklist.vue docs/migration/status.md docs/migration/manual-acceptance-checklist.md docs/migration/final-integration-review.md docs/superpowers/specs/2026-05-27-user-modal-root-class-parity-design.md docs/superpowers/plans/2026-05-27-user-modal-root-class-parity.md
git commit -m "fix: 还原用户弹窗旧版根类"
```
